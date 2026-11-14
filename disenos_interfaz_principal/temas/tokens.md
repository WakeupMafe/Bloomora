# Tokens de los temas nuevos de Bloomora

Los nombres coinciden EXACTAMENTE con las variables de `src/theme/bloomoraAppThemes.ts` (`--color-bloomora-*` y las de chrome `--bloomora-*`).
Las variables de la sección "Extra (nuevas)" no existen todavía: hay que agregarlas también a los temas actuales (valores por defecto al final de este archivo) para que el modo oscuro funcione en todos los componentes.

## Rol de cada variable (cómo se usan en los mockups)

| Variable | Rol |
|---|---|
| `--color-bloomora-snow` | Fondo de la página |
| `--color-bloomora-mist` | Fondo de inputs y buscador, superficie hundida |
| `--color-bloomora-lavender-50` | Relleno suave de zonas internas (resumen de metas, selector de día, chips) |
| `--color-bloomora-lavender-100` | Pista de barras de progreso y anillos, hover de botones icono |
| `--color-bloomora-lilac` | Borde de checkbox, acento decorativo suave |
| `--color-bloomora-violet` | Acento de marca (iconos, links internos) |
| `--color-bloomora-deep` | Títulos y textos fuertes |
| `--color-bloomora-rose` | Acento decorativo cálido (corazones, highlights). En Noche/Bosque/Pizarra NO es el primario |
| `--color-bloomora-rose-deep` | Acento principal con texto encima: nav activa (texto), contadores, borde seleccionado, radio marcado |
| `--color-bloomora-blush` | Fondo de nav activa, contadores, lista seleccionada |
| `--color-bloomora-sky` | Acento secundario |
| `--color-bloomora-sky-deep` | Acento secundario fuerte |
| `--color-bloomora-text` | Texto normal |
| `--color-bloomora-text-muted` | Texto secundario |
| `--color-bloomora-white` | Superficie de tarjetas (en oscuro NO es blanco) |
| `--color-bloomora-line` | Bordes y separadores |

## Noche (id `noche`, modo oscuro)

_Tinta y lavanda, acentos menta_

### Paleta (`THEME_PALETTES.noche`)

| Variable | Valor |
|---|---|
| `--color-bloomora-snow` | `#15131C` |
| `--color-bloomora-mist` | `#272335` |
| `--color-bloomora-lavender-50` | `#211E2E` |
| `--color-bloomora-lavender-100` | `#2E2A40` |
| `--color-bloomora-lilac` | `#8F82D9` |
| `--color-bloomora-violet` | `#B9AEF5` |
| `--color-bloomora-deep` | `#F1EEFA` |
| `--color-bloomora-rose` | `#D7A8C4` |
| `--color-bloomora-rose-deep` | `#C9BEFA` |
| `--color-bloomora-blush` | `#2C2840` |
| `--color-bloomora-sky` | `#6FD3C3` |
| `--color-bloomora-sky-deep` | `#4FB8A8` |
| `--color-bloomora-text` | `#ECE8F6` |
| `--color-bloomora-text-muted` | `#A9A3BF` |
| `--color-bloomora-white` | `#1E1B29` |
| `--color-bloomora-line` | `#343049` |

### Chrome (`THEME_CHROME.noche`)

| Variable | Valor |
|---|---|
| `--bloomora-btn-from` | `#A99BF5` |
| `--bloomora-btn-to` | `#7FD6C8` |
| `--bloomora-btn-shadow` | `0 0 0 1px rgba(185,174,245,.30), 0 6px 18px rgba(111,211,195,.16)` |
| `--bloomora-btn-shadow-hover` | `0 0 0 1px rgba(185,174,245,.55), 0 8px 26px rgba(111,211,195,.28)` |
| `--bloomora-list-cta-from` | `#A99BF5` |
| `--bloomora-list-cta-via` | `#94B6EC` |
| `--bloomora-list-cta-to` | `#7FD6C8` |
| `--bloomora-list-border-from` | `rgba(185,174,245,.45)` |
| `--bloomora-list-border-via` | `rgba(148,182,236,.30)` |
| `--bloomora-list-border-to` | `rgba(111,211,195,.45)` |
| `--bloomora-list-add-from` | `#A99BF5` |
| `--bloomora-list-add-to` | `#7FD6C8` |
| `--bloomora-list-panel-glow` | `0 0 0 1px #343049, 0 0 48px rgba(169,155,245,.10)` |

