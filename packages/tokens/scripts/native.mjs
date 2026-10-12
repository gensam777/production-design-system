/**
 * Native token model — the platform-neutral middle step shared by the React Native, Swift and
 * Kotlin emitters (governance/decisions/0016-native-token-mappings.md).
 *
 *   IR (one brand) → nativeModel() → a tree of named groups and typed leaves
 *                                  → emit-react-native.mjs / emit-swift.mjs / emit-kotlin.mjs
 *
 * What is exposed: SEMANTIC tokens with scope `shared` (component-scoped tokens such as
 * `color.switch.*` and `radius.checkbox` live in the semantic tier, so they're included).
 * Core (`tier: core`), `brand.*` (never in the IR) and web-only tokens are never exposed.
 * Native-tier tokens (`textScaling.*`, `elevationHeight.*`) are not exposed on their own —
 * they're folded into the typography and elevation leaves they belong to.
 *
 * Naming (ADR 0013): lowerCamelCase segments (`on-color` → `onColor`), numeric-leading steps
 * reversed (`2xl` → `xl2`, `3xs` → `xs3`), the `text` root renamed `typography`.
 *
 * Mappings (ADR 0016):
 *   typography  size and weight unchanged; lineHeight = size × ratio; letterSpacing = em × size;
 *               SwiftUI lineSpacing = size × (ratio − 1); iOS text-scaling anchor per role
 *   elevation   iOS shadow from the shared token (radius = blur ÷ 2, opacity = color alpha,
 *               spread dropped); Android elevation in dp from `elevationHeight.*` (provisional)
 *   radius      `$extensions["com.pds"].shape: "full"` → a capsule shape, not 9999
 */
import { FONT_ROLES } from './fonts.mjs';

/** UIKit UIFont.TextStyle names — the values `textScaling.*` may take. */
export const APPLE_TEXT_STYLES = [
  'largeTitle',
  'title1',
  'title2',
  'title3',
  'headline',
  'body',
  'callout',
  'subheadline',
  'footnote',
  'caption1',
  'caption2',
];

const ROOT_RENAME = { text: 'typography' };
const TEXT_SCALING = 'textScaling.';
const ELEVATION_HEIGHT = 'elevationHeight.';

/** `on-color` → `onColor`, `2xl` → `xl2`, `overlay-enter` → `overlayEnter`. */
export function segmentName(segment) {
  const s = String(segment);
  const numeric = /^(\d+)([a-z][a-z0-9]*)$/i.exec(s);
  const base = numeric ? numeric[2] + numeric[1] : s;
  return base.replace(/[-_\s]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}
export const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Round to 4 decimals and drop -0, so outputs don't carry float noise. */
export const r4 = (n) => {
  const v = Math.round(n * 1e4) / 1e4;
  return Object.is(v, -0) ? 0 : v;
};

function parseHex(hex) {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex ?? '');
  if (!m) return null;
  const rgb = parseInt(m[1], 16);
  const alpha = m[2] === undefined ? 255 : parseInt(m[2], 16);
  return { rgb, alpha, hex: `#${m[1].toUpperCase()}${m[2] ? m[2].toUpperCase() : ''}` };
}

const isGroup = (n) => n.kind === 'group';
const newGroup = () => ({ kind: 'group', children: new Map() });

/**
 * Build the native model for one brand's IR.
 * @returns {{ brand: string, default: boolean, root: object, errors: string[] }}
 */
