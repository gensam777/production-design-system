/**
 * Design audit — Login Figma extractor (READ-ONLY).
 *
 * This file is NOT a Node module. It is the body of a Figma Plugin API script, executed
 * verbatim by Claude through the Figma MCP `use_figma` tool (which wraps it in an async
 * function — hence the top-level `await` and `return`). It is the canonical, versioned
 * extraction logic for scripts/design-audit/snapshots/login.figma.json; never substitute
 * ad-hoc generated MCP code for it. See docs/design-audit.md and
 * .claude/skills/design-audit/SKILL.md for the refresh workflow.
 *
 * Guardrail: this script must only READ. It never creates, edits, deletes, renames,
 * re-binds or re-parents anything, and it does not switch the current page (pages are
 * loaded with `page.loadAsync()`). scripts/design-audit/__tests__/audit.test.mjs fails if
 * a mutating Plugin API call appears in this file.
 *
 * Output: the raw snapshot object (schema v1). Save it to a file and run
 *   node scripts/design-audit/snapshot.mjs import <raw.json>
 * which validates it and writes the committed snapshot.
 */
const EXTRACTOR = { name: 'extract-login', version: 2 };
const FILE_KEY = 'zE07Pl0ioDayHN2GK2set7';
const FRAMES = [
  { key: '01', nodeId: '998:9' },
  { key: '01b', nodeId: '1001:1726' },
  { key: 'B-01b', nodeId: '1063:1926' },
];
const BRAND_COLLECTION = 'Brand';

// ---- helpers (pure reads) ----

const varCache = new Map();
async function variableName(alias) {
  if (!alias || !alias.id) return null;
  if (varCache.has(alias.id)) return varCache.get(alias.id);
  const v = await figma.variables.getVariableByIdAsync(alias.id);
  let name = alias.id;
  if (v) {
    const c = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
    name = `${c ? c.name : v.variableCollectionId}/${v.name}`;
  }
  varCache.set(alias.id, name);
  return name;
}

async function boundToken(node, field) {
  const b = node.boundVariables && node.boundVariables[field];
  if (!b) return null;
  return variableName(Array.isArray(b) ? b[0] : b);
}

async function dim(node, field) {
  if (!(field in node) || typeof node[field] !== 'number') return null;
  const token = await boundToken(node, field);
  // Unbound zero (no padding / no gap / square corners) carries no contract information.
  if (node[field] === 0 && !token) return null;
  return { px: node[field], token };
}

const hex = ({ r, g, b }) =>
  '#' +
  [r, g, b]
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

async function paint(paints) {
  if (!Array.isArray(paints)) return null;
  const p = paints.find((x) => x.visible !== false && x.type === 'SOLID');
  if (!p) return null;
  const alias = p.boundVariables && p.boundVariables.color;
  return { token: alias ? await variableName(alias) : null, hex: hex(p.color) };
}

async function setName(instance) {
  const main = await instance.getMainComponentAsync();
  if (!main) return { set: null, setId: null };
  const owner = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : main;
  return { set: owner.name, setId: owner.id };
}

