/**
 * SwiftUI icon generator (ADR 0019 rule 2): the catalog (design/icons/icons.json) + the Lucide
 * artwork at the pinned version (lucide-static/icon-nodes.json) → Swift sources committed in
 * platforms/ios/Sources/PDSUI/Icons/:
 *
 *   DSIconName.swift   public enum, one case per catalog name (raw value = the catalog name)
 *   LucidePaths.swift  internal SwiftUI Path per icon, in Lucide's 24×24 space
 *
 * Every SVG element is normalized to absolute move / line / cubic / close commands (H/V → L,
 * Q/T/S → C, elliptical arcs → cubic Béziers), so the Swift side needs no SVG parser.
 * Pure functions — scripts/icons/generate-swift.mjs writes the files, icons:test checks them.
 */

export const SWIFT_DIR = 'platforms/ios/Sources/PDSUI/Icons';
export const SWIFT_ENUM = `${SWIFT_DIR}/DSIconName.swift`;
export const SWIFT_PATHS = `${SWIFT_DIR}/LucidePaths.swift`;

/** `arrow-left` → `arrowLeft` (Swift case name). */
export const swiftCase = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

// ---------------------------------------------------------------- SVG path data

/** Tokenizes path data; arc flags are single digits that may be written without separators. */
function tokenize(d) {
  const out = [];
  const re = /([MLHVCSQTAZmlhvcsqtaz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
  let cmd = null;
  let argIndex = 0;
  let m;
  let i = 0;
  while (i < d.length) {
    re.lastIndex = i;
    // Arc flags (4th and 5th argument of A) are a single 0/1, possibly glued to what follows.
    if (cmd && cmd.toUpperCase() === 'A' && (argIndex % 7 === 3 || argIndex % 7 === 4)) {
      const f = /[\s,]*([01])/y;
      f.lastIndex = i;
      const fm = f.exec(d);
      if (fm) {
        out.push(Number(fm[1]));
        argIndex++;
        i = f.lastIndex;
        continue;
      }
    }
    m = re.exec(d);
    if (!m) break;
    if (m[1]) {
      cmd = m[1];
      argIndex = 0;
      out.push(m[1]);
    } else {
      out.push(Number(m[2]));
      argIndex++;
    }
    i = re.lastIndex;
  }
  return out;
}

/** SVG endpoint arc → cubic Bézier segments (SVG 1.1 F.6.5 + the standard 4/3·tan(θ/4) fit). */
export function arcToCubics(x1, y1, rx, ry, phiDeg, largeArc, sweep, x2, y2) {
  if (x1 === x2 && y1 === y2) return [];
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  if (!rx || !ry) return [[x1, y1, x2, y2, x2, y2]];
  const phi = (phiDeg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  let coef = Math.sqrt(Math.max(0, num / den));
  if (largeArc === sweep) coef = -coef;
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux, uy, vx, vy) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  else if (sweep && delta < 0) delta += 2 * Math.PI;

  const segments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2) - 1e-9));
  const step = delta / segments;
  const k = (4 / 3) * Math.tan(step / 4);
  const point = (t) => [
    cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin,
    cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos,
  ];
  const deriv = (t) => [
    -rx * Math.sin(t) * cos - ry * Math.cos(t) * sin,
    -rx * Math.sin(t) * sin + ry * Math.cos(t) * cos,
  ];
  const out = [];
  let t = theta1;
  for (let s = 0; s < segments; s++) {
    const t2 = t + step;
    const [px, py] = point(t);
    const [qx, qy] = s === segments - 1 ? [x2, y2] : point(t2);
    const [d1x, d1y] = deriv(t);
    const [d2x, d2y] = deriv(t2);
    out.push([px + k * d1x, py + k * d1y, qx - k * d2x, qy - k * d2y, qx, qy]);
    t = t2;
  }
  return out;
}

/**
 * Path data → absolute commands: { op: 'M'|'L', x, y } | { op: 'C', c1x, c1y, c2x, c2y, x, y }
 * | { op: 'Z' }.
 */
