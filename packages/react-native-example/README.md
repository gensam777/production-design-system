# @pds/react-native-example

Expo preview app (SDK 58) for [`@pds/react-native`](../react-native/) — the React Native
equivalent of the web Storybook's visual record. Private, never published, and not a
library: `@pds/react-native` stays a plain package.

It shows Button in **Brand A and Brand B** (side by side or one at a time): every variant,
every size, leading / trailing / both icons, loading (static and an interactive two-second
pending action), disabled, disabled + loading, and long labels that wrap. Brand fonts
(Inter, Figtree) are registered with expo-font from `@expo-google-fonts` under the theme's
PostScript names (`src/fonts.ts`); the app renders with the system fallback until they load.

```
npm run tokens:build                    # once — the app imports the generated RN themes
npm run example:react-native            # expo start (Expo Go / simulator / device)
npm run example:react-native:export     # iOS + Android bundles → packages/react-native-example/dist (CI)
```

Try the platform settings: larger text (Dynamic Type / font size) to see labels wrap and
buttons grow, Reduce Motion / Remove animations to stop the spinner, VoiceOver / TalkBack for
the busy and disabled announcements.

`expo install --check` is told to skip `typescript` and `@types/react`
(`expo.install.exclude`): the repo pins TypeScript 5.9 / `@types/react` 19.2 for every
workspace, and they are type-only.

## Troubleshooting

**"Tried to register two views with the same name RNSVG…"** (`RNSVGFilter`, `RNSVGFeMerge`, …)
is a Fast Refresh artifact, not a duplicate `react-native-svg` (there is one copy:
`npm ls react-native-svg`). The stack goes through `EventTarget.dispatchEvent` — a hot update
from Metro. Native components register once per JS runtime, so any hot update that re-runs
one of react-native-svg's component modules throws. That happens when the dev server's view
of `node_modules` changes under a running app: `npm install` / switching branches while Metro
runs, or restarting Metro (`expo start -c`) while the app stays open. Fix: reload the app's
JS runtime — press `r` in the Expo terminal, or close and reopen the project in Expo Go.
A cold launch never shows it.