### Extra (nuevas, ver abajo)

| Variable | Valor |
|---|---|
| `--bloomora-on-accent` | `#15131C` |
| `--bloomora-success` | `#7CCB9F` |
| `--bloomora-success-soft` | `#1F3329` |
| `--bloomora-danger` | `#F2828F` |
| `--bloomora-danger-soft` | `#3A2229` |
| `--bloomora-surface-2` | `#2A2639` |
| `--bloomora-card-shadow` | `0 1px 0 rgba(255,255,255,.03) inset, 0 10px 30px rgba(0,0,0,.35)` |
| `--bloomora-focus-ring` | `0 0 0 3px rgba(185,174,245,.50)` |
| `--bloomora-overlay` | `rgba(8,7,12,.66)` |
| `--bloomora-progress-from` | `#A99BF5` |
| `--bloomora-progress-to` | `#6FD3C3` |
| `--bloomora-mascot-halo` | `radial-gradient(closest-side, rgba(185,174,245,.26), rgba(111,211,195,.08) 62%, transparent 100%)` |
| `--bloomora-mascot-filter` | `brightness(.94) drop-shadow(0 0 1px rgba(236,232,246,.55)) drop-shadow(0 0 14px rgba(185,174,245,.30))` |
| `--bloomora-scrollbar-thumb` | `#3A3550` |
| `--bloomora-theme-color` | `#15131C` |

### Contraste (WCAG 2.1, calculado)

| Par | Colores | Ratio | Mínimo | Resultado |
|---|---|---|---|---|
| text sobre snow | `#ECE8F6` / `#15131C` | 15.27:1 | 4.5 | AA ✅ |
| text sobre white (tarjeta) | `#ECE8F6` / `#1E1B29` | 14.02:1 | 4.5 | AA ✅ |
| text sobre mist (input) | `#ECE8F6` / `#272335` | 12.66:1 | 4.5 | AA ✅ |
| text-muted sobre snow | `#A9A3BF` / `#15131C` | 7.60:1 | 4.5 | AA ✅ |
| text-muted sobre white | `#A9A3BF` / `#1E1B29` | 6.98:1 | 4.5 | AA ✅ |
| text-muted sobre mist | `#A9A3BF` / `#272335` | 6.30:1 | 4.5 | AA ✅ |
| text-muted sobre lavender-50 | `#A9A3BF` / `#211E2E` | 6.73:1 | 4.5 | AA ✅ |
| deep (títulos) sobre white | `#F1EEFA` / `#1E1B29` | 14.75:1 | 4.5 | AA ✅ |
| on-accent sobre btn-from | `#15131C` / `#A99BF5` | 7.61:1 | 4.5 | AA ✅ |
| on-accent sobre btn-to | `#15131C` / `#7FD6C8` | 10.82:1 | 4.5 | AA ✅ |
| rose-deep sobre blush (contador) | `#C9BEFA` / `#2C2840` | 8.24:1 | 4.5 | AA ✅ |
| deep sobre blush (nav activa) | `#F1EEFA` / `#2C2840` | 12.36:1 | 4.5 | AA ✅ |
| rose-deep sobre white | `#C9BEFA` / `#1E1B29` | 9.83:1 | 3.0 | AA ✅ |
| success sobre white | `#7CCB9F` / `#1E1B29` | 8.76:1 | 3.0 | AA ✅ |
| danger sobre white (icono borrar) | `#F2828F` / `#1E1B29` | 6.72:1 | 3.0 | AA ✅ |
| success sobre success-soft (chip) | `#7CCB9F` / `#1F3329` | 6.97:1 | 4.5 | AA ✅ |
| lilac borde checkbox sobre white (UI 3:1) | `#8F82D9` / `#1E1B29` | 5.11:1 | 3.0 | AA ✅ |