export function nativeModel(ir) {
  const errors = [];
  const anchors = new Map();
  const heights = new Map();
  for (const t of ir.tokens.filter((x) => x.scope === 'native')) {
    if (t.path.startsWith(TEXT_SCALING)) anchors.set(t.path.slice(TEXT_SCALING.length), t);
    else if (t.path.startsWith(ELEVATION_HEIGHT))
      heights.set(t.path.slice(ELEVATION_HEIGHT.length), t);
    else
      errors.push(
        `${t.path}: unknown native-tier token (expected textScaling.* or elevationHeight.*)`,
      );
  }
  const usedAnchors = new Set();
  const usedHeights = new Set();

  const root = newGroup();
  const owner = new Map(); // native path → IR path (collision reporting)
  const insert = (irPath, segs, leaf) => {
    const names = segs.map((s, i) => (i === 0 ? (ROOT_RENAME[s] ?? s) : s)).map(segmentName);
    const bad = names.find((n) => !/^[a-z][A-Za-z0-9]*$/.test(n));
    if (bad) {
      errors.push(`${irPath}: segment "${bad}" is not a valid native identifier`);
      return;
    }
    const nativePath = names.join('.');
    let node = root;
    for (const [i, name] of names.entries()) {
      const last = i === names.length - 1;
      const existing = node.children.get(name);
      const prefix = names.slice(0, i + 1).join('.');
      if (last) {
        if (existing) {
          errors.push(
            `${irPath} and ${owner.get(prefix) ?? 'a group'} both map to native name ${nativePath}`,
          );
          return;
        }
        node.children.set(name, { ...leaf, irPath, nativePath });
        owner.set(prefix, irPath);
      } else {
        if (existing && !isGroup(existing)) {
          errors.push(
            `${irPath} needs group ${prefix}, which is already the token ${owner.get(prefix)}`,
          );
          return;
        }
        if (!existing) {
          node.children.set(name, newGroup());
          owner.set(prefix, `group of ${irPath}`);
        }
        node = node.children.get(name);
      }
    }
  };

  for (const t of ir.tokens) {
    if (t.tier !== 'semantic' || t.scope !== 'shared') continue;
    const leaf = toLeaf(t);
    if (leaf.error) errors.push(`${t.path}: ${leaf.error}`);
    else insert(t.path, t.path.split('.'), leaf);
  }

  // Font manifest → `fonts.<role>` (asset metadata, part of the theme so loaders can find faces).
  for (const role of Object.keys(ir.fonts ?? {})) {
    const f = ir.fonts[role];
    insert(`fonts.${role}`, ['fonts', role], {
      kind: 'fontFamily',
      role,
      family: f.family,
      faces: f.faces,
    });
  }

  for (const key of anchors.keys())
    if (!usedAnchors.has(key))
      errors.push(`textScaling.${key} has no typography role text.${key}.* — remove it`);
  for (const key of heights.keys())
    if (!usedHeights.has(key))
      errors.push(`elevationHeight.${key} has no elevation.${key} token — remove it`);
  errors.push(...checkElevationOrder(ir, heights));

  return { brand: ir.brand, default: ir.default, root, errors };

  function toLeaf(t) {
    switch (t.type) {
      case 'color': {
        const c = parseHex(t.value);
        if (!c) return { error: `color "${t.value}" is not #RRGGBB or #RRGGBBAA` };
        return {
          kind: 'color',
          hex: c.hex,
          rgba: ((c.rgb << 8) | c.alpha) >>> 0,
          argb: ((c.alpha << 24) | c.rgb) >>> 0,
          description: t.description,
        };
      }
      case 'dimension': {
        if (typeof t.value !== 'number') return { error: `dimension "${t.value}" is not a number` };
        if (t.extensions?.['com.pds']?.shape === 'full')
          return { kind: 'shape', shape: 'full', value: t.value, description: t.description };
        return { kind: 'dimension', value: t.value, description: t.description };
      }
      case 'typography':
        return typographyLeaf(t);
      case 'shadow':
        return elevationLeaf(t);
      case 'transition': {
        const { duration, delay, timingFunction: e } = t.value ?? {};
        if (typeof duration !== 'number' || typeof delay !== 'number')
          return { error: 'transition duration/delay must be ms numbers' };
        if (!Array.isArray(e) || e.length !== 4 || e.some((x) => typeof x !== 'number'))
          return { error: 'transition timingFunction must be a cubic-bezier [x1, y1, x2, y2]' };
        return {
          kind: 'transition',
          durationMs: duration,
          delayMs: delay,
          easing: e,
          description: t.description,
        };
      }
      default:
        return {
          error: `type "${t.type}" has no native mapping — add one to packages/tokens/scripts/native.mjs`,
        };
    }
  }

  function typographyLeaf(t) {
    const segs = t.path.split('.');
    const key = segs.slice(1, -1).join('.');
    const anchor = anchors.get(key);
    if (!anchor)
      return {
        error: `no iOS text-scaling anchor — add textScaling.${key} to design/tokens/platform/native/semantic/text-scaling.json`,
      };
    usedAnchors.add(key);
    if (!APPLE_TEXT_STYLES.includes(anchor.value))
      return {
        error: `textScaling.${key} is "${anchor.value}", not one of ${APPLE_TEXT_STYLES.join(', ')}`,
      };
    const role = /(?:^|\.)font\.family\.([^.]+)$/.exec(t.refs?.fontFamily ?? '')?.[1];
    if (!FONT_ROLES.includes(role))
      return { error: `fontFamily must alias a font role (${FONT_ROLES.join(', ')})` };
    const { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } = t.value;
    const face = ir.fonts?.[role]?.faces.find((f) => f.weight === fontWeight);
    if (!face) return { error: `no ${fontFamily} ${fontWeight} face in the font catalog` };
    for (const [name, v] of Object.entries({ fontSize, fontWeight, lineHeight, letterSpacing }))
      if (typeof v !== 'number')
        return { error: `${name} must be a number, got ${JSON.stringify(v)}` };
    return {
      kind: 'textStyle',
      fontRole: role,
      fontFamily,
      postScriptName: face.postScriptName,
      androidResource: face.androidResource,
      fontWeight,
      fontSize,
      lineHeightRatio: lineHeight,
      lineHeight: r4(fontSize * lineHeight),
      lineSpacing: r4(fontSize * (lineHeight - 1)),
      letterSpacingEm: letterSpacing,
      letterSpacing: r4(letterSpacing * fontSize),
      textScale: anchor.value,
      textScaleKey: key,
      description: t.description,
    };
  }

  function elevationLeaf(t) {
    const role = t.path.split('.').slice(1).join('.');
    const height = heights.get(role);
    if (!height)
      return {
        error: `no Android elevation — add elevationHeight.${role} to design/tokens/platform/native/semantic/elevation.json`,
      };
    usedHeights.add(role);
    if (typeof height.value !== 'number' || height.value < 0)
      return { error: `elevationHeight.${role} must be a non-negative dp number` };
    const v = t.value;
    if (Array.isArray(v) && v.length === 0)
      return { kind: 'elevation', shadow: null, height: height.value, description: t.description };
    if (Array.isArray(v)) return { error: 'multi-layer shadows have no native mapping' };
    const c = parseHex(v?.color);
    if (!c) return { error: `shadow color "${v?.color}" is not #RRGGBB or #RRGGBBAA` };
    for (const k of ['offsetX', 'offsetY', 'blur'])
      if (typeof v[k] !== 'number') return { error: `shadow ${k} must be a number` };
    return {
      kind: 'elevation',
      shadow: {
        color: `#${c.hex.slice(1, 7)}`,
        rgba: ((c.rgb << 8) | 0xff) >>> 0,
        opacity: Math.round((c.alpha / 255) * 100) / 100,
        radius: r4(v.blur / 2),
        x: v.offsetX,
        y: v.offsetY,
      },
      height: height.value,
      description: t.description,
    };
  }
}

