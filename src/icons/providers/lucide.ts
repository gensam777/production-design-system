// Lucide provider — the default/reference icon provider for this design system.
//
// This is the ONLY file that imports from `lucide-react`. It owns the icon artwork,
// stroke style, and catalog implementation. Everything else in `src/icons/` (and every
// consuming component) works against the stable `IconName` union in `../types`, never
// against a Lucide-specific component name. See
// governance/decisions/0010-icon-token-architecture.md and docs/foundations/icons.md.
//
// A future provider (e.g. Phosphor) would be a sibling file — `providers/phosphor.ts` —
// exporting the same shape, mapping the same `IconName` keys to its own components.
// Swapping which provider `Icon.tsx` imports from is the only change consumers would
// ever need; the public `<Icon name="..." />` API does not change.
import {
  Plus,
  Minus,
  Check,
  X,
  Search,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  TriangleAlert,
  CircleCheck,
  CircleX,
  Trash,
  Pencil,
  Settings,
} from 'lucide-react';

import type { IconName } from '../types';

// All lucide-react icon components share this exact prop/ref shape — `typeof Plus` is
// a convenient stand-in for it since the package doesn't export a named type for it.
type LucideIconComponent = typeof Plus;

// DS name -> Lucide component. Keys are exhaustively checked against `IconName` by
// TypeScript (`Record<IconName, ...>`), so adding a new DS name without a mapping here
// is a compile error, not a runtime gap.
export const lucideIconMap: Record<IconName, LucideIconComponent> = {
  plus: Plus,
  minus: Minus,
  check: Check,
  close: X,
  search: Search,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  info: Info,
  warning: TriangleAlert,
  success: CircleCheck,
  danger: CircleX,
  trash: Trash,
  edit: Pencil,
  settings: Settings,
};