## Bosque (id `bosque`, modo claro)

_Salvia, arena y verde bosque_

### Paleta (`THEME_PALETTES.bosque`)

| Variable | Valor |
|---|---|
| `--color-bloomora-snow` | `#F6F4EF` |
| `--color-bloomora-mist` | `#EEEBE3` |
| `--color-bloomora-lavender-50` | `#F1F4EE` |
| `--color-bloomora-lavender-100` | `#E1E8DE` |
| `--color-bloomora-lilac` | `#6E9B7E` |
| `--color-bloomora-violet` | `#3F7A5A` |
| `--color-bloomora-deep` | `#22372B` |
| `--color-bloomora-rose` | `#D39A6A` |
| `--color-bloomora-rose-deep` | `#2F6B4C` |
| `--color-bloomora-blush` | `#E4EEE6` |
| `--color-bloomora-sky` | `#8DB0C4` |
| `--color-bloomora-sky-deep` | `#3F6C86` |
| `--color-bloomora-text` | `#2F3A35` |
| `--color-bloomora-text-muted` | `#5F6B65` |
| `--color-bloomora-white` | `#FFFFFF` |
| `--color-bloomora-line` | `#E3DFD5` |

### Chrome (`THEME_CHROME.bosque`)

| Variable | Valor |
|---|---|
| `--bloomora-btn-from` | `#2F6B4C` |
| `--bloomora-btn-to` | `#3E7A59` |
| `--bloomora-btn-shadow` | `0 4px 12px rgba(47,107,76,.22)` |
| `--bloomora-btn-shadow-hover` | `0 6px 18px rgba(47,107,76,.32)` |
| `--bloomora-list-cta-from` | `#2F6B4C` |
| `--bloomora-list-cta-via` | `#3A7454` |
| `--bloomora-list-cta-to` | `#3E7A59` |
| `--bloomora-list-border-from` | `#CFE0D3` |
| `--bloomora-list-border-via` | `#E3DFD5` |
| `--bloomora-list-border-to` | `#E8D3C0` |
| `--bloomora-list-add-from` | `#2F6B4C` |
| `--bloomora-list-add-to` | `#3E7A59` |
| `--bloomora-list-panel-glow` | `0 12px 32px rgba(34,55,43,.07)` |

### Extra (nuevas, ver abajo)

| Variable | Valor |
|---|---|
| `--bloomora-on-accent` | `#FFFFFF` |
| `--bloomora-success` | `#2F7A52` |
| `--bloomora-success-soft` | `#EAF5EE` |
| `--bloomora-danger` | `#B5473A` |
| `--bloomora-danger-soft` | `#F8E6E2` |
| `--bloomora-surface-2` | `#FFFFFF` |
| `--bloomora-card-shadow` | `0 1px 2px rgba(34,55,43,.04), 0 12px 32px rgba(34,55,43,.07)` |
| `--bloomora-focus-ring` | `0 0 0 3px rgba(63,122,90,.35)` |
| `--bloomora-overlay` | `rgba(34,40,36,.40)` |
| `--bloomora-progress-from` | `#9DBFA7` |
| `--bloomora-progress-to` | `#3F7A5A` |
| `--bloomora-mascot-halo` | `radial-gradient(closest-side, rgba(157,191,167,.20), transparent 100%)` |
| `--bloomora-mascot-filter` | `none` |
| `--bloomora-scrollbar-thumb` | `#D4CFC3` |
| `--bloomora-theme-color` | `#F6F4EF` |

### Contraste (WCAG 2.1, calculado)