export function normalizePath(d) {
  const tokens = tokenize(d);
  const out = [];
  let i = 0;
  let cmd = null;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let lastC = null; // reflected control point for S
  let lastQ = null; // reflected control point for T
  const num = () => {
    const v = tokens[i++];
    if (typeof v !== 'number') throw new Error(`path data: expected a number in "${d}"`);
    return v;
  };
  const cubic = (c1x, c1y, c2x, c2y, ex, ey) =>
    out.push({ op: 'C', c1x, c1y, c2x, c2y, x: ex, y: ey });

  while (i < tokens.length) {
    if (typeof tokens[i] === 'string') cmd = tokens[i++];
    else if (!cmd) throw new Error(`path data: no command in "${d}"`);
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    let nextC = null;
    let nextQ = null;
    switch (C) {
      case 'M':
        x = ox + num();
        y = oy + num();
        sx = x;
        sy = y;
        out.push({ op: 'M', x, y });
        cmd = rel ? 'l' : 'L'; // implicit lineto for further pairs
        break;
      case 'L':
        x = ox + num();
        y = oy + num();
        out.push({ op: 'L', x, y });
        break;
      case 'H':
        x = ox + num();
        out.push({ op: 'L', x, y });
        break;
      case 'V':
        y = oy + num();
        out.push({ op: 'L', x, y });
        break;
      case 'C': {
        const c1x = ox + num();
        const c1y = oy + num();
        const c2x = ox + num();
        const c2y = oy + num();
        x = ox + num();
        y = oy + num();
        cubic(c1x, c1y, c2x, c2y, x, y);
        nextC = [c2x, c2y];
        break;
      }
      case 'S': {
        const [c1x, c1y] = lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y];
        const c2x = ox + num();
        const c2y = oy + num();
        x = ox + num();
        y = oy + num();
        cubic(c1x, c1y, c2x, c2y, x, y);
        nextC = [c2x, c2y];
        break;
      }
      case 'Q':
      case 'T': {
        const [qx, qy] =
          C === 'Q'
            ? [ox + num(), oy + num()]
            : lastQ
              ? [2 * x - lastQ[0], 2 * y - lastQ[1]]
              : [x, y];
        const ex = ox + num();
        const ey = oy + num();
        cubic(
          x + (2 / 3) * (qx - x),
          y + (2 / 3) * (qy - y),
          ex + (2 / 3) * (qx - ex),
          ey + (2 / 3) * (qy - ey),
          ex,
          ey,
        );
        x = ex;
        y = ey;
        nextQ = [qx, qy];
        break;
      }
      case 'A': {
        const rx = num();
        const ry = num();
        const phi = num();
        const large = num();
        const sweep = num();
        const ex = ox + num();
        const ey = oy + num();
        for (const c of arcToCubics(x, y, rx, ry, phi, large, sweep, ex, ey)) cubic(...c);
        x = ex;
        y = ey;
        break;
      }
      case 'Z':
        out.push({ op: 'Z' });
        x = sx;
        y = sy;
        break;
      default:
        throw new Error(`path data: unsupported command ${cmd}`);
    }
    lastC = nextC;
    lastQ = nextQ;
  }
  return out;
}

// ---------------------------------------------------------------- Swift emit

const n = (v) => {
  const r = Math.round(v * 1e4) / 1e4;
  return String(Object.is(r, -0) ? 0 : r);
};
const pt = (x, y) => `CGPoint(x: ${n(x)}, y: ${n(y)})`;

