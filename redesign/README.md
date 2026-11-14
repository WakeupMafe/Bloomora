# Bloomora · Rediseño móvil y tablet (inicio + registro)

Paquete para implementar en Cursor. Mockups en `screens/`, HTML de referencia en `html/`, recursos en `assets/`.

## Mascota "Bloomy" (PNG transparente)
Cada pose viene en 1024 px (`bunny_x.png`) para retina o hero y en 512 px (`bunny_x_512.png`) para uso normal.

| Archivo | Dónde se usa | Tamaño recomendado en pantalla |
|---|---|---|
| `bunny_hero_tulip.png` | Hero del Inicio | 232 px en móvil, 320 px en tablet |
| `bunny_wave.png` | Bienvenida del registro y pantalla Entrar | 260 px en bienvenida, 150 px en Entrar |
| `bunny_think.png` | Paso 1, "¿Cómo te llamas?" | 168 px |
| `bunny_phone.png` | Paso 2, celular o cédula | 160 px |
| `bunny_hands_up.png` | Paso 3, código SMS ("¡ya casi!") | 128 px |
| `bunny_cover_eyes.png` | Paso 4, contraseña oculta y campo enfocado | 184 px en móvil, 260 px en tablet |
| `bunny_peek.png` | Paso 4, cuando se toca "mostrar contraseña" | Igual que cover_eyes, para el swap |
| `bunny_celebrate.png` | Éxito, "¡Bienvenida a Bloomora!" | 272 px |
| `bunny_sad.png` | Errores (código incorrecto, sin conexión) | 136 px |
| `bunny_sleep.png` | Estados vacíos (día sin tareas) | 220 px |
| `logo_tulip.png` | Logo del header | 28 px de alto |

Siempre va sobre un círculo con `linear-gradient(140deg, var(--lavl), var(--pinkl))`, unos 16 px más grande que la imagen. Si la imagen es decorativa, ponle `alt=""`.

## SVG (`assets/svg/`)
- `tulip.svg`: ícono de marca para el footer, las viñetas y el favicon simple. Tamaño de 20 a 48 px.
- `leaf.svg`, `sparkle.svg`, `sparkle_pink.svg`: decoraciones alrededor del círculo del conejo, de 14 a 24 px, con `aria-hidden`.
- `blob_bg.svg`: fondo orgánico para el hero o secciones, escalable.
- `confetti.svg`: va encima de la pantalla de éxito, 320 px de ancho, con una animación suave de caída opcional.
- `zzz.svg`: acompaña a `bunny_sleep` en estados vacíos, 48 px.
- `progress_dots.svg`: referencia visual de la barra de pasos. Impleméntala en HTML y CSS (ver prompt).
- Íconos de 24 px con trazo `--pur`: `icon_back`, `icon_eye`, `icon_eye_off`, `icon_check` (verde), `icon_id`, `icon_phone`, `icon_task`, `icon_habit`, `icon_progress`.

## Pantallas (`screens/`)
`home_mobile`, `home_tablet`, `01_bienvenida`, `02_nombre`, `03_celular_cedula`, `04_codigo`, `04b_codigo_error`, `05_contrasena`, `05b_contrasena_visible`, `06_exito`, `07_entrar`, `08_dia_vacio`, `tablet_contrasena` y `flow_board` (mapa del flujo completo).

