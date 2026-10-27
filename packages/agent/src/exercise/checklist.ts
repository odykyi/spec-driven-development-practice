/**
 * Turns an exercise README's "Definition of Done" into a rubric the judge can
 * score. Workflow steps (initialise the change, run `openspec validate`) are
 * dropped: they describe the learner's process, not the content of the spec.
 */
export interface ChecklistItem {
  id: string;
  /** The criterion as written, markdown stripped, sub-bullets folded in. */
  text: string;
  /** Minimum scenario count when the item is an "At least N scenarios" rule. */
  minScenarios?: number;
}

const WORKFLOW_ITEM =
  /^(initialize openspec change|write in\b|all artifacts complete|validates successfully)/i;
const DONE_MARK = '✅';

export function extractChecklist(readme: string): ChecklistItem[] {
  const section = definitionOfDone(readme);
  const items: ChecklistItem[] = [];
  let current: string[] | null = null;

  const flush = () => {
    if (!current) return;
    const text = current.join(' ').replace(/\s+/g, ' ').trim();
    current = null;
    if (!text || WORKFLOW_ITEM.test(text)) return;
    items.push(toItem(text, items));
  };

  for (const line of section) {
    const trimmed = line.trim();
    if (trimmed.startsWith(DONE_MARK)) {
      flush();
      current = [stripMarkdown(trimmed.slice(DONE_MARK.length))];
    } else if (current && /^[-*]\s+/.test(trimmed)) {
      // Sub-bullets under an item ("- 1 scenario for ...") belong to that item.
      current.push(stripMarkdown(trimmed.replace(/^[-*]\s+/, '')));
    } else if (trimmed === '') {
      continue;
    } else {
      flush();
    }
  }
  flush();
  return items;
}

function definitionOfDone(readme: string): string[] {
  const lines = readme.split('\n');
  // Matches "## Definition of Done" and "## Success Criteria / Definition of Done".
  const start = lines.findIndex(line => /^##\s+.*Definition of Done/i.test(line.trim()));
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex(line => /^##\s/.test(line.trim()));
  return end === -1 ? rest : rest.slice(0, end);
}

function toItem(text: string, existing: ChecklistItem[]): ChecklistItem {
  const scenarioCount = text.match(/at least (\d+) scenarios?/i);
  let id = slugify(text.split(/[:(]/)[0]).split('-').slice(0, 6).join('-');
  // Keep ids unique within one exercise so judge answers map back unambiguously.
  for (let n = 2; existing.some(item => item.id === id); n++) {
    id = `${id.replace(/-\d+$/, '')}-${n}`;
  }
  return {
    id,
    text: text.replace(/:$/, ''),
    ...(scenarioCount ? { minScenarios: Number(scenarioCount[1]) } : {}),
  };
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