| Par | Colores | Ratio | Mínimo | Resultado |
|---|---|---|---|---|
| text sobre snow | `#2F3A35` / `#F6F4EF` | 10.75:1 | 4.5 | AA ✅ |
| text sobre white (tarjeta) | `#2F3A35` / `#FFFFFF` | 11.81:1 | 4.5 | AA ✅ |
| text sobre mist (input) | `#2F3A35` / `#EEEBE3` | 9.92:1 | 4.5 | AA ✅ |
| text-muted sobre snow | `#5F6B65` / `#F6F4EF` | 5.06:1 | 4.5 | AA ✅ |
| text-muted sobre white | `#5F6B65` / `#FFFFFF` | 5.56:1 | 4.5 | AA ✅ |
| text-muted sobre mist | `#5F6B65` / `#EEEBE3` | 4.67:1 | 4.5 | AA ✅ |
| text-muted sobre lavender-50 | `#5F6B65` / `#F1F4EE` | 5.01:1 | 4.5 | AA ✅ |
| deep (títulos) sobre white | `#22372B` / `#FFFFFF` | 12.73:1 | 4.5 | AA ✅ |
| on-accent sobre btn-from | `#FFFFFF` / `#2F6B4C` | 6.31:1 | 4.5 | AA ✅ |
| on-accent sobre btn-to | `#FFFFFF` / `#3E7A59` | 5.08:1 | 4.5 | AA ✅ |
| rose-deep sobre blush (contador) | `#2F6B4C` / `#E4EEE6` | 5.31:1 | 4.5 | AA ✅ |
| deep sobre blush (nav activa) | `#22372B` / `#E4EEE6` | 10.71:1 | 4.5 | AA ✅ |
| rose-deep sobre white | `#2F6B4C` / `#FFFFFF` | 6.31:1 | 3.0 | AA ✅ |
| success sobre white | `#2F7A52` / `#FFFFFF` | 5.22:1 | 3.0 | AA ✅ |
| danger sobre white (icono borrar) | `#B5473A` / `#FFFFFF` | 5.35:1 | 3.0 | AA ✅ |
| success sobre success-soft (chip) | `#2F7A52` / `#EAF5EE` | 4.67:1 | 4.5 | AA ✅ |
| lilac borde checkbox sobre white (UI 3:1) | `#6E9B7E` / `#FFFFFF` | 3.16:1 | 3.0 | AA ✅ |

## Pizarra (id `pizarra`, modo claro)

_Gris pizarra con toque ocre_

### Paleta (`THEME_PALETTES.pizarra`)

| Variable | Valor |
|---|---|
| `--color-bloomora-snow` | `#F3F5F8` |
| `--color-bloomora-mist` | `#E8ECF1` |
| `--color-bloomora-lavender-50` | `#EEF2F7` |
| `--color-bloomora-lavender-100` | `#DCE3EC` |
| `--color-bloomora-lilac` | `#7A8DA8` |
| `--color-bloomora-violet` | `#3E5A7A` |
| `--color-bloomora-deep` | `#1E2A39` |
| `--color-bloomora-rose` | `#D9A23A` |
| `--color-bloomora-rose-deep` | `#34506F` |
| `--color-bloomora-blush` | `#E3EAF2` |
| `--color-bloomora-sky` | `#7FA6C9` |
| `--color-bloomora-sky-deep` | `#3D6D96` |
| `--color-bloomora-text` | `#27323F` |
| `--color-bloomora-text-muted` | `#5A6676` |
| `--color-bloomora-white` | `#FFFFFF` |
| `--color-bloomora-line` | `#DBE1E9` |

### Chrome (`THEME_CHROME.pizarra`)

| Variable | Valor |
|---|---|
| `--bloomora-btn-from` | `#34506F` |
| `--bloomora-btn-to` | `#4A6A8E` |
| `--bloomora-btn-shadow` | `0 4px 12px rgba(52,80,111,.22)` |
| `--bloomora-btn-shadow-hover` | `0 6px 18px rgba(52,80,111,.32)` |
| `--bloomora-list-cta-from` | `#34506F` |
| `--bloomora-list-cta-via` | `#3F5D80` |
| `--bloomora-list-cta-to` | `#4A6A8E` |
| `--bloomora-list-border-from` | `#CBD6E3` |
| `--bloomora-list-border-via` | `#DBE1E9` |
| `--bloomora-list-border-to` | `#EBD7AE` |
| `--bloomora-list-add-from` | `#34506F` |
| `--bloomora-list-add-to` | `#4A6A8E` |
| `--bloomora-list-panel-glow` | `0 12px 32px rgba(30,42,57,.07)` |

