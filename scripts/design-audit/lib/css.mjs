/**
 * Minimal, dependency-free CSS reader for the audit: enough to answer "what does selector S
 * declare for property P" in the repo's own hand-written CSS. Not a general CSS parser —
 * rules nested inside at-rules (@media, @supports, …) are tagged with their at-rule so
 * lookups can ignore conditional declarations by default.
 */

/** @returns {{ selectors: string[], atRule: string|null, decls: [string, string][] }[]} */
export function parseCss(text) {
  const src = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const stack = []; // preludes of open blocks
  let buf = '';
  for (const ch of src) {
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === '}') {
      const prelude = stack.pop() ?? '';
      if (!prelude.startsWith('@')) {
        const atRule = stack.find((p) => p.startsWith('@')) ?? null;
        rules.push({
          selectors: prelude.split(',').map((s) => s.trim().replace(/\s+/g, ' ')),
          atRule,
          decls: buf
            .split(';')
            .map((d) => d.trim())
            .filter(Boolean)
            .map((d) => {
              const i = d.indexOf(':');
              return [d.slice(0, i).trim().toLowerCase(), d.slice(i + 1).trim()];
            }),
        });
      }
      buf = '';
    } else buf += ch;
  }
  return rules;
}

/**
 * Last unconditional declaration of `property` for an exact `selector` (cascade order within
 * the file). Returns null when absent.
 */
export function getDeclaration(rules, selector, property) {
  const want = selector.trim().replace(/\s+/g, ' ');
  let value = null;
  for (const rule of rules) {
    if (rule.atRule || !rule.selectors.includes(want)) continue;
    for (const [p, v] of rule.decls) if (p === property) value = v;
  }
  return value;
}

/** Custom-property names referenced via var(--x) in a declaration value, in order. */
export function varRefs(value) {
  return [...String(value).matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
}
