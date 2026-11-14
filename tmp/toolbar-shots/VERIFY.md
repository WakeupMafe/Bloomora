# NoteToolbar verification

Measured via preview at `http://127.0.0.1:5173/toolbar-preview.html` (same CSS rules as app).

| Viewport | Mode | Control | Rows | Editar+Texto same row | "Aa Formato" |
|---|---|---|---|---|---|
| 1280 | full | 36px | 2 | yes | complete |
| 1280 | compact | 36px | 1 (nowrap) | yes | complete |
| 1440 | full | 36px | 2 | yes | complete |
| 1920 | full | 36px | 1 (all groups fit) | yes | complete |
| 1180 | full | 44px | 2 | yes | complete |
| 1180 | compact | 44px | 1 (nowrap) | yes | complete |
| 820 | compact | 44px | 1 (nowrap) | yes | complete |

Screenshots saved alongside this file (from browser captures).

## Fixes applied during verify
1. Chevron absolute (not `margin-left: auto`) so it does not steal first-row space.
2. Texto group can shrink font (`flex: 0 1 auto`) before wrapping.
3. Compact `flex-wrap: nowrap` raised in specificity so it wins over `.note-toolbar--grouped`.
