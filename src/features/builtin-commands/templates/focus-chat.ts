export const FOCUS_CHAT_TEMPLATE = `Switch the current session back to ordinary chat mode.

Use this when:
- the user wants direct Q&A instead of execution
- old todos or autonomous workflow state are making the session feel heavy
- you want to keep the session but stop hidden execution interference

Expected effect:
1. clear current session todos
2. stop continuation / countdown / Ralph loop for this session
3. clear stale autonomous execution markers for this session
4. remove current-session runtime workflow state so follow-up turns prioritize the user's live request

After this command:
- prioritize the user's actual latest request over old todo/workflow residue
- do not recreate todos unless the user explicitly asks to execute work again
- treat the session as normal conversation first, execution second`