/** Android heights must grow with the shared shadow's size (flat < raised < overlay < modal). */
function checkElevationOrder(ir, heights) {
  const size = (v) => (Array.isArray(v) ? 0 : (v?.blur ?? 0) + (v?.offsetY ?? 0));
  const roles = ir.tokens
    .filter((t) => t.tier === 'semantic' && t.type === 'shadow')
    .map((t) => ({ role: t.path.split('.').slice(1).join('.'), size: size(t.value) }))
    .filter((r) => typeof heights.get(r.role)?.value === 'number')
    .map((r) => ({ ...r, height: heights.get(r.role).value }))
    .sort((a, b) => a.size - b.size);
  const errors = [];
  for (let i = 1; i < roles.length; i++) {
    const [a, b] = [roles[i - 1], roles[i]];
    if (b.size > a.size && !(b.height > a.height))
      errors.push(
        `elevationHeight.${b.role} (${b.height}dp) must be higher than elevationHeight.${a.role} (${a.height}dp) — its shadow is larger`,
      );
    if (b.size === a.size && b.height !== a.height)
      errors.push(
        `elevationHeight.${a.role} and .${b.role} have equal shadows but different heights`,
      );
  }
  return errors;
}

/** Visit a model tree depth-first in insertion order. */
export function walk(node, path, onGroup, onLeaf) {
  for (const [name, child] of node.children) {
    const p = [...path, name];
    if (isGroup(child)) {
      onGroup?.(p, child);
      walk(child, p, onGroup, onLeaf);
    } else onLeaf?.(p, child);
  }
}

/** Structural signature of a model (group names + leaf kinds) — must match across brands. */
export function skeleton(node) {
  return [...node.children]
    .map(([k, v]) =>
      isGroup(v)
        ? `${k}{${skeleton(v)}}`
        : `${k}:${v.kind}${v.kind === 'elevation' ? (v.shadow ? '+' : '0') : ''}`,
    )
    .join(',');
}

/**
 * Build and check every brand's model. Errors: per-brand mapping errors, and any structural
 * difference between brands (themes share one generated type, so the shape may not vary).
 */
export function nativeModels(irs) {
  const models = irs.map(nativeModel);
  const errors = models.flatMap((m) => m.errors.map((e) => `${m.brand}: ${e}`));
  const reference = models.find((m) => m.default) ?? models[0];
  for (const m of models)
    if (m !== reference && skeleton(m.root) !== skeleton(reference.root))
      errors.push(
        `${m.brand}: native theme shape differs from ${reference.brand} — brands must expose identical token structure`,
      );
  return { models, errors };
}

export { isGroup };
