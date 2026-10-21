import type { LobbyScenario } from '../content/lobbyScenarios'
import { lobbyScenarios } from '../content/lobbyScenarios'
import { nachtScenarios } from '../content/nachtScenarios'
import { promiseScenarios } from '../content/promiseScenarios'
import { familyIdForScenario, variantsForFamily } from '../content/scenarioVariants'
import { spaetVariantFor, type SpaetVariantId } from '../content/spaetScenarios'

export type RunMode = 'frueh' | 'nacht' | 'promise' | 'spaet' | 'surprise'

export interface RunManifest {
  mode: RunMode
  seed: number
  encounterIds: string[]
  familyIds: string[]
  variantIds: string[]
  scheduledCount: number
  episodeVariant?: SpaetVariantId
}

const scenariosById = new Map<string, LobbyScenario>([
  ...lobbyScenarios.map((scenario) => [scenario.id, scenario] as const),
  ...nachtScenarios.map((scenario) => [scenario.id, scenario] as const),
  ...promiseScenarios.map((scenario) => [scenario.id, scenario] as const),
  ...variantsForFamily('firmenrechnung-split').map(({ scenario }) => [scenario.id, scenario] as const),
  ...variantsForFamily('nacht-fruehes-taxi').map(({ scenario }) => [scenario.id, scenario] as const),
])

function seededRandom(seed: number): () => number {
  let state = (seed >>> 0) || 0x9e3779b9
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 0x100000000
  }
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

function basePool(mode: RunMode): LobbyScenario[] {
  return mode === 'nacht' ? nachtScenarios : lobbyScenarios
}

function chooseVariant(scenario: LobbyScenario, random: () => number): { scenario: LobbyScenario; variantId?: string } {
  const variants = variantsForFamily(familyIdForScenario(scenario))
  if (variants.length === 0 || random() >= 0.5) return { scenario }
  const selected = variants[Math.floor(random() * variants.length)]
  return { scenario: selected.scenario, variantId: selected.variantId }
}

export function createRunManifest(mode: RunMode, seed: number): RunManifest {
  const random = seededRandom(seed)
  if (mode === 'promise') {
    return { mode, seed, encounterIds: ['promise-guest-start', 'promise-return-manageable'],
      familyIds: ['promise-linked-story'], variantIds: [], scheduledCount: 2 }
  }
  if (mode === 'spaet') {
    const episodeVariant = random() < 0.5 ? 'taxi-urgent' : 'shuttle-urgent'
    return { mode, seed, episodeVariant,
      encounterIds: ['spaet-linked-opening', 'spaet-linked-pending', 'spaet-reservierung-naechte'],
      familyIds: ['spaet-linked-episode'], variantIds: [episodeVariant], scheduledCount: 3 }
  }

  const pool = basePool(mode)
  const selected = mode === 'surprise' ? shuffled(pool, random).slice(0, 5) : shuffled(pool, random)
  const resolved = selected.map((scenario) => chooseVariant(scenario, random))
  const scenarios = resolved.map(({ scenario }) => scenario)
  return { mode, seed, encounterIds: scenarios.map(({ id }) => id),
    familyIds: scenarios.map(familyIdForScenario),
    variantIds: resolved.flatMap(({ variantId }) => variantId ? [variantId] : []), scheduledCount: scenarios.length }
}

export function resolveManifestScenarios(manifest: RunManifest): LobbyScenario[] {
  if (manifest.mode === 'spaet') {
    const variant = spaetVariantFor(manifest.episodeVariant ?? 'taxi-urgent')
    return [variant.taxiOpening, variant.taxiPending, variant.reservation]
  }
  if (manifest.mode === 'promise') return promiseScenarios
  return manifest.encounterIds.map((id) => {
    const scenario = scenariosById.get(id)
    if (!scenario) throw new Error(`Unknown encounter in run manifest: ${id}`)
    return scenario
  })
}
