import type { OhMyOpenCodeConfig } from "../config";
import { getAgentListDisplayName } from "../shared/agent-display-names";
import {
  loadUserCommands,
  loadProjectCommands,
  loadOpencodeGlobalCommands,
  loadOpencodeProjectCommands,
} from "../features/claude-code-command-loader";
import { loadBuiltinCommands } from "../features/builtin-commands";
import {
  discoverConfigSourceSkills,
  discoverGlobalAgentsSkills,
  loadUserSkills,
  loadProjectSkills,
  loadOpencodeGlobalSkills,
  loadOpencodeProjectSkills,
  discoverProjectAgentsSkills,
  skillsToCommandDefinitionRecord,
} from "../features/opencode-skill-loader";
import {
  detectExternalSkillPlugin,
  getSkillPluginConflictWarning,
  log,
} from "../shared";
import type { PluginComponents } from "./plugin-components-loader";

export async function applyCommandConfig(params: {
  config: Record<string, unknown>;
  pluginConfig: OhMyOpenCodeConfig;
  ctx: { directory: string };
  pluginComponents: PluginComponents;
}): Promise<void> {
  const builtinCommands = loadBuiltinCommands(params.pluginConfig.disabled_commands, {
    useRegisteredAgents: true,
  });
  const systemCommands = (params.config.command as Record<string, unknown>) ?? {};

  const includeClaudeCommands = params.pluginConfig.claude_code?.commands ?? true;
  const includeClaudeSkills = params.pluginConfig.claude_code?.skills ?? true;

  const externalSkillPlugin = detectExternalSkillPlugin(params.ctx.directory)
  if (includeClaudeSkills && externalSkillPlugin.detected) {
    log(getSkillPluginConflictWarning(externalSkillPlugin.pluginName!))
  }

  const [
    configSourceSkills,
    userCommands,
    projectCommands,
    opencodeGlobalCommands,
    opencodeProjectCommands,
    userSkills,
    projectSkills,
    projectAgentsSkills,
    opencodeGlobalSkills,
    opencodeProjectSkills,
    globalAgentsSkills,
  ] = await Promise.all([
    discoverConfigSourceSkills({
      config: params.pluginConfig.skills,
      configDir: params.ctx.directory,
    }),
    includeClaudeCommands ? loadUserCommands() : Promise.resolve({}),
    includeClaudeCommands ? loadProjectCommands(params.ctx.directory) : Promise.resolve({}),
    loadOpencodeGlobalCommands(),
    loadOpencodeProjectCommands(params.ctx.directory),
    includeClaudeSkills ? loadUserSkills() : Promise.resolve({}),
    includeClaudeSkills ? loadProjectSkills(params.ctx.directory) : Promise.resolve({}),
    includeClaudeSkills
      ? discoverProjectAgentsSkills(params.ctx.directory).then(skillsToCommandDefinitionRecord)
      : Promise.resolve({}),
    loadOpencodeGlobalSkills(),
    loadOpencodeProjectSkills(params.ctx.directory),
    includeClaudeSkills
      ? discoverGlobalAgentsSkills().then(skillsToCommandDefinitionRecord)
      : Promise.resolve({}),
  ]);

  log("[config-handler] skills discovered", {
    configSourceSkillCount: configSourceSkills.length,
    userSkillCount: Object.keys(userSkills).length,
    projectSkillCount: Object.keys(projectSkills).length,
    projectAgentsSkillCount: Object.keys(projectAgentsSkills).length,
    opencodeGlobalSkillCount: Object.keys(opencodeGlobalSkills).length,
    opencodeProjectSkillCount: Object.keys(opencodeProjectSkills).length,
    globalAgentsSkillCount: Object.keys(globalAgentsSkills).length,
    pluginSkillCount: Object.keys(params.pluginComponents.skills).length,
    configuredBundle: Array.isArray(params.pluginConfig.skills)
      ? undefined
      : params.pluginConfig.skills?.bundle,
  })

  params.config.command = {
    ...builtinCommands,
    ...skillsToCommandDefinitionRecord(configSourceSkills),
    ...userCommands,
    ...userSkills,
    ...globalAgentsSkills,
    ...opencodeGlobalCommands,
    ...opencodeGlobalSkills,
    ...systemCommands,
    ...projectCommands,
    ...projectSkills,
    ...projectAgentsSkills,
    ...opencodeProjectCommands,
    ...opencodeProjectSkills,
    ...params.pluginComponents.commands,
    ...params.pluginComponents.skills,
  };

  remapCommandAgentFields(params.config.command as Record<string, Record<string, unknown>>);
}

function remapCommandAgentFields(commands: Record<string, Record<string, unknown>>): void {
  for (const cmd of Object.values(commands)) {
    if (cmd?.agent && typeof cmd.agent === "string") {
      cmd.agent = getAgentListDisplayName(cmd.agent);
    }
  }
}
