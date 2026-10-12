# platforms/ios

Swift sources for the Swift package declared in the repo-root [`Package.swift`](../../Package.swift)
(ADR [0013](../../governance/decisions/0013-cross-platform-architecture.md),
[0017](../../governance/decisions/0017-workspace-structure.md)).

| Module      | Path                 | Status                                                                                     |
| ----------- | -------------------- | ------------------------------------------------------------------------------------------ |
| `PDSTokens` | `Sources/PDSTokens/` | **Generated** by `npm run tokens:build` — do not edit. Committed so SwiftPM needs no Node. |
| `PDSUI`     | `Sources/PDSUI/`     | Reserved for SwiftUI components (Phase 5). Not a target yet.                               |

`npm run tokens:test` fails if `Sources/PDSTokens/` differs from what the build generates. CI
builds the package (`swift build`) in a Swift 6 Linux container.
