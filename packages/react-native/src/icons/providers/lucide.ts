// Lucide provider (ADR 0010, 0019) — the ONLY file in @pds/react-native that imports
// `lucide-react-native`. Everything else works against the catalog `IconName`.
//
// Per-icon deep imports, not the package barrel: Metro does not tree-shake, so importing from
// 'lucide-react-native' would bundle every Lucide icon into the consuming app.
// `lucide-react-native` is pinned to the catalog's provider.version (design/icons/icons.json);
// `npm run icons:test` checks the version and that this map matches the catalog.
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Check from 'lucide-react-native/icons/check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleX from 'lucide-react-native/icons/circle-x';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import Info from 'lucide-react-native/icons/info';
import Minus from 'lucide-react-native/icons/minus';
import Pencil from 'lucide-react-native/icons/pencil';
import Plus from 'lucide-react-native/icons/plus';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import Trash from 'lucide-react-native/icons/trash';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import X from 'lucide-react-native/icons/x';

import type { IconName } from '../types';

// Every lucide-react-native icon shares this component type.
export type LucideIconComponent = typeof Plus;

// DS name -> Lucide component. `Record<IconName, …>` makes a missing mapping a compile error.
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
  eye: Eye,
  'eye-off': EyeOff,
};