## Notas de accesibilidad
- El botón principal usa `--pinkd` con texto blanco de 19 px en negrita (3.07:1, cumple AA para texto grande). No uses texto más pequeño sobre `--pinkd`. Si algún día se necesita texto normal sobre rosado, usa un tono más oscuro, como `#C2456F` (4.8:1).
- `--mut` (#968EAF) no cumple contraste para textos. Úsalo solo en bordes o placeholders decorativos. Los textos secundarios van en `--ink` o `--pur`.
- La palabra "calma" se resalta con un subrayado tipo marcador rosado, no con cursiva ni con color rosado (que no pasa contraste).
- Para un tono neutro, el título del éxito puede ser "¡Te damos la bienvenida, {nombre}!".

---

## Prompt para Cursor

```
Rediseña la vista de Inicio y el flujo de registro/login de Bloomora para móvil y tablet siguiendo los mockups en /redesign/screens (flow_board.png muestra el orden). Usa SOLO los tokens existentes de styles.css (--bg, --card, --line, --line2, --pur, --pur2, --ink, --pink, --pinkd, --pinkl, --lav, --lavl, --lavsoft, --green) y la fuente Quicksand. Nada de cursivas ni text-shadow.

Layout
- Grid de 8 pt: espaciados 8/16/24/32/48. Padding lateral 24px en móvil y 48px en tablet.
- Breakpoints mobile-first: base <600px (columna única, centrada). Desde 600px (tablet), el contenido va en un contenedor de 560–640px centrado. El registro va dentro de una card blanca (radius 32px) y en Inicio los 3 beneficios se muestran como 3 cards en fila. Desde 1024px se mantiene la versión de escritorio actual.
- Inicio: logo + pill BETA, hero con bunny_hero_tulip.png sobre un círculo con degradado lavl→pinkl, H1 32px (44px en tablet) "Organiza tu día con calma y propósito" ("calma" con un subrayado tipo marcador rosado), subtítulo de 17px, máximo 2 CTAs ("Comenzar gratis" relleno --pinkd y "Ya tengo cuenta" outline). En tablet "Ya tengo cuenta" pasa al header. Debajo va una línea de confianza "✓ Gratis y sin tarjeta". Reemplaza los chips por la sección "Un día a la vez" con 3 filas o cards (ícono 48px + título + 1 línea).

Registro (una pregunta por pantalla)
Bienvenida → 1 Nombre → 2 Celular/Cédula (control segmentado, prefijo +57, inputmode="tel" o "numeric") → 3 Código SMS (6 casillas, autocomplete="one-time-code", reenviar con contador) → 4 Contraseña (checklist en vivo: 8+ caracteres, número, mayúscula) → Éxito → Dashboard vacío. Además, pantalla Entrar (celular o cédula + contraseña + "¿La olvidaste?") y estado de error con bunny_sad.png.
- Topbar: botón atrás circular de 48px con aria-label="Volver", barra de progreso de 4 segmentos (role="progressbar", aria-valuenow/max) y texto "n de 4".
- CTA principal fijo abajo: 56px de alto, pill, ancho completo. Se deshabilita hasta que el campo sea válido.
- Inputs de 56px con radius 16px, borde de 2px --line2 y en foco borde --pinkd + ring de 4px --pinkl. Label visible arriba (nunca solo placeholder), errores con role="alert" y texto, no solo color.
- Accesibilidad: textos de 16px mínimo, objetivos táctiles de 48px mínimo, contraste AA, foco visible, navegación por teclado y respeto de prefers-reduced-motion.

Interacción del conejo en la contraseña (componente <BunnyPassword>)
- Estado por defecto: bunny_think/bunny_wave según el paso. Cuando el input de contraseña recibe focus → bunny_cover_eyes.png. Cuando el usuario activa "mostrar contraseña" (botón ojo de 48px, aria-pressed, aria-label que cambia entre "Mostrar contraseña" y "Ocultar contraseña") → bunny_peek.png y el input pasa a type="text". Al ocultar vuelve cover_eyes y en blur vuelve al estado normal.
- Implementación: las dos imágenes van apiladas en el mismo contenedor (position:absolute) y se intercambian con opacity + transform: translateY(4px)→0, en 200ms ease-out. Precarga ambas. Con prefers-reduced-motion el cambio es sin transición. Las imágenes son decorativas (alt=""), y el estado se anuncia en el texto del subtítulo ("Bloomy no está mirando 🙈" / "Bloomy está espiando un poquito 👀").
- Aplica lo mismo en la pantalla Entrar.

Assets: /redesign/assets (PNG 512 para uso normal, 1024 para srcset 2x) y /redesign/assets/svg. Reutiliza los componentes existentes, no dupliques CSS y no cambies la lógica de autenticación, solo la presentación y el flujo de pasos. Al terminar, lista los archivos que cambiaste.
```