/** One Lucide node ([tag, attrs]) → Swift statements on `p`. */
export function swiftStatements([tag, a]) {
  const num = (k) => Number(a[k] ?? 0);
  switch (tag) {
    case 'path':
      return normalizePath(a.d).map((c) =>
        c.op === 'M'
          ? `p.move(to: ${pt(c.x, c.y)})`
          : c.op === 'L'
            ? `p.addLine(to: ${pt(c.x, c.y)})`
            : c.op === 'C'
              ? `p.addCurve(to: ${pt(c.x, c.y)}, control1: ${pt(c.c1x, c.c1y)}, control2: ${pt(c.c2x, c.c2y)})`
              : 'p.closeSubpath()',
      );
    case 'circle':
    case 'ellipse': {
      const rx = tag === 'circle' ? num('r') : num('rx');
      const ry = tag === 'circle' ? num('r') : num('ry');
      return [
        `p.addEllipse(in: CGRect(x: ${n(num('cx') - rx)}, y: ${n(num('cy') - ry)}, width: ${n(2 * rx)}, height: ${n(2 * ry)}))`,
      ];
    }
    case 'rect': {
      const rx = a.rx ?? a.ry ?? 0;
      const ry = a.ry ?? a.rx ?? 0;
      const rect = `CGRect(x: ${n(num('x'))}, y: ${n(num('y'))}, width: ${n(num('width'))}, height: ${n(num('height'))})`;
      return Number(rx) || Number(ry)
        ? [`p.addRoundedRect(in: ${rect}, cornerSize: CGSize(width: ${n(rx)}, height: ${n(ry)}))`]
        : [`p.addRect(${rect})`];
    }
    case 'line':
      return [
        `p.move(to: ${pt(num('x1'), num('y1'))})`,
        `p.addLine(to: ${pt(num('x2'), num('y2'))})`,
      ];
    case 'polyline':
    case 'polygon': {
      const v = String(a.points)
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      const lines = [];
      for (let k = 0; k < v.length; k += 2)
        lines.push(
          k === 0 ? `p.move(to: ${pt(v[k], v[k + 1])})` : `p.addLine(to: ${pt(v[k], v[k + 1])})`,
        );
      if (tag === 'polygon') lines.push('p.closeSubpath()');
      return lines;
    }
    default:
      throw new Error(`unsupported Lucide element <${tag}>`);
  }
}

const HEADER = `// Generated by scripts/icons/generate-swift.mjs from design/icons/icons.json — do not edit.
// Regenerate: npm run icons:swift. Checked by npm run icons:test (ADR 0019).
`;

/**
 * @param manifest design/icons/icons.json
 * @param nodes lucide-static/icon-nodes.json at manifest.provider.version
 * @param license the Lucide licence text
 * @returns {Map<string, string>} repo path → file content
 */
export function generateSwift(manifest, nodes, license) {
  const icons = Object.entries(manifest.icons);
  const { version, viewBox } = manifest.provider;

  const cases = icons
    .map(([name, { description, lucide }]) => {
      const c = swiftCase(name);
      return `    /// ${description} Lucide \`${lucide}\`.\n    case ${c}${c === name ? '' : ` = "${name}"`}`;
    })
    .join('\n');
  const enumFile = `${HEADER}
/// A name from the shared icon catalog (design/icons/icons.json, ADR 0019) — the only icon
/// names a PDSUI component accepts. The raw value is the catalog name, identical on every
/// platform (web / React Native \`IconName\`, Compose \`DsIconName\`). Icons are decorative:
/// the owning control provides the accessible name.
public enum DSIconName: String, CaseIterable, Sendable, Hashable {
${cases}
}
`;

  const bodies = icons
    .map(([name, { lucide }]) => {
      const node = nodes[lucide];
      if (!node) throw new Error(`lucide-static has no icon '${lucide}' (catalog '${name}')`);
      const stmts = node.flatMap(swiftStatements).map((s) => `            ${s}`);
      return `        case .${swiftCase(name)}:\n${stmts.join('\n')}`;
    })
    .join('\n');
  const licenseComment = license
    .trim()
    .split('\n')
    .map((l) => (l ? `// ${l}` : '//'))
    .join('\n');
  const pathsFile = `${HEADER}//
// Artwork: Lucide ${version} (lucide-static), converted to SwiftUI paths in its ${viewBox}×${viewBox}
// space. Stroke-only; render with a round-capped, round-joined stroke of ${manifest.provider.strokeWidth} in that space.
//
${licenseComment}

import SwiftUI

extension DSIconName {
    /// The Lucide artwork in a ${viewBox}×${viewBox} coordinate space.
    var lucidePath: Path {
        var p = Path()
        switch self {
${bodies}
        }
        return p
    }
}
`;
  return new Map([
    [SWIFT_ENUM, enumFile],
    [SWIFT_PATHS, pathsFile],
  ]);
}

/** Names in `public enum DSIconName` → raw values (explicit or the case name). */
export function parseSwiftIconNames(source) {
  const m = source.match(/enum\s+DSIconName\b[^{]*\{([\s\S]*?)\n\}/);
  if (!m) return null;
  return [...m[1].matchAll(/^\s*case\s+([A-Za-z0-9]+)(?:\s*=\s*"([^"]+)")?/gm)].map(
    (x) => x[2] ?? x[1],
  );
}
