/**
 * Minimal, dependency-free JSX reader for the audit. It answers three narrow questions about a
 * component file: which literal props an element is given, the static text inside an element
 * with a given className, and the order of PascalCase elements (with `{flag && <X/>}` guards).
 * Anything that isn't a literal is reported as an expression, never guessed.
 */

/** Scan a JSX opening tag starting at `<` index `start`; returns { end, attrText }. */
function scanTag(src, start) {
  const nameEnd = src.slice(start + 1).search(/[\s/>]/) + start + 1;
  let i = nameEnd;
  let depth = 0;
  let quote = null;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === quote && src[i - 1] !== '\\') quote = null;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      if (depth > 0 || ch !== '`') quote = ch;
    } else if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === '>' && depth === 0) {
      const selfClosing = src[i - 1] === '/';
      return {
        end: i + 1,
        selfClosing,
        attrText: src.slice(nameEnd, selfClosing ? i - 1 : i),
      };
    }
  }
  throw new Error(`Unterminated JSX tag at offset ${start}`);
}

/** Parse JSX attributes text into { name: value }. Literals become strings / booleans. */
export function parseAttributes(attrText) {
  const props = {};
  let i = 0;
  const s = attrText;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    if (s[i] === '{') {
      // spread: {...rest}
      let depth = 0;
      for (; i < s.length; i++) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}' && --depth === 0) break;
      }
      i++;
      continue;
    }
    const m = s.slice(i).match(/^[\w:-]+/);
    if (!m) {
      i++;
      continue;
    }
    const name = m[0];
    i += name.length;
    if (s[i] !== '=') {
      props[name] = true;
      continue;
    }
    i++;
    if (s[i] === '"' || s[i] === "'") {
      const q = s[i];
      const close = s.indexOf(q, i + 1);
      props[name] = decodeEntities(s.slice(i + 1, close));
      i = close + 1;
    } else if (s[i] === '{') {
      let depth = 0;
      const startExpr = i;
      for (; i < s.length; i++) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}' && --depth === 0) break;
      }
      const expr = s.slice(startExpr + 1, i).trim();
      i++;
      const lit = expr.match(/^(['"`])([^'"`]*)\1$/);
      if (lit) props[name] = lit[2];
      else if (expr === 'true' || expr === 'false') props[name] = expr === 'true';
      else if (/^-?\d+(\.\d+)?$/.test(expr)) props[name] = Number(expr);
      else props[name] = { expression: expr };
    }
  }
  return props;
}

export function decodeEntities(text) {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/** All opening tags of `<Name …>` in order: [{ name, start, end, props, selfClosing }]. */
export function findElements(src, name) {
  const out = [];
  const re = new RegExp(`<(${name ?? '[A-Za-z][\\w.]*'})(?=[\\s/>])`, 'g');
  let m;
  while ((m = re.exec(src))) {
    if (src[m.index - 1] === '<') continue;
    const tag = scanTag(src, m.index);
    out.push({
      name: m[1],
      start: m.index,
      end: tag.end,
      selfClosing: tag.selfClosing,
      props: parseAttributes(tag.attrText),
    });
    re.lastIndex = tag.end;
  }
  return out;
}

/** Static text content of the first element whose className is exactly `className`. */
export function textOfClass(src, className) {
  const el = findElements(src).find((e) => e.props.className === className);
  if (!el) return null;
  if (el.selfClosing) return '';
  const close = src.indexOf(`</${el.name}>`, el.end);
  if (close < 0) return null;
  const inner = src.slice(el.end, close);
  if (/[<{]/.test(inner)) return { expression: inner.trim() };
  return decodeEntities(inner).replace(/\s+/g, ' ').trim();
}

/**
 * PascalCase elements in document order, each with the guard prop it is conditionally
 * rendered behind (`{error && (<Alert …/>)}` → guard 'error'), or null.
 */
export function elementOrder(src, names) {
  const guards = new Map();
  const guardRe = /\{\s*([A-Za-z_]\w*)\s*&&\s*\(?(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*<([A-Z]\w*)/g;
  let m;
  while ((m = guardRe.exec(src))) guards.set(m.index + m[0].length - m[2].length - 1, m[1]);
  return findElements(src)
    .filter((e) => /^[A-Z]/.test(e.name) && (!names || names.includes(e.name)))
    .map((e) => ({ name: e.name, guard: guards.get(e.start) ?? null }));
}
