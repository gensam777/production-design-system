/**
 * Report output: a readable terminal summary and a machine-readable JSON artifact.
 */
import { STATUSES } from './audit.mjs';

const COLORS = { PASS: 32, DRIFT: 31, KNOWN_DIFFERENCE: 33, ERROR: 35 };
const LABEL = { PASS: 'PASS', DRIFT: 'DRIFT', KNOWN_DIFFERENCE: 'KNOWN', ERROR: 'ERROR' };

export function formatTerminal(reports, { color = false } = {}) {
  const paint = (status, text) => (color ? `\x1b[${COLORS[status]}m${text}\x1b[0m` : text);
  const lines = [];
  for (const rep of reports) {
    lines.push(`Design audit — ${rep.title} (${rep.surface})`);
    if (rep.snapshot)
      lines.push(
        `Figma snapshot: ${rep.snapshot.path} · captured ${rep.snapshot.capturedAt} · ` +
          `${rep.snapshot.extractor?.name}@${rep.snapshot.extractor?.version} · ` +
          `checksum ${rep.snapshot.checksum}`,
      );
    lines.push(
      'Note: compares code against the COMMITTED snapshot — it cannot see Figma edits made ' +
        'after that capture.',
    );
    lines.push('');

    // Group rows per check; collapse frames that share status + values.
    const byCheck = new Map();
    for (const r of rep.results) {
      const k = `${r.check}|${r.property}`;
      if (!byCheck.has(k)) byCheck.set(k, []);
      byCheck.get(k).push(r);
    }
    for (const rows of byCheck.values()) {
      const groups = new Map();
      for (const r of rows) {
        const g = JSON.stringify([r.status, r.figma, r.code, r.notes, r.knownDifference?.id]);
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(r);
      }
      for (const group of groups.values()) {
        const r = group[0];
        const frames = group.map((x) => x.frame).join(', ');
        lines.push(
          `${paint(r.status, LABEL[r.status].padEnd(5))}  ${rep.title} / ${r.check}  [${frames}]`,
        );
        lines.push(`       Figma: ${r.figma}`);
        lines.push(`       Code:  ${r.code}`);
        if (r.knownDifference) {
          lines.push(
            `       Known difference ${r.knownDifference.id}: ${r.knownDifference.reason}`,
          );
          if (r.knownDifference.doc) lines.push(`       See: ${r.knownDifference.doc}`);
        }
        for (const n of r.notes) lines.push(`       Note: ${n}`);
      }
    }
    lines.push('');
    lines.push(
      'Summary: ' +
        STATUSES.map((s) => `${paint(s, s)} ${rep.summary[s]}`).join(' · ') +
        `  (${rep.results.length} property checks)`,
    );
    lines.push('');
  }
  return lines.join('\n');
}

export function toJson(reports) {
  const summary = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const rep of reports) for (const s of STATUSES) summary[s] += rep.summary[s];
  return {
    tool: 'design-audit',
    reportVersion: 1,
    generatedAt: new Date().toISOString(),
    limitation:
      'Compares code against the committed Figma snapshot. Figma edits made after the ' +
      'snapshot was captured are not visible until the snapshot is refreshed.',
    summary,
    ok: summary.DRIFT === 0 && summary.ERROR === 0,
    surfaces: reports,
  };
}

export const failed = (reports) => reports.some((r) => r.summary.DRIFT > 0 || r.summary.ERROR > 0);
