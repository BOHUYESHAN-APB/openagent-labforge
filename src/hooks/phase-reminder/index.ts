import {
  DOC_PARSER_REMINDER,
  PHASE_REMINDER_TEXT,
} from '../../config/constants';

export const PHASE_REMINDER = `<internal_reminder>${PHASE_REMINDER_TEXT}</internal_reminder>`;
export const DOC_PARSER_HINT = DOC_PARSER_REMINDER;

export function createPhaseReminderHook() {
  return {
    'experimental.chat.system.transform': async (
      input: { sessionID?: string },
      output: { system: string[] },
    ): Promise<void> => {
      if (!input.sessionID) {
        return;
      }

      const combined = output.system.join('\n\n');
      if (!combined.includes(PHASE_REMINDER)) {
        output.system.push(PHASE_REMINDER);
      }
      if (!combined.includes('document parsing')) {
        output.system.push(DOC_PARSER_HINT);
      }
    },
  };
}