const cleanProps = (props) =>
  Object.fromEntries(Object.entries(props).map(([k, v]) => [k.replace(/#[\d:]+$/, ''), v.value]));

async function describe(node) {
  if (!node) return null;
  const out = {
    nodeId: node.id,
    type: node.type,
    name: node.name,
    width: node.width,
  };
  if ('layoutSizingHorizontal' in node) out.sizingH = node.layoutSizingHorizontal;
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    out.layout = {
      mode: node.layoutMode,
      wrap: node.layoutWrap,
      primaryAlign: node.primaryAxisAlignItems,
      counterAlign: node.counterAxisAlignItems,
      gap: await dim(node, 'itemSpacing'),
      padding: {
        top: await dim(node, 'paddingTop'),
        right: await dim(node, 'paddingRight'),
        bottom: await dim(node, 'paddingBottom'),
        left: await dim(node, 'paddingLeft'),
      },
    };
  }
  if ('fills' in node) out.fill = await paint(node.fills);
  if ('strokes' in node && node.strokes.length) {
    const stroke = await paint(node.strokes);
    if (stroke && typeof node.strokeWeight === 'number') stroke.weight = node.strokeWeight;
    out.stroke = stroke;
  }
  if ('topLeftRadius' in node) out.radius = await dim(node, 'topLeftRadius');
  if (node.type === 'TEXT') {
    let style = null;
    if (typeof node.textStyleId === 'string' && node.textStyleId) {
      const s = await figma.getStyleByIdAsync(node.textStyleId);
      style = s ? s.name : null;
    }
    const font = typeof node.fontName === 'object' && node.fontName ? node.fontName : null;
    out.text = {
      characters: node.characters,
      style,
      fontFamily: font ? font.family : null,
      fontStyle: font ? font.style : null,
      fontSize: typeof node.fontSize === 'number' ? node.fontSize : null,
    };
  }
  if (node.type === 'INSTANCE') {
    out.component = { ...(await setName(node)), props: cleanProps(node.componentProperties) };
  }
  return out;
}

async function instancesOf(parent) {
  // Instances in document order, not descending into instances themselves.
  const found = [];
  for (const child of parent.children || []) {
    if (child.type === 'INSTANCE') found.push({ node: child, ...(await setName(child)) });
    else if ('children' in child) found.push(...(await instancesOf(child)));
  }
  return found;
}

// Drop null / undefined / empty-object fields so the payload stays small enough to come
// back through the MCP tool result in one piece.
function compact(value) {
  if (Array.isArray(value)) return value.map(compact);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const c = compact(v);
      if (c === null || c === undefined) continue;
      if (typeof c === 'object' && !Array.isArray(c) && Object.keys(c).length === 0) continue;
      out[k] = c;
    }
    return out;
  }
  return value;
}

// FNV-1a (32-bit) over JSON.stringify(frames). snapshot.mjs recomputes it on import, so a
// truncated or mis-transcribed payload is rejected instead of silently committed.
function checksum(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// ---- extraction ----

const frames = {};
for (const { key, nodeId } of FRAMES) {
  const frame = await figma.getNodeByIdAsync(nodeId);
  if (!frame) {
    frames[key] = { nodeId, error: 'node not found' };
    continue;
  }
  let page = frame.parent;
  while (page && page.type !== 'PAGE') page = page.parent;
  if (page) await page.loadAsync();

  // Effective Brand mode: resolved (inherited from any ancestor), and whether it was set
  // explicitly on the frame or an ancestor (no explicit mode = collection default).
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const brand = collections.find((c) => c.name === BRAND_COLLECTION);
  let brandMode = null;
  if (brand) {
    const modeId = frame.resolvedVariableModes[brand.id] || brand.defaultModeId;
    let explicit = false;
    for (let n = frame; n && n.type !== 'PAGE'; n = n.parent) {
      if (n.explicitVariableModes && n.explicitVariableModes[brand.id]) explicit = true;
    }
    const mode = brand.modes.find((m) => m.modeId === modeId);
    brandMode = { name: mode ? mode.name : modeId, explicit };
  }

  const card = (await instancesOf({ children: frame.children })).find((i) => i.set === 'Card');
  const content = card ? card.node.children.find((c) => c.name === 'Content') : null;
  const inst = content ? await instancesOf(content) : [];
  const first = (set) => (inst.find((i) => i.set === set) || {}).node || null;
  const texts = content ? content.children.filter((c) => c.type === 'TEXT') : [];
  const password = first('Password Input');
  const passwordField = password
    ? password.findOne((n) => n.type === 'INSTANCE' && n.name === 'input')
    : null;
  const remember = first('Checkbox');
  const email = first('Input');

  frames[key] = {
    nodeId: frame.id,
    name: frame.name,
    page: page ? page.name : null,
    brandMode,
    componentOrder: inst.map((i) => i.set),
    fieldsParent: email && email.parent ? email.parent.name : null,
    roles: {
      page: await describe(frame),
      card: card ? await describe(card.node) : null,
      content: await describe(content),
      title: await describe(texts.length >= 1 ? texts[0] : null),
      description: await describe(texts.length >= 2 ? texts[1] : null),
      footnote: await describe(texts.length >= 3 ? texts[texts.length - 1] : null),
      alert: await describe(first('Alert')),
      email: await describe(email),
      password: await describe(password),
      passwordField: await describe(passwordField),
      row: await describe(remember ? remember.parent : null),
      remember: await describe(remember),
      forgot: await describe(first('Link')),
      submit: await describe(first('Button')),
    },
  };
}

const payload = compact(frames);
return {
  schemaVersion: 1,
  surface: 'login',
  extractor: EXTRACTOR,
  fileKey: FILE_KEY,
  capturedAt: new Date().toISOString(),
  checksum: checksum(JSON.stringify(payload)),
  frames: payload,
};
