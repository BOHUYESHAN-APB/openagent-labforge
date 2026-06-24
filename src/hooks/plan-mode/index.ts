/**
 * Plan Mode Hook
 *
 * Handles the plan_enter/plan_exit tool lifecycle:
 * - tool.execute.before: Intercepts plan_enter to activate plan overlay,
 *   and plan_exit to clear it. Also denies plan_enter when already in plan mode.
 * - system.transform: Injects plan-mode instructions on top of the prometheus
 *   prompt when the plan overlay is active.
 */
import { PLAN_MODE_INSTRUCTIONS } from '../../agents/prompts/prometheus/plan-mode-instructions';
import type { EffectiveAgentOverlayManager } from '../../utils/effective-agent-overlay';

export interface PlanModeHookOptions {
  overlayManager: EffectiveAgentOverlayManager;
  getCurrentAgent: (sessionID: string) => string | undefined;
}

export function createPlanModeHook(options: PlanModeHookOptions) {
  return {
    'tool.execute.before': (
      input: { tool: string; sessionID?: string },
      output: { args?: Record<string, unknown>; [key: string]: unknown },
    ): void => {
      const { tool, sessionID } = input;
      if (!sessionID) return;

      // If plan overlay is active, deny dangerous tools
      const activeOverlay = options.overlayManager.getCurrent(sessionID);
      const DENIED_IN_PLAN_MODE = new Set([
        'write',
        'edit',
        'bash',
        'exec',
        'execute_command',
        'powershell',
        'shell',
        'task',
        'subtask',
      ]);

      if (
        activeOverlay?.phase === 'plan' &&
        DENIED_IN_PLAN_MODE.has(tool)
      ) {
        output.args = {
          _denied: true,
          error:
            `Plan mode is read-only. Tool "${tool}" is not allowed during planning. ` +
            'Use plan_exit to return to the original agent if you need to modify files or run commands.',
        };
        return;
      }

      if (tool === 'plan_enter') {
        // Already in plan mode? Deny.
        const currentOverlay = options.overlayManager.getCurrent(sessionID);
        if (currentOverlay?.phase === 'plan') {
          output.args = {
            _denied: true,
            error:
              'Already in plan mode. Only the original agent (not prometheus) can call plan_enter.',
          };
          return;
        }

        // Save current agent as returnAgent, then activate plan overlay
        const returnAgent =
          options.getCurrentAgent(sessionID) ?? 'orchestrator';
        options.overlayManager.activate(sessionID, {
          phase: 'plan',
          agent: 'prometheus',
          source: 'plan-enter-tool',
          returnAgent,
        });

        // Mirror command.execute.before pattern (used by /ol-start-work):
        // Set output.message.agent to change the caller's user-message agent,
        // so OpenCode reads lastUser.agent = 'prometheus' and switches agent.
        // This is how /ol-start-work switches to executor (atlas) agent.
        if ('message' in output) {
          const msg = (output as { message?: { agent?: string } }).message;
          if (msg) msg.agent = 'prometheus';
        }
        return;
      }

      if (tool === 'plan_exit') {
        // Not in plan mode? Nothing to exit.
        const currentOverlay = options.overlayManager.getCurrent(sessionID);
        if (currentOverlay?.phase !== 'plan') {
          output.args = {
            _denied: true,
            error: 'Not in plan mode. Nothing to exit.',
          };
          return;
        }

        // Clear plan overlay
        options.overlayManager.clear(sessionID, 'plan');

        // Restore output.message.agent to returnAgent so OpenCode switches back
        if ('message' in output) {
          const msg = (output as { message?: { agent?: string } }).message;
          if (msg) {
            const returnAgent =
              currentOverlay?.returnAgent ?? options.getCurrentAgent(sessionID) ?? 'orchestrator';
            msg.agent = returnAgent;
          }
        }
        return;
      }
    },

    'experimental.chat.system.transform': (
      input: { sessionID?: string },
      output: { system: string[] },
    ): void => {
      if (!input.sessionID) return;

      const overlay = options.overlayManager.getCurrent(input.sessionID);
      if (overlay?.phase === 'plan') {
        // Append plan-mode instructions to the already-isolated prometheus prompt
        output.system.push(PLAN_MODE_INSTRUCTIONS);
      }
    },
  };
}
