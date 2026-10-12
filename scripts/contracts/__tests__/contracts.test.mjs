/**
 * Component contract tests (ADR 0015) — run: npm run contracts:test
 *
 *   1. Every committed contract passes all checks (same as npm run contracts:validate).
 *   2. Every check fires on a broken input (negative tests on a mutated Button contract).
 *   3. Button reference parity, cell by cell: each contract token cell (variant × state,
 *      size) equals the declaration in Button.css; sizing and constants match too. The
 *      validator's web-reference check only compares token *sets*; this pins the cells.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, test } from 'node:test';

import { getDeclaration, parseCss, varRefs } from '../../design-audit/lib/css.mjs';
import { loadFontCatalog } from '../../../packages/tokens/scripts/fonts.mjs';
import { BRANDS, resolveBrand } from '../../../packages/tokens/scripts/ir.mjs';
import {
  checkContract,
  checkFigma,
  checkPlatformApi,
  checkReferences,
  checkSchema,
  checkTokens,
  checkWebReference,
  compileSchema,
  parseContract,
} from '../lib/contracts.mjs';

const DIR = 'design/contracts/components';
const BUTTON = `${DIR}/button.contract.yaml`;
const read = (p) => {
  const f = p.split('#')[0];
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
};
const clone = (x) => structuredClone(x);
const errors = (findings, check) =>
  findings.filter((f) => f.level === 'error' && (!check || f.check === check));

let validate;
let irs;
let snapshots;
let buttonText;
let button;

before(async () => {
  validate = compileSchema(JSON.parse(read('design/contracts/schema.json')));
  const fontCatalog = loadFontCatalog();
  irs = [];
  for (const b of BRANDS) irs.push(await resolveBrand(b, { fontCatalog }));
  snapshots = fs
    .readdirSync('scripts/design-audit/snapshots')
    .filter((f) => f.endsWith('.figma.json'))
    .map((f) => JSON.parse(read(`scripts/design-audit/snapshots/${f}`)));
  buttonText = read(BUTTON);
  button = parseContract(buttonText).contract;
});

describe('committed contracts', () => {
  test('all pass every check', () => {
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.contract.yaml'));
    assert.ok(files.length > 0);
    for (const f of files) {
      const text = read(`${DIR}/${f}`);
      const { contract, problems } = parseContract(text);
      assert.deepEqual(problems, [], f);
      const found = checkContract({
        text,
        contract,
        validate,
        irs,
        snapshots,
        read,
        file: `${DIR}/${f}`,
      });
      assert.deepEqual(errors(found), [], f);
    }
  });
});

describe('each check fires', () => {
  test('yaml: duplicate keys are rejected', () => {
    assert.ok(parseContract('component: A\ncomponent: B\n').problems.length > 0);
  });

  test('schema: missing required field, unknown field, icon slot without decorative', () => {
    const a = clone(button);
    delete a.tokens;
    assert.ok(errors(checkSchema(validate, a), 'schema').length);

    const b = clone(button);
    b.className = 'x';
    assert.ok(errors(checkSchema(validate, b), 'schema').length);

    const c = clone(button);
    delete c.slots.leadingIcon.decorative;
    assert.ok(errors(checkSchema(validate, c), 'schema').length);

    const d = clone(button);
    d.status.web = 'shipped';
    assert.ok(errors(checkSchema(validate, d), 'schema').length);
  });

  test('platform-api: web and native API names are rejected anywhere in the file', () => {
    for (const leak of [
      'className',
      'href',
      'aria-busy',
      'ReactNode',
      'type="submit"',
      'onPress',
      'onClick',
      'accessibilityLabel',
      'Modifier',
      'HTML attributes',
    ])
      assert.ok(
        errors(checkPlatformApi(`${buttonText}\n# note: ${leak}\n`), 'platform-api').length,
        leak,
      );
    assert.deepEqual(errors(checkPlatformApi(buttonText)), []);
  });

  test('references: bad default, unknown part, unknown selector key, bad tokens-from', () => {
    const a = clone(button);
    a.properties.variant.default = 'ghost';
    assert.ok(errors(checkReferences(a)).length);

    const b = clone(button);
    b.tokens.badge = { color: 'color.text.primary' };
    assert.ok(errors(checkReferences(b)).length);

    const c = clone(button);
    c.tokens.container.background.primary.active = 'color.action.primary.active';
    assert.ok(errors(checkReferences(c)).length);

    const d = clone(button);
    d.states.shared.loading['tokens-from'] = 'busy';
    assert.ok(errors(checkReferences(d)).length);

    const e = clone(button);
    delete e.sizing['visual-height'].lg;
    assert.ok(errors(checkReferences(e)).length);
  });

  test('tokens: Core, brand.*, platform-only and unknown paths are rejected', () => {
    for (const bad of [
      'color.blue.600', // Core
      'brand.color.primary.600', // brand contract
      'font.fallback.sans', // web-only semantic
      'color.action.primary.pressed', // does not exist
    ]) {
      const c = clone(button);
      c.tokens.container.background.primary.default = bad;
      assert.ok(errors(checkTokens(c, irs), 'tokens').length, bad);
    }
  });

  test('figma: axis/enum mismatch, variant count and snapshot values', () => {
    const a = clone(button);
    delete a.figma.axes.Variant.values.Danger;
    assert.ok(errors(checkFigma(a, snapshots), 'figma').length);

    const b = clone(button);
    b.figma['variant-count'] = 288;
    assert.ok(errors(checkFigma(b, snapshots), 'figma').length);

    const c = clone(button);
    delete c.figma.axes.State.values.Loading;
    assert.ok(errors(checkFigma(c, snapshots), 'figma').length);

    const snap = clone(snapshots);
    const node = Object.values(snap[0].frames)
      .flatMap((f) => Object.values(f.roles))
      .find((n) => n.component?.set === 'Button');
    node.component.props.Variant = 'Ghost';
    assert.ok(errors(checkFigma(button, snap), 'figma').length);
  });

  test('web-reference: enum union, default and token-set drift are caught', () => {
    const a = clone(button);
    a.properties.variant.values.ghost = 'x';
    assert.ok(errors(checkWebReference(a, read, irs), 'web-reference').length);

    const b = clone(button);
    b.properties.size.default = 'lg';
    assert.ok(errors(checkWebReference(b, read, irs), 'web-reference').length);

    const c = clone(button);
    c.tokens.container.gap.md = 'space.inline.md'; // not used by Button.css
    assert.ok(errors(checkWebReference(c, read, irs), 'web-reference').length);

    const d = clone(button);
    delete d.tokens.focusIndicator; // Button.css still uses the focus tokens
    assert.ok(errors(checkWebReference(d, read, irs), 'web-reference').length);

    const e = clone(button);
    e.references.web.source = 'packages/react/src/components/Button/Missing.tsx';
    assert.ok(errors(checkWebReference(e, read, irs), 'web-reference').length);

    // Planned platforms are not checked against an implementation.
    const f = clone(button);
    f.status.web = 'planned';
    delete f.references;
    assert.deepEqual(checkWebReference(f, read, irs), []);
  });
});

describe('Button reference parity (Button.css, cell by cell)', () => {
  const css = () => parseCss(read('packages/react/src/components/Button/Button.css'));
  const cssVar = (path) => (path === 'none' ? 'transparent' : `var(--${path.replace(/\./g, '-')})`);
  const STATE_SELECTOR = {
    default: '',
    hover: ':hover:not(:disabled)',
    pressed: ':active:not(:disabled)',
    disabled: ':disabled',
  };
  // contract (part, property) → CSS property on the variant selector
  const COLOR_CELLS = [
    ['container', 'background', 'background-color'],
    ['container', 'border-color', 'border-color'],
    ['label', 'color', 'color'],
  ];

  /** Contract cell with the documented fallback: missing state → default. */
  const cell = (node, variant, state) => {
    const v = typeof node === 'string' ? node : node[variant];
    if (typeof v === 'string') return v;
    return v[state] ?? v.default;
  };
  /** CSS value with the cascade fallback: missing state rule → default rule → base. */
  const cssCell = (rules, variant, state, prop) =>
    getDeclaration(rules, `.ds-button--${variant}${STATE_SELECTOR[state]}`, prop) ??
    getDeclaration(rules, `.ds-button--${variant}`, prop) ??
    (prop === 'border-color' ? 'transparent' : null);

  test('variant × state colors', () => {
    const rules = css();
    for (const variant of Object.keys(button.properties.variant.values))
      for (const state of Object.keys(STATE_SELECTOR))
        for (const [part, prop, cssProp] of COLOR_CELLS) {
          const want = cssVar(cell(button.tokens[part][prop], variant, state));
          assert.equal(
            cssCell(rules, variant, state, cssProp),
            want,
            `${variant}/${state} ${part}.${prop}`,
          );
        }
  });

  test('spinner color = the variant default label color (spinner paints with currentColor)', () => {
    assert.match(getDeclaration(css(), '.ds-button__spinner', 'border'), /currentColor/);
    for (const variant of Object.keys(button.properties.variant.values))
      assert.equal(
        button.tokens.spinner.color[variant],
        cell(button.tokens.label.color, variant, 'default'),
        variant,
      );
  });

  // Intended: loading keeps the variant's default cells (no tokens-from). The web Button still
  // forces native `disabled` while loading, so the disabled cells apply — a declared
  // implementation gap. Fails if the gap disappears from the contract while the code still
  // has it, or if the code is fixed while the gap is still listed (remove it then).
  test('loading: contract keeps variant colors; web gap is declared while it exists', () => {
    assert.equal(button.states.shared.loading['tokens-from'], undefined);
    assert.ok(button.properties.loading.behavior['keeps-variant-colors']);
    const gap = (button['implementation-gaps'] ?? []).find(
      (g) => g.id === 'loading-keeps-variant-colors' && g.platform === 'web',
    );
    const webForcesDisabled = /disabled\s*\|\|\s*loading/.test(
      read('packages/react/src/components/Button/Button.tsx'),
    );
    if (webForcesDisabled) assert.ok(gap, 'web still disables while loading — declare the gap');
    else assert.ok(!gap, 'web no longer disables while loading — remove the implementation gap');
  });

  // Intended: disabled + loading → disabled wins (not busy, label shown). The web Button's
  // busy state follows `loading` alone — a declared gap while that is still the case.
  test('disabled + loading: disabled wins; web gap is declared while it exists', () => {
    assert.deepEqual(button.states.precedence, ['disabled', 'loading', 'default']);
    assert.ok(button.properties.loading.behavior['yields-to-disabled']);
    assert.ok(button.properties.loading.behavior['remains-focusable']);
    const gap = (button['implementation-gaps'] ?? []).find(
      (g) => g.id === 'disabled-wins-over-loading' && g.platform === 'web',
    );
    const busyIgnoresDisabled = /aria-busy=\{\s*loading\s*\|\|\s*undefined\s*\}/.test(
      read('packages/react/src/components/Button/Button.tsx'),
    );
    if (busyIgnoresDisabled) assert.ok(gap, 'web reports busy while disabled — declare the gap');
    else assert.ok(!gap, 'web no longer reports busy while disabled — remove the gap');
  });

  test('size-keyed tokens and visual height', () => {
    const rules = css();
    const t = button.tokens;
    for (const size of Object.keys(button.properties.size.values)) {
      const s = `.ds-button--${size}`;
      assert.equal(getDeclaration(rules, s, 'height'), `${button.sizing['visual-height'][size]}px`);
      assert.equal(
        getDeclaration(rules, s, 'padding-inline'),
        cssVar(t.container['padding-inline'][size]),
      );
      assert.equal(
        getDeclaration(rules, `${s}.ds-button--has-leading-icon`, 'padding-inline-start'),
        cssVar(t.container['padding-inline-icon-side'][size]),
      );
      assert.equal(
        getDeclaration(rules, `${s}.ds-button--has-trailing-icon`, 'padding-inline-end'),
        cssVar(t.container['padding-inline-icon-side'][size]),
      );
      assert.equal(
        getDeclaration(rules, `${s} .ds-button__content`, 'gap'),
        cssVar(t.container.gap[size]),
      );
      for (const part of ['leadingIcon', 'trailingIcon'])
        assert.equal(
          getDeclaration(rules, `${s} .ds-button__icon`, 'width'),
          cssVar(t[part].size[size]),
        );
      assert.equal(
        getDeclaration(rules, `${s} .ds-button__spinner`, 'width'),
        cssVar(t.spinner.size[size]),
      );
      const role = t.label.typography[size].replace(/\./g, '-');
      assert.equal(getDeclaration(rules, s, 'font-size'), `var(--${role}-font-size)`);
    }
  });

  test('shared container tokens, focus indicator and constants', () => {
    const rules = css();
    const t = button.tokens;
    const k = button['component-constants'];
    assert.equal(getDeclaration(rules, '.ds-button', 'border-radius'), cssVar(t.container.radius));
    assert.equal(
      getDeclaration(rules, '.ds-button', 'border'),
      `${k['border-width'].value}px solid transparent`,
    );
    assert.ok(
      varRefs(getDeclaration(rules, '.ds-button', 'transition')).every(
        (v) => v === cssVar(t.container['state-transition']).slice(4, -1),
      ),
    );
    const ring = getDeclaration(rules, '.ds-button:focus-visible', 'box-shadow');
    const g = k['focus-indicator-geometry'].value;
    assert.match(
      ring,
      new RegExp(
        `0 0 0 ${g['offset-width']}px ${cssVar(t.focusIndicator['offset-color']).replace(/[()]/g, '\\$&')}`,
      ),
    );
    assert.match(
      ring,
      new RegExp(
        `0 0 0 ${g['offset-width'] + g['ring-width']}px ${cssVar(t.focusIndicator.color).replace(/[()]/g, '\\$&')}`,
      ),
    );
    assert.equal(
      getDeclaration(rules, '.ds-button__spinner', 'border-radius'),
      cssVar(t.spinner.radius),
    );
    assert.match(
      getDeclaration(rules, '.ds-button__spinner', 'border'),
      new RegExp(`^${k['spinner-stroke-width'].value}px `),
    );
    assert.match(
      getDeclaration(rules, '.ds-button__spinner', 'animation'),
      new RegExp(`\\b${k['spinner-rotation-duration'].value / 1000}s linear infinite`),
    );
  });
});
