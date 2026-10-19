import type { Theme, TextStyleToken, Transition } from '@pds/tokens/react-native';

// Resolves a contract token path (`color.action.primary.on-color`, `text.label.md.medium`) in a
// generated React Native theme. Same naming rules as the native token model
// (packages/tokens/scripts/native.mjs, ADR 0013/0016): lowerCamelCase segments
// (`on-color` → `onColor`), numeric-leading steps reversed (`2xl` → `xl2`) and the `text` root
// renamed `typography`. Components keep their contract bindings as these paths, so contract
// parity is checked on the data the component actually renders with.

const ROOT_RENAME: Record<string, string> = { text: 'typography' };

export function segmentName(segment: string): string {
  const numeric = /^(\d+)([a-z][a-z0-9]*)$/i.exec(segment);
  const base = numeric ? numeric[2] + numeric[1] : segment;
  return base.replace(/[-_\s]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** `text.label.md.medium` → `['typography', 'label', 'md', 'medium']`. */
export function themePath(tokenPath: string): string[] {
  return tokenPath
    .split('.')
    .map((s, i) => (i === 0 ? (ROOT_RENAME[s] ?? s) : s))
    .map(segmentName);
}

export function resolveTokenPath(theme: Theme, tokenPath: string): unknown {
  let node: unknown = theme;
  for (const key of themePath(tokenPath)) {
    if (node == null || typeof node !== 'object' || !(key in node))
      throw new Error(`@pds/react-native: token '${tokenPath}' does not exist in the theme`);
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

const fail = (tokenPath: string, kind: string): never => {
  throw new Error(`@pds/react-native: token '${tokenPath}' is not a ${kind}`);
};

/** A color token, or `null` for the contract's `none` (no paint). */
export function colorToken(theme: Theme, tokenPath: string): string | null {
  if (tokenPath === 'none') return null;
  const v = resolveTokenPath(theme, tokenPath);
  return typeof v === 'string' && v.startsWith('#') ? v : fail(tokenPath, 'color');
}

export function numberToken(theme: Theme, tokenPath: string): number {
  const v = resolveTokenPath(theme, tokenPath);
  return typeof v === 'number' ? v : fail(tokenPath, 'number');
}

export function textStyleToken(theme: Theme, tokenPath: string): TextStyleToken {
  const v = resolveTokenPath(theme, tokenPath) as Partial<TextStyleToken> | null;
  return v && typeof v.fontFamily === 'string' && typeof v.fontSize === 'number'
    ? (v as TextStyleToken)
    : fail(tokenPath, 'typography role');
}

export function transitionToken(theme: Theme, tokenPath: string): Transition {
  const v = resolveTokenPath(theme, tokenPath) as Partial<Transition> | null;
  return v && typeof v.duration === 'number' && Array.isArray(v.easing)
    ? (v as Transition)
    : fail(tokenPath, 'transition');
}
