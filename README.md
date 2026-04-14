# Bloomora

**Bloomora** es una aplicación web para organizar el día, cuidar hábitos y visualizar metas con un enfoque cálido y sencillo. Está pensada para quienes quieren una agenda clara, seguimiento de objetivos y listas útiles sin complicarse.

## Stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** para la interfaz
- **Supabase** (Postgres + API) para datos y perfil
- **TanStack Query** para caché y sincronización con el servidor

## Funcionalidades

- **Entrada por celular y perfil**: acceso rápido con número de teléfono; identidad de negocio por **cédula** enlazada al perfil en Supabase.
- **Agenda del día**: tareas con horario, marcar como completadas, editar y eliminar; integración con `daily_plans`, `tasks` y `task_blocks`.
- **Subtareas / paso a paso**: cada tarea puede tener una lista opcional de pasos (por ejemplo rutina de skin care o aseo del hogar), guardada en la tabla `subtasks`.
- **Metas**: creación y listado usando la tabla real `goals`; vistas tipo lista, tablero y calendario; tracker de días con `goal_day_marks`.
- **Vincular tareas con metas**: crear tareas desde una meta o vincularlas; al completar la tarea se puede reflejar progreso en la meta según la configuración de la base.
- **Listas**: listas e ítems personales (`lists`, `list_items`).
- **Perfil**: nombre, cédula, tema, avatares predefinidos y cierre de sesión.

## Requisitos

- Node.js **20+** (recomendado)
- Cuenta **Supabase** y variables en `.env.local` (no se suben al repo):

  ```bash
  VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
  VITE_SUPABASE_ANON_KEY=tu_anon_key
  ```

## Scripts

```bash
npm install
npm run dev    # desarrollo
npm run build  # compilación de producción
npm run lint   # ESLint
```

## Base de datos

En `supabase/migrations/` hay scripts SQL para columnas UI de metas, marcas del tracker, listas y políticas RLS en modo simple (acceso con rol `anon` cuando la app no usa Supabase Auth en el cliente). Aplica las migraciones en el orden que corresponda a tu proyecto.

## Licencia

Uso privado del repositorio salvo que se indique lo contrario.
