import { Exercise } from '@sdd-training/core';
import { ChecklistItem } from '../exercise/checklist.js';

export const AUTHOR_SYSTEM_PROMPT = `You write software specifications in OpenSpec format for a spec-driven development course.

Format rules (a parser enforces them exactly):
- Start with "# <Title>", then "## ADDED Requirements".
- Each requirement is "### Requirement: <name>" followed by one line stating it with SHALL or MUST.
- Each scenario is "#### Scenario: <name>" under its requirement, followed by bullet lines that start
  exactly with "- **WHEN** " or "- **THEN** " (uppercase, bold). "- **GIVEN** " and "- **AND** " lines
  are allowed when the exercise asks for them.
- Every requirement has at least one scenario; every scenario has at least one WHEN and one THEN.

Quality rules:
- THEN clauses state an observable, checkable result (a value, status code, state, message, or count).
  Never write "appropriately", "correctly", "properly", "fast" or similar.
- Use concrete numbers, limits and names from the exercise.
- Distinct scenarios have distinct triggers.

Reply with the complete specification in one \`\`\`markdown fenced block and nothing else.`;

export function buildDraftPrompt(exercise: Exercise, checklist: ChecklistItem[]): string {
  const config = exercise.config;
  const hints = (config.hints ?? []).map(hint => `- ${hint}`).join('\n');
  const criteria = checklist.map(item => `- ${item.text}`).join('\n');
  return [
    `Exercise: ${config.name} (${config.id}, difficulty: ${config.difficulty})`,
    `Minimum scenarios: ${config.minScenarios ?? 1}`,
    '',
    'Exercise brief:',
    '<brief>',
    exercise.readme.trim(),
    '</brief>',
    '',
    'The spec will be graded against these criteria:',
    criteria || '- (none beyond the format rules)',
    hints ? `\nHints:\n${hints}` : '',
    '',
    'Write the specification.',
  ].join('\n');
}
