import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentDisplayConfig } from "../config/schema/agent-display"
import { AGENT_DISPLAY_PRESETS, DOMAIN_AGENTS } from "../config/schema/agent-display"
import { log } from "../shared/logger"

/**
 * Filter agents based on display mode configuration
 *
 * This function applies the agent display configuration to filter which agents
 * are visible to the user. It respects:
 * - Display mode (minimal/standard)
 * - Domain switches (bioinformatics/engineering)
 * - Explicit disabled/enabled agents
 */
export function filterAgentsByDisplayMode(
  agents: Record<string, AgentConfig>,
  config: AgentDisplayConfig
): Record<string, AgentConfig> {
  const mode = config.agent_display_mode ?? "minimal";
  const enableBio = config.enable_domains?.bioinformatics ?? true;   // 默认开启（主打生信）
  const enableEng = config.enable_domains?.engineering ?? true;      // 默认开启（不可缺少）

  // 获取预设列表
  const allowedAgents: string[] = [...AGENT_DISPLAY_PRESETS[mode]];

  // 添加领域相关的 agent
  if (enableBio) {
    allowedAgents.push(...DOMAIN_AGENTS.bioinformatics);
  }

  log("[agent-filter] Display mode:", mode);
  log("[agent-filter] Enable bio:", enableBio);
  log("[agent-filter] Allowed agents:", allowedAgents);
  log("[agent-filter] Input agents:", Object.keys(agents));

  // 过滤 agent
  const filtered = Object.fromEntries(
    Object.entries(agents).filter(([name, agentConfig]) => {
      // 检查是否在允许列表中
      if (!allowedAgents.includes(name)) {
        log(`[agent-filter] Filtered out ${name}: not in allowed list`);
        return false;
      }

      // 检查细粒度控制
      if (config.disabled_agents?.includes(name)) {
        log(`[agent-filter] Filtered out ${name}: in disabled_agents`);
        return false;
      }
      if (config.enabled_agents && config.enabled_agents.length > 0) {
        if (!config.enabled_agents.includes(name)) {
          log(`[agent-filter] Filtered out ${name}: not in enabled_agents`);
          return false;
        }
      }

      return true;
    })
  );

  log("[agent-filter] Filtered agents:", Object.keys(filtered));
  log("[agent-filter] Total count:", Object.keys(filtered).length);

  return filtered;
}
