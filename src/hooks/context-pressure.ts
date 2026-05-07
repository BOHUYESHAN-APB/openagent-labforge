import type { PluginInput } from '@opencode-ai/plugin';
import {
  buildPressureProfiles,
  ContextPressureMonitor,
} from '../context-pressure';
import { log } from '../utils/logger';

type OpencodeClient = PluginInput['client'];

type ProviderModel = {
  limit?: { context?: number };
};

type ProviderRecord = {
  id: string;
  models?: Record<string, ProviderModel | undefined>;
};

type ProvidersResponse = {
  data?: {
    providers?: ProviderRecord[];
  };
};

const HOOK_NAME = 'context-pressure';
const PROVIDER_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function createContextPressureHook(
  ctx: PluginInput,
  options?: {
    enabled?: boolean;
    profiles?: {
      engineering?: { l1?: number; l2?: number; l3?: number };
      bio?: { l1?: number; l2?: number; l3?: number };
    };
  },
): {
  handleEvent: (input: {
    event: { type: string; properties?: Record<string, unknown> };
  }) => Promise<void>;
  handleChatMessage: (input: { sessionID: string; agent?: string }) => void;
  handleSystemTransform: (
    input: { sessionID?: string },
    output: { system: string[] },
  ) => Promise<void>;
  shouldForceCheckpoint: (sessionID: string) => boolean;
  getRecommendedStrategy: (sessionID: string) => string;
  getState: (sessionID: string) => ReturnType<ContextPressureMonitor['getState']>;
} {
  const enabled = options?.enabled !== false;
  const monitor = new ContextPressureMonitor();
  const profiles = buildPressureProfiles(options?.profiles);
  const modelContextLimit = new Map<string, number>();
  let lastProviderRefreshAt = 0;
  let providerRefreshPromise: Promise<void> | null = null;

  function setProfileForAgent(sessionID: string, agent?: string): void {
    if (agent === 'bio-orchestrator') {
      monitor.setProfile(sessionID, profiles.bio);
      return;
    }
    monitor.setProfile(sessionID, profiles.engineering);
  }

  function getModelKey(providerID: string, modelID: string): string {
    return `${providerID}/${modelID}`;
  }

  async function refreshProviders(force = false): Promise<void> {
    if (!enabled) return;
    if (
      !force &&
      providerRefreshPromise === null &&
      Date.now() - lastProviderRefreshAt < PROVIDER_REFRESH_INTERVAL_MS
    ) {
      return;
    }
    if (providerRefreshPromise) {
      await providerRefreshPromise;
      return;
    }
    providerRefreshPromise = (async () => {
      try {
        const configClient = ctx.client.config as unknown as {
          providers: (parameters?: {
            directory?: string;
            workspace?: string;
          }) => Promise<ProvidersResponse>;
        };
        const result = await configClient.providers({ directory: ctx.directory });
        const providers = result.data?.providers ?? [];
        modelContextLimit.clear();
        for (const provider of providers) {
          for (const [modelID, model] of Object.entries(provider.models ?? {})) {
            const context = model?.limit?.context;
            if (typeof context !== 'number' || context <= 0) continue;
            modelContextLimit.set(getModelKey(provider.id, modelID), context);
          }
        }
        lastProviderRefreshAt = Date.now();
      } catch (error) {
        log(`[${HOOK_NAME}] Failed to refresh provider limits`, {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        providerRefreshPromise = null;
      }
    })();
    await providerRefreshPromise;
  }

  async function resolveContextLimit(
    providerID: string,
    modelID: string,
  ): Promise<number | undefined> {
    const key = getModelKey(providerID, modelID);
    const cached = modelContextLimit.get(key);
    if (cached) {
      void refreshProviders();
      return cached;
    }
    await refreshProviders(true);
    return modelContextLimit.get(key);
  }

  function buildPressureInstruction(sessionID: string): string | null {
    const state = monitor.getState(sessionID);
    if (!state || state.level <= 0) return null;

    const usage = `${Math.round(state.ratio * 100)}% (${state.totalTokens.toLocaleString()} / ${state.contextLimit.toLocaleString()} tokens)`;
    const strategy = monitor.getRecommendedStrategy(sessionID);
    const header = `[Context pressure: L${state.level} | usage ${usage} | strategy ${strategy}]`;

    if (state.level === 1) {
      return `${header}\nKeep responses concise. Avoid restating already known context, avoid large summaries, and prefer targeted edits/searches over broad recap.`;
    }

    if (state.level === 2) {
      return `${header}\nContext is materially pressured. Before starting a large new phase, prefer a light checkpoint or compact handoff packet, keep outputs delta-focused, avoid generating large repeated reasoning blocks, and if no compression plugin is active prepare a concise summary/checkpoint for the next turn or a fresh session.`;
    }

    return `${header}\nContext is critically pressured. Prioritize heavy compression/checkpoint behavior before further long work. Keep outputs minimal, avoid broad recaps, prefer checkpoint-first continuation over continuing with large context growth, and if no compression plugin is active explicitly prepare a restart-ready summary/handoff for the user or the next session.`;
  }

  async function handleEvent(input: {
    event: { type: string; properties?: Record<string, unknown> };
  }): Promise<void> {
    if (!enabled) return;
    const { event } = input;
    if (event.type === 'session.deleted') {
      const props = event.properties as
        | { info?: { id?: string }; sessionID?: string }
        | undefined;
      const sessionID = props?.info?.id ?? props?.sessionID;
      if (sessionID) {
        monitor.clearSession(sessionID);
      }
      return;
    }

    if (event.type !== 'message.updated') {
      return;
    }

    const info = (event.properties as { info?: Record<string, unknown> } | undefined)
      ?.info;
    if (!info || info.role !== 'assistant') {
      return;
    }

    const sessionID =
      typeof info.sessionID === 'string' ? info.sessionID : undefined;
    const providerID =
      typeof info.providerID === 'string' ? info.providerID : undefined;
    const modelID = typeof info.modelID === 'string' ? info.modelID : undefined;
    const tokens =
      info.tokens && typeof info.tokens === 'object'
        ? (info.tokens as {
            input?: number;
            output?: number;
            reasoning?: number;
            cache?: { read?: number; write?: number };
          })
        : undefined;

    if (!sessionID || !providerID || !modelID || !tokens) {
      return;
    }

    const totalTokens =
      (tokens.input ?? 0) +
      (tokens.output ?? 0) +
      (tokens.reasoning ?? 0) +
      (tokens.cache?.read ?? 0) +
      (tokens.cache?.write ?? 0);
    if (totalTokens <= 0) {
      return;
    }

    const contextLimit = await resolveContextLimit(providerID, modelID);
    if (!contextLimit || contextLimit <= 0) {
      return;
    }

    const previousLevel = monitor.getState(sessionID)?.level ?? 0;
    const nextState = monitor.updatePressure(sessionID, totalTokens, contextLimit);
    if (nextState.level !== previousLevel) {
      log(`[${HOOK_NAME}] Pressure level changed`, {
        sessionID,
        providerID,
        modelID,
        previousLevel,
        nextLevel: nextState.level,
        ratio: nextState.ratio,
        totalTokens,
        contextLimit,
      });
    }
  }

  function handleChatMessage(input: { sessionID: string; agent?: string }): void {
    if (!enabled) return;
    setProfileForAgent(input.sessionID, input.agent);
  }

  async function handleSystemTransform(
    input: { sessionID?: string },
    output: { system: string[] },
  ): Promise<void> {
    if (!enabled || !input.sessionID) return;
    const instruction = buildPressureInstruction(input.sessionID);
    if (!instruction) return;
    if (output.system.some((value) => value.includes('[Context pressure:'))) {
      return;
    }
    output.system.push(instruction);
  }

  return {
    handleEvent,
    handleChatMessage,
    handleSystemTransform,
    shouldForceCheckpoint: (sessionID) => {
      const state = monitor.getState(sessionID);
      return Boolean(state && state.level >= 2);
    },
    getRecommendedStrategy: (sessionID) =>
      monitor.getRecommendedStrategy(sessionID),
    getState: (sessionID) => monitor.getState(sessionID),
  };
}
