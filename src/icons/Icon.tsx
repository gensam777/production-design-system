import type { IconName, IconSize } from './types';
import { lucideIconMap } from './providers/lucide';

export interface IconProps {
  /** Provider-neutral design-system icon name. See `IconName` for the approved catalog. */
  name: IconName;
  /** Approved display size. Defaults to `'md'` (20px). */
  size?: IconSize;
  className?: string;
  /**
   * Accessible name for a *meaningful standalone* icon (one with no adjacent visible
   * text carrying the same meaning). Providing this makes the icon `role="img"` with
   * this label instead of the default decorative `aria-hidden`.
   *
   * Do not set this for an icon placed beside a visible label that already says the
   * same thing (e.g. a leading icon next to a Button's own text) — that would give
   * assistive technology a duplicate/redundant accessible name. Leave it unset there.
   *
   * An icon-only *interactive* action does not belong here either — that's IconButton's
   * job (a future component), which owns the accessible label on the control itself.
   * Icon always stays presentational/non-interactive.
   */
  'aria-label'?: string;
}

// Semantic icon-size tokens (`icon.sm/md/lg`, 16/20/24px) — see
// src/tokens/semantic/icon.json and docs/foundations/icons.md. Referenced as CSS custom
// properties (not the generated JS constants in src/tokens/build/, which is a gitignored
// build artifact) so a consuming app resolves the actual pixel value the same way it
// already does for every other token in this system, at runtime, from the design
// system's shipped CSS.
const sizeVar: Record<IconSize, string> = {
  sm: 'var(--icon-sm)',
  md: 'var(--icon-md)',
  lg: 'var(--icon-lg)',
};

/**
 * Provider-neutral icon. Renders the design system's default provider (Lucide today —
 * see `providers/lucide.ts`) behind a stable `name` API that does not change if the
 * provider changes.
 *
 * Color is intentionally not a prop: the icon always renders with `currentColor` (the
 * underlying provider's default), so it inherits whatever foreground color its parent
 * sets — the same way a Button's label color and its icon color both come from the
 * component's semantic foreground token, without the icon owning any color itself.
 */
export function Icon({ name, size = 'md', className, 'aria-label': ariaLabel }: IconProps) {
  const LucideIcon = lucideIconMap[name];
  const isMeaningful = ariaLabel !== undefined;

  return (
    <LucideIcon
      size={sizeVar[size]}
      className={className}
      aria-hidden={isMeaningful ? undefined : true}
      aria-label={isMeaningful ? ariaLabel : undefined}
      role={isMeaningful ? 'img' : undefined}
      focusable={false}
    />
  );
}
