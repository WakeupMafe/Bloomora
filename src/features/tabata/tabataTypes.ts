/** Configuración numérica de un Tabata (segundos / conteos). */
export type TabataConfig = {
  preparacion: number
  trabajo: number
  descanso: number
  intervalos: number
  series: number
  descanso_series: number
  enfriamiento: number
}

export type Tabata = TabataConfig & {
  id: string
  nombre: string
  created_at: string
  updated_at: string
}

export type TabataPhaseKind =
  | 'preparacion'
  | 'trabajo'
  | 'descanso'
  | 'descanso_series'
  | 'enfriamiento'
  | 'fin'

export type TabataPhase = {
  kind: TabataPhaseKind
  durationSec: number
  /** 1-based; 0 si no aplica */
  intervalo: number
  /** 1-based; 0 si no aplica */
  serie: number
  label: string
}

export const TABATA_CONFIG_KEYS = [
  'preparacion',
  'trabajo',
  'descanso',
  'intervalos',
  'series',
  'descanso_series',
  'enfriamiento',
] as const satisfies ReadonlyArray<keyof TabataConfig>

export const DEFAULT_TABATA_CONFIG: TabataConfig = {
  preparacion: 10,
  trabajo: 20,
  descanso: 10,
  intervalos: 8,
  series: 2,
  descanso_series: 60,
  enfriamiento: 0,
}

export function configsEqual(a: TabataConfig, b: TabataConfig): boolean {
  return TABATA_CONFIG_KEYS.every((key) => a[key] === b[key])
}

export function phaseChipLabel(kind: TabataPhaseKind): string {
  switch (kind) {
    case 'preparacion':
      return 'PREPARA'
    case 'trabajo':
      return 'TRABAJA'
    case 'descanso':
      return 'DESCANSA'
    case 'descanso_series':
      return 'ENTRE SERIES'
    case 'enfriamiento':
      return 'ENFRÍA'
    case 'fin':
      return 'FIN'
  }
}
