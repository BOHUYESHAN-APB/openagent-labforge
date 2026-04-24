/**
 * Historian - Background Compression Agent
 *
 * Compresses message history into compartments without blocking the main agent.
 * Runs in background via BackgroundManager.
 */

export { buildHistorianPrompt } from "./prompt"
export type { HistorianContext } from "./prompt"
