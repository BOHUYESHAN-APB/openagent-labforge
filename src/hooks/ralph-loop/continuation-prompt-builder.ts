import { SYSTEM_DIRECTIVE_PREFIX } from "../../shared/system-directive"
import type { RalphLoopState } from "./types"

function getMaxIterationsLabel(state: RalphLoopState): string {
	return typeof state.max_iterations === "number" ? String(state.max_iterations) : "unbounded"
}

const CONTINUATION_PROMPT = `${SYSTEM_DIRECTIVE_PREFIX} - RALPH LOOP {{ITERATION}}/{{MAX}}]

Your previous attempt did not output the completion promise. Continue working on the task.

IMPORTANT:
- Review your progress so far
- Continue from where you left off
- When FULLY complete, output: <promise>{{PROMISE}}</promise>
- Do not stop until the task is truly done
- Do NOT ask the user "what next" or "should I continue" between steps
- Only ask the user if you are truly blocked
- If blocked, ask up to 3 precise blocking questions using OpenCode's QuestionTool (the "question" tool)
- If not blocked, choose safe defaults, proceed, and document assumptions

Original task:
{{PROMPT}}`

const ULTRAWORK_VERIFICATION_PROMPT = `${SYSTEM_DIRECTIVE_PREFIX} - ULTRAWORK LOOP VERIFICATION {{ITERATION}}/{{MAX}}]

You already emitted <promise>{{INITIAL_PROMISE}}</promise>. This does NOT finish the loop yet.

REQUIRED NOW:
- Call Oracle using task(subagent_type="oracle", load_skills=[], run_in_background=false, ...)
- Provide Oracle with the original task text and the concrete outputs to verify (files, commands, logs)
- Oracle must verify by evidence. If evidence is missing, Oracle must reject.
- The system will inspect the Oracle session directly for the verification result
- If Oracle does not verify, continue fixing the task and do not consider it complete
- Do NOT ask the user "what next" or "should I continue" between steps
- Only ask the user if you are truly blocked
- If blocked, ask up to 3 precise blocking questions using OpenCode's QuestionTool (the "question" tool)

Optional domain checks:
- If the task is bioinformatics or data analysis, consult bio-methodologist or bio-pipeline-operator before final Oracle review.

Original task:
{{PROMPT}}`

const ULTRAWORK_VERIFICATION_FAILED_PROMPT = `${SYSTEM_DIRECTIVE_PREFIX} - ULTRAWORK LOOP VERIFICATION FAILED {{ITERATION}}/{{MAX}}]

Oracle did not emit <promise>VERIFIED</promise>. Verification failed.

REQUIRED NOW:
- Verification failed. Fix the task until Oracle's review is satisfied
- Oracle does not lie. Treat the verification result as ground truth
- Do not claim completion early or argue with the failed verification
- After fixing the remaining issues, request Oracle review again using task(subagent_type="oracle", load_skills=[], run_in_background=false, ...)
- Only when the work is ready for review again, output: <promise>{{PROMISE}}</promise>
- Do NOT ask the user "what next" or "should I continue" between steps
- Only ask the user if you are truly blocked
- If blocked, ask up to 3 precise blocking questions using OpenCode's QuestionTool (the "question" tool)

Optional domain checks:
- If the task is bioinformatics or data analysis, consult bio-methodologist or bio-pipeline-operator before final Oracle review.

Original task:
{{PROMPT}}`

export function buildContinuationPrompt(state: RalphLoopState): string {
	const template = state.verification_pending
		? ULTRAWORK_VERIFICATION_PROMPT
		: CONTINUATION_PROMPT
	const continuationPrompt = template.replace(
		"{{ITERATION}}",
		String(state.iteration),
	)
		.replace("{{MAX}}", getMaxIterationsLabel(state))
		.replace("{{INITIAL_PROMISE}}", state.initial_completion_promise ?? state.completion_promise)
		.replace("{{PROMISE}}", state.completion_promise)
		.replace("{{PROMPT}}", state.prompt)

	return state.ultrawork ? `ultrawork ${continuationPrompt}` : continuationPrompt
}

export function buildVerificationFailurePrompt(state: RalphLoopState): string {
	const continuationPrompt = ULTRAWORK_VERIFICATION_FAILED_PROMPT.replace(
		"{{ITERATION}}",
		String(state.iteration),
	)
		.replace("{{MAX}}", getMaxIterationsLabel(state))
		.replace("{{PROMISE}}", state.completion_promise)
		.replace("{{PROMPT}}", state.prompt)

	return state.ultrawork ? `ultrawork ${continuationPrompt}` : continuationPrompt
}
