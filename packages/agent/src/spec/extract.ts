/**
 * Pulls the spec markdown out of a model reply. Models wrap it in a fenced block
 * (sometimes with prose around it), or return it bare; both are accepted.
 */
export function extractSpecMarkdown(reply: string): string {
  const fences = [...reply.matchAll(/```(?:markdown|md)?[ \t]*\n([\s\S]*?)\n```/g)].map(m => m[1]);
  // A spec can itself contain small fenced examples; the one with requirements wins.
  const withRequirements = fences.filter(block => /###\s+Requirement:/.test(block));
  const chosen = withRequirements.sort((a, b) => b.length - a.length)[0];
  if (chosen) return normalize(chosen);

  const firstHeading = reply.search(/^#{1,3}\s/m);
  return normalize(firstHeading === -1 ? reply : reply.slice(firstHeading));
}

function normalize(markdown: string): string {
  return markdown.replace(/\r\n/g, '\n').trim() + '\n';
}
