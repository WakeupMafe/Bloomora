import {
  type TabataConfig,
  type TabataPhase,
  phaseChipLabel,
} from '@/features/tabata/tabataTypes'

/**
 * Total en segundos:
 * prep + series×(intervalos×trabajo + (intervalos−1)×descanso)
 * + (series−1)×descanso_series + enfriamiento
 *
 * Ejemplo: 10/20/10 × 8 × 2 con 60 s entre series = 530 s = 8:50
 */
export function totalSeconds(config: TabataConfig): number {
  const {
    preparacion,
    trabajo,
    descanso,
    intervalos,
    series,
    descanso_series,
    enfriamiento,
  } = config
  const perSerie =
    intervalos * trabajo + Math.max(0, intervalos - 1) * descanso
  return (
    preparacion +
    series * perSerie +
    Math.max(0, series - 1) * descanso_series +
    enfriamiento
  )
}

/** Plan de fases: prep → (trabajo, descanso)×N sin descanso final de serie → descanso entre series → enfriamiento → fin. */
export function buildPhasePlan(config: TabataConfig): TabataPhase[] {
  const phases: TabataPhase[] = []
  const {
    preparacion,
    trabajo,
    descanso,
    intervalos,
    series,
    descanso_series,
    enfriamiento,
  } = config

  if (preparacion > 0) {
    phases.push({
      kind: 'preparacion',
      durationSec: preparacion,
      intervalo: 0,
      serie: 0,
      label: phaseChipLabel('preparacion'),
    })
  }

  for (let s = 1; s <= series; s += 1) {
    for (let i = 1; i <= intervalos; i += 1) {
      phases.push({
        kind: 'trabajo',
        durationSec: trabajo,
        intervalo: i,
        serie: s,
        label: phaseChipLabel('trabajo'),
      })
      if (i < intervalos && descanso > 0) {
        phases.push({
          kind: 'descanso',
          durationSec: descanso,
          intervalo: i,
          serie: s,
          label: phaseChipLabel('descanso'),
        })
      }
    }
    if (s < series && descanso_series > 0) {
      phases.push({
        kind: 'descanso_series',
        durationSec: descanso_series,
        intervalo: 0,
        serie: s,
        label: phaseChipLabel('descanso_series'),
      })
    }
  }

  if (enfriamiento > 0) {
    phases.push({
      kind: 'enfriamiento',
      durationSec: enfriamiento,
      intervalo: 0,
      serie: 0,
      label: phaseChipLabel('enfriamiento'),
    })
  }

  phases.push({
    kind: 'fin',
    durationSec: 0,
    intervalo: 0,
    serie: 0,
    label: phaseChipLabel('fin'),
  })

  return phases
}

export function formatMmSs(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export function summarizeConfig(config: TabataConfig): string {
  return `${config.intervalos} × ${config.trabajo}s / ${config.descanso}s · ${config.series} series`
}

/**
 * Recalcula índice/restante con reloj real.
 * Si `now` supera `phaseEndsAt`, encadena fases vencidas (útil al volver de segundo plano).
 */
export function advancePhasesByElapsed(
  phases: TabataPhase[],
  phaseIndex: number,
  phaseEndsAt: number,
  now = Date.now(),
): {
  phaseIndex: number
  phaseEndsAt: number
  remainingMs: number
  finished: boolean
  crossedPhase: boolean
} {
  let idx = Math.max(0, phaseIndex)
  let endsAt = phaseEndsAt
  let crossed = false

  while (idx < phases.length) {
    const phase = phases[idx]
    if (!phase || phase.kind === 'fin' || phase.durationSec <= 0) {
      return {
        phaseIndex: idx,
        phaseEndsAt: now,
        remainingMs: 0,
        finished: true,
        crossedPhase: crossed,
      }
    }

    if (now < endsAt) {
      return {
        phaseIndex: idx,
        phaseEndsAt: endsAt,
        remainingMs: endsAt - now,
        finished: false,
        crossedPhase: crossed,
      }
    }

    crossed = true
    idx += 1
    if (idx >= phases.length) {
      return {
        phaseIndex: phases.length - 1,
        phaseEndsAt: now,
        remainingMs: 0,
        finished: true,
        crossedPhase: crossed,
      }
    }
    const next = phases[idx]
    if (!next || next.kind === 'fin' || next.durationSec <= 0) {
      return {
        phaseIndex: idx,
        phaseEndsAt: now,
        remainingMs: 0,
        finished: true,
        crossedPhase: crossed,
      }
    }
    // Encadena desde el fin de la fase anterior (no desde `now`).
    endsAt = endsAt + next.durationSec * 1000
  }

  return {
    phaseIndex: Math.max(0, phases.length - 1),
    phaseEndsAt: now,
    remainingMs: 0,
    finished: true,
    crossedPhase: crossed,
  }
}
