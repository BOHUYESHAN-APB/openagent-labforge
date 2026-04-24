/**
 * Sisyphus agent — multi-model orchestrator.
 *
 * This directory contains model-specific prompt variants:
 * - default.ts: Base implementation for Claude and general models
 * - gemini.ts: Corrective overlays for Gemini's aggressive tendencies
 * - gpt-5-4.ts: Native GPT-5.4 prompt with block-structured guidance
 * - deepseek.ts: Optimized overlays for DeepSeek V4 models (V4-Pro, V4-Flash)
 */

export { buildDefaultSisyphusPrompt, buildTaskManagementSection } from "./default";
export {
  buildGeminiToolMandate,
  buildGeminiDelegationOverride,
  buildGeminiVerificationOverride,
  buildGeminiIntentGateEnforcement,
  buildGeminiToolGuide,
  buildGeminiToolCallExamples,
} from "./gemini";
export { buildGpt54SisyphusPrompt } from "./gpt-5-4";
export {
  buildDeepSeekReasoningGuidance,
  buildDeepSeekToolOptimization,
  buildDeepSeekDelegationStrategy,
  buildDeepSeekContextManagement,
  buildDeepSeekOutputGuidance,
  buildDeepSeekTaskManagement,
} from "./deepseek";
