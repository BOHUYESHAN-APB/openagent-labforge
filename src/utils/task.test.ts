import { describe, expect, test } from 'bun:test';
import {
  parseTaskIdFromTaskOutput,
  parseTaskLaunchOutput,
  parseTaskStatusOutput,
} from './task';

describe('parseTaskIdFromTaskOutput', () => {
  test('parses task_id line from successful task tool output', () => {
    const output = [
      'task_id: session-abc-123 (for resuming to continue this task if needed)',
      '',
      '<task_result>',
      'done',
      '</task_result>',
    ].join('\n');

    expect(parseTaskIdFromTaskOutput(output)).toBe('session-abc-123');
  });

  test('returns undefined when task_id is absent', () => {
    const output = ['<task_result>', 'no task id here', '</task_result>'].join(
      '\n',
    );

    expect(parseTaskIdFromTaskOutput(output)).toBeUndefined();
  });

  test('parses xml task output ids', () => {
    const output = [
      '<task id="ses_bg_123" state="running">',
      '<summary>Background task started</summary>',
      '<task_result>',
      'Background task started',
      '</task_result>',
      '</task>',
    ].join('\n');

    expect(parseTaskIdFromTaskOutput(output)).toBe('ses_bg_123');
  });

  test('parses native background launch output', () => {
    const output = [
      '<task id="ses_bg_123" state="running">',
      '<summary>Background task started</summary>',
      '<task_result>',
      'The task is working in the background.',
      '</task_result>',
      '</task>',
    ].join('\n');

    expect(parseTaskLaunchOutput(output)).toEqual({
      taskID: 'ses_bg_123',
      state: 'running',
      result: 'The task is working in the background.',
    });
  });

  test('parses terminal task xml output', () => {
    const output = [
      '<task id="ses_bg_123" state="completed">',
      '<summary>Background task completed: Search auth flow</summary>',
      '<task_result>',
      'Mapped auth entry points.',
      '</task_result>',
      '</task>',
    ].join('\n');

    expect(parseTaskStatusOutput(output)).toEqual({
      taskID: 'ses_bg_123',
      state: 'completed',
      timedOut: false,
      result: 'Mapped auth entry points.',
    });
  });
});