### Extra (nuevas, ver abajo)

| Variable | Valor |
|---|---|
| `--bloomora-on-accent` | `#FFFFFF` |
| `--bloomora-success` | `#2F7A52` |
| `--bloomora-success-soft` | `#EAF5EE` |
| `--bloomora-danger` | `#B5473A` |
| `--bloomora-danger-soft` | `#F8E6E2` |
| `--bloomora-surface-2` | `#FFFFFF` |
| `--bloomora-card-shadow` | `0 1px 2px rgba(30,42,57,.04), 0 12px 32px rgba(30,42,57,.07)` |
| `--bloomora-focus-ring` | `0 0 0 3px rgba(62,90,122,.35)` |
| `--bloomora-overlay` | `rgba(20,28,38,.40)` |
| `--bloomora-progress-from` | `#A9B8CD` |
| `--bloomora-progress-to` | `#D9A23A` |
| `--bloomora-mascot-halo` | `radial-gradient(closest-side, rgba(169,184,205,.22), transparent 100%)` |
| `--bloomora-mascot-filter` | `none` |
| `--bloomora-scrollbar-thumb` | `#C9D2DD` |
| `--bloomora-theme-color` | `#F3F5F8` |

### Contraste (WCAG 2.1, calculado)

| Par | Colores | Ratio | Mínimo | Resultado |
|---|---|---|---|---|
| text sobre snow | `#27323F` / `#F3F5F8` | 11.91:1 | 4.5 | AA ✅ |
| text sobre white (tarjeta) | `#27323F` / `#FFFFFF` | 13.01:1 | 4.5 | AA ✅ |
| text sobre mist (input) | `#27323F` / `#E8ECF1` | 10.96:1 | 4.5 | AA ✅ |
| text-muted sobre snow | `#5A6676` / `#F3F5F8` | 5.35:1 | 4.5 | AA ✅ |
| text-muted sobre white | `#5A6676` / `#FFFFFF` | 5.84:1 | 4.5 | AA ✅ |
| text-muted sobre mist | `#5A6676` / `#E8ECF1` | 4.92:1 | 4.5 | AA ✅ |
| text-muted sobre lavender-50 | `#5A6676` / `#EEF2F7` | 5.19:1 | 4.5 | AA ✅ |
| deep (títulos) sobre white | `#1E2A39` / `#FFFFFF` | 14.53:1 | 4.5 | AA ✅ |
| on-accent sobre btn-from | `#FFFFFF` / `#34506F` | 8.32:1 | 4.5 | AA ✅ |
| on-accent sobre btn-to | `#FFFFFF` / `#4A6A8E` | 5.61:1 | 4.5 | AA ✅ |
| rose-deep sobre blush (contador) | `#34506F` / `#E3EAF2` | 6.86:1 | 4.5 | AA ✅ |
| deep sobre blush (nav activa) | `#1E2A39` / `#E3EAF2` | 11.98:1 | 4.5 | AA ✅ |
| rose-deep sobre white | `#34506F` / `#FFFFFF` | 8.32:1 | 3.0 | AA ✅ |
| success sobre white | `#2F7A52` / `#FFFFFF` | 5.22:1 | 3.0 | AA ✅ |
| danger sobre white (icono borrar) | `#B5473A` / `#FFFFFF` | 5.35:1 | 3.0 | AA ✅ |
| success sobre success-soft (chip) | `#2F7A52` / `#EAF5EE` | 4.67:1 | 4.5 | AA ✅ |
| lilac borde checkbox sobre white (UI 3:1) | `#7A8DA8` / `#FFFFFF` | 3.39:1 | 3.0 | AA ✅ |

## Hallazgo en el tema Rosa actual

Si el botón rosa usa texto blanco sobre `#FF9AAB → #FFC2D1`, el contraste es 2.01:1 y 1.51:1 (no pasa AA). Con `--bloomora-on-accent` se puede corregir por tema, por ejemplo usando `#5B4A8C` como texto (3.73:1 y 4.96:1). Es opcional: no cambies el look de Rosa sin que Mafe lo apruebe.

## Valores por defecto de las variables extra para los temas actuales (claros)

| Variable | Valor por defecto (claros) | Medianoche (`dark`) |
|---|---|---|
| `--bloomora-on-accent` | `#FFFFFF` | `#15131C` |
| `--bloomora-success` | `#2F7A52` | `#7CCB9F` |
| `--bloomora-success-soft` | `#EAF5EE` | `#1F3329` |
| `--bloomora-danger` | `#C2416B` | `#F2828F` |
| `--bloomora-danger-soft` | `#FDECF2` | `#3A2229` |
| `--bloomora-surface-2` | `#FFFFFF` | `#2A2639` |
| `--bloomora-card-shadow` | `0 1px 2px rgba(84,70,135,.04), 0 12px 32px rgba(84,70,135,.08)` | `0 1px 0 rgba(255,255,255,.03) inset, 0 10px 30px rgba(0,0,0,.35)` |
| `--bloomora-focus-ring` | `0 0 0 3px rgba(184,166,240,.45)` | `0 0 0 3px rgba(185,174,245,.50)` |
| `--bloomora-overlay` | `rgba(40,30,60,.35)` | `rgba(8,7,12,.66)` |
| `--bloomora-progress-from` | `#B8A6F0` | `#0EA5E9` |
| `--bloomora-progress-to` | `#F080A0` | `#BAE6FD` |
| `--bloomora-mascot-halo` | `none` | `radial-gradient(closest-side, rgba(185,174,245,.26), rgba(111,211,195,.08) 62%, transparent 100%)` |
| `--bloomora-mascot-filter` | `none` | `brightness(.94) drop-shadow(0 0 1px rgba(236,232,246,.55)) drop-shadow(0 0 14px rgba(185,174,245,.30))` |
| `--bloomora-scrollbar-thumb` | `var(--color-bloomora-line)` | `#3A3550` |
| `--bloomora-theme-color` | `= --color-bloomora-snow del tema` | `#121318` |

Medianoche: aplica estos extras manteniendo su paleta actual; `on-accent` debe ser oscuro (`#15131C`) porque su botón va de `#0EA5E9` a `#BAE6FD` (contraste 6.64:1 y 13.86:1; con blanco sería 2.77:1).

## Snippet listo para pegar (TypeScript)

Adáptalo a la forma exacta de los objetos de `bloomoraAppThemes.ts` (si usan claves sin prefijo, quita el prefijo).

```ts
// Noche
export const PALETTE_NOCHE = {
  "--color-bloomora-snow": "#15131C",
  "--color-bloomora-mist": "#272335",
  "--color-bloomora-lavender-50": "#211E2E",
  "--color-bloomora-lavender-100": "#2E2A40",
  "--color-bloomora-lilac": "#8F82D9",
  "--color-bloomora-violet": "#B9AEF5",
  "--color-bloomora-deep": "#F1EEFA",
  "--color-bloomora-rose": "#D7A8C4",
  "--color-bloomora-rose-deep": "#C9BEFA",
  "--color-bloomora-blush": "#2C2840",
  "--color-bloomora-sky": "#6FD3C3",
  "--color-bloomora-sky-deep": "#4FB8A8",
  "--color-bloomora-text": "#ECE8F6",
  "--color-bloomora-text-muted": "#A9A3BF",
  "--color-bloomora-white": "#1E1B29",
  "--color-bloomora-line": "#343049"
} as const;
export const CHROME_NOCHE = {
  "--bloomora-btn-from": "#A99BF5",
  "--bloomora-btn-to": "#7FD6C8",
  "--bloomora-btn-shadow": "0 0 0 1px rgba(185,174,245,.30), 0 6px 18px rgba(111,211,195,.16)",
  "--bloomora-btn-shadow-hover": "0 0 0 1px rgba(185,174,245,.55), 0 8px 26px rgba(111,211,195,.28)",
  "--bloomora-list-cta-from": "#A99BF5",
  "--bloomora-list-cta-via": "#94B6EC",
  "--bloomora-list-cta-to": "#7FD6C8",
  "--bloomora-list-border-from": "rgba(185,174,245,.45)",
  "--bloomora-list-border-via": "rgba(148,182,236,.30)",
  "--bloomora-list-border-to": "rgba(111,211,195,.45)",
  "--bloomora-list-add-from": "#A99BF5",
  "--bloomora-list-add-to": "#7FD6C8",
  "--bloomora-list-panel-glow": "0 0 0 1px #343049, 0 0 48px rgba(169,155,245,.10)",
  "--bloomora-on-accent": "#15131C",
  "--bloomora-success": "#7CCB9F",
  "--bloomora-success-soft": "#1F3329",
  "--bloomora-danger": "#F2828F",
  "--bloomora-danger-soft": "#3A2229",
  "--bloomora-surface-2": "#2A2639",
  "--bloomora-card-shadow": "0 1px 0 rgba(255,255,255,.03) inset, 0 10px 30px rgba(0,0,0,.35)",
  "--bloomora-focus-ring": "0 0 0 3px rgba(185,174,245,.50)",
  "--bloomora-overlay": "rgba(8,7,12,.66)",
  "--bloomora-progress-from": "#A99BF5",
  "--bloomora-progress-to": "#6FD3C3",
  "--bloomora-mascot-halo": "radial-gradient(closest-side, rgba(185,174,245,.26), rgba(111,211,195,.08) 62%, transparent 100%)",
  "--bloomora-mascot-filter": "brightness(.94) drop-shadow(0 0 1px rgba(236,232,246,.55)) drop-shadow(0 0 14px rgba(185,174,245,.30))",
  "--bloomora-scrollbar-thumb": "#3A3550",
  "--bloomora-theme-color": "#15131C"
} as const;
// Bosque
export const PALETTE_BOSQUE = {
  "--color-bloomora-snow": "#F6F4EF",
  "--color-bloomora-mist": "#EEEBE3",
  "--color-bloomora-lavender-50": "#F1F4EE",
  "--color-bloomora-lavender-100": "#E1E8DE",
  "--color-bloomora-lilac": "#6E9B7E",
  "--color-bloomora-violet": "#3F7A5A",
  "--color-bloomora-deep": "#22372B",
  "--color-bloomora-rose": "#D39A6A",
  "--color-bloomora-rose-deep": "#2F6B4C",
  "--color-bloomora-blush": "#E4EEE6",
  "--color-bloomora-sky": "#8DB0C4",
  "--color-bloomora-sky-deep": "#3F6C86",
  "--color-bloomora-text": "#2F3A35",
  "--color-bloomora-text-muted": "#5F6B65",
  "--color-bloomora-white": "#FFFFFF",
  "--color-bloomora-line": "#E3DFD5"
} as const;
export const CHROME_BOSQUE = {
  "--bloomora-btn-from": "#2F6B4C",
  "--bloomora-btn-to": "#3E7A59",
  "--bloomora-btn-shadow": "0 4px 12px rgba(47,107,76,.22)",
  "--bloomora-btn-shadow-hover": "0 6px 18px rgba(47,107,76,.32)",
  "--bloomora-list-cta-from": "#2F6B4C",
  "--bloomora-list-cta-via": "#3A7454",
  "--bloomora-list-cta-to": "#3E7A59",
  "--bloomora-list-border-from": "#CFE0D3",
  "--bloomora-list-border-via": "#E3DFD5",
  "--bloomora-list-border-to": "#E8D3C0",
  "--bloomora-list-add-from": "#2F6B4C",
  "--bloomora-list-add-to": "#3E7A59",
  "--bloomora-list-panel-glow": "0 12px 32px rgba(34,55,43,.07)",
  "--bloomora-on-accent": "#FFFFFF",
  "--bloomora-success": "#2F7A52",
  "--bloomora-success-soft": "#EAF5EE",
  "--bloomora-danger": "#B5473A",
  "--bloomora-danger-soft": "#F8E6E2",
  "--bloomora-surface-2": "#FFFFFF",
  "--bloomora-card-shadow": "0 1px 2px rgba(34,55,43,.04), 0 12px 32px rgba(34,55,43,.07)",
  "--bloomora-focus-ring": "0 0 0 3px rgba(63,122,90,.35)",
  "--bloomora-overlay": "rgba(34,40,36,.40)",
  "--bloomora-progress-from": "#9DBFA7",
  "--bloomora-progress-to": "#3F7A5A",
  "--bloomora-mascot-halo": "radial-gradient(closest-side, rgba(157,191,167,.20), transparent 100%)",
  "--bloomora-mascot-filter": "none",
  "--bloomora-scrollbar-thumb": "#D4CFC3",
  "--bloomora-theme-color": "#F6F4EF"
} as const;
// Pizarra
export const PALETTE_PIZARRA = {
  "--color-bloomora-snow": "#F3F5F8",
  "--color-bloomora-mist": "#E8ECF1",
  "--color-bloomora-lavender-50": "#EEF2F7",
  "--color-bloomora-lavender-100": "#DCE3EC",
  "--color-bloomora-lilac": "#7A8DA8",
  "--color-bloomora-violet": "#3E5A7A",
  "--color-bloomora-deep": "#1E2A39",
  "--color-bloomora-rose": "#D9A23A",
  "--color-bloomora-rose-deep": "#34506F",
  "--color-bloomora-blush": "#E3EAF2",
  "--color-bloomora-sky": "#7FA6C9",
  "--color-bloomora-sky-deep": "#3D6D96",
  "--color-bloomora-text": "#27323F",
  "--color-bloomora-text-muted": "#5A6676",
  "--color-bloomora-white": "#FFFFFF",
  "--color-bloomora-line": "#DBE1E9"
} as const;
export const CHROME_PIZARRA = {
  "--bloomora-btn-from": "#34506F",
  "--bloomora-btn-to": "#4A6A8E",
  "--bloomora-btn-shadow": "0 4px 12px rgba(52,80,111,.22)",
  "--bloomora-btn-shadow-hover": "0 6px 18px rgba(52,80,111,.32)",
  "--bloomora-list-cta-from": "#34506F",
  "--bloomora-list-cta-via": "#3F5D80",
  "--bloomora-list-cta-to": "#4A6A8E",
  "--bloomora-list-border-from": "#CBD6E3",
  "--bloomora-list-border-via": "#DBE1E9",
  "--bloomora-list-border-to": "#EBD7AE",
  "--bloomora-list-add-from": "#34506F",
  "--bloomora-list-add-to": "#4A6A8E",
  "--bloomora-list-panel-glow": "0 12px 32px rgba(30,42,57,.07)",
  "--bloomora-on-accent": "#FFFFFF",
  "--bloomora-success": "#2F7A52",
  "--bloomora-success-soft": "#EAF5EE",
  "--bloomora-danger": "#B5473A",
  "--bloomora-danger-soft": "#F8E6E2",
  "--bloomora-surface-2": "#FFFFFF",
  "--bloomora-card-shadow": "0 1px 2px rgba(30,42,57,.04), 0 12px 32px rgba(30,42,57,.07)",
  "--bloomora-focus-ring": "0 0 0 3px rgba(62,90,122,.35)",
  "--bloomora-overlay": "rgba(20,28,38,.40)",
  "--bloomora-progress-from": "#A9B8CD",
  "--bloomora-progress-to": "#D9A23A",
  "--bloomora-mascot-halo": "radial-gradient(closest-side, rgba(169,184,205,.22), transparent 100%)",
  "--bloomora-mascot-filter": "none",
  "--bloomora-scrollbar-thumb": "#C9D2DD",
  "--bloomora-theme-color": "#F3F5F8"
} as const;
```
