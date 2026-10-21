import { lobbyScenarios, type LobbyScenario, type OptionId, type ResponseOption } from '../content/lobbyScenarios'
import { promiseFollowupByOption } from '../content/promiseScenarios'
import { familyIdForScenario } from '../content/scenarioVariants'
import { spaetOpening, spaetPending, spaetVariantFor, type SpaetGuestId } from '../content/spaetScenarios'
import { createRunManifest, resolveManifestScenarios, type RunManifest, type RunMode } from './runManifest'

export const SHIFT_SECONDS = 180
export const START_SATISFACTION = 70
export const START_COMPOSURE = 100
export const EFFECT_MULTIPLIER = 5

export type ShiftMode = RunMode
export type Pacing = 'relaxed' | 'challenge'
export type FinishReason = 'completed' | 'timeout'
export type ShiftPhase = 'priority' | 'dialogue'
export type EpisodeOutcome = 'lobby-smooth' | 'recovered' | 'open' | 'timeout'

export const shiftLabels: Record<ShiftMode, string> = {
  frueh: 'Frühschicht',
  nacht: 'Nachtschicht',
  promise: 'Mini-Schicht: Das Versprechen',
  spaet: 'Spätschicht: Zwei Gäste, ein Empfang',
  surprise: 'Überraschung: Fünf Morgenfälle',
}

export function scenarioPackForMode(mode: ShiftMode, seed = 0): LobbyScenario[] {
  return resolveManifestScenarios(createRunManifest(mode, seed))
}

export interface AnsweredCard {
  scenario: LobbyScenario
  option: ResponseOption
  wasBest: boolean
  satisfactionAfter: number
  composureAfter: number
  remainingSecondsAfter: number
}

export interface ShiftState {
  mode: ShiftMode
  pacing: Pacing
  shuffleSeed: number
  manifest: RunManifest
  scenarios: LobbyScenario[]
  scenarioIndex: number
  phase: ShiftPhase
  selectedGuest: SpaetGuestId | null
  pendingGuest: SpaetGuestId | null
  waitedOneService: boolean
  deadlineMissed: boolean
  episodeFacts: string[]
  episodeStatuses: Array<'clear' | 'open'>
  remainingSeconds: number
  satisfaction: number
  composure: number
  answered: AnsweredCard[]
  done: boolean
  finishReason: FinishReason | null
}

export interface ShiftReport {
  mode: ShiftMode
  shiftLabel: string
  scenarioCount: number
  satisfaction: number
  composure: number
  efficiency: number
  finalScore: number
  grade: 1 | 2 | 3 | 4 | 5 | 6
  answeredCount: number
  achievement: Achievement
  patchLines: string[]
  storyOutcome: EpisodeOutcome | null
}

export interface Achievement {
  id: string
  name: string
  flavor: string
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

export function initialShiftState(
  mode: ShiftMode = 'frueh',
  scenarios?: LobbyScenario[],
  pacing: Pacing = 'challenge',
  shuffleSeed = 0,
  replayManifest?: RunManifest,
): ShiftState {
  const manifest = replayManifest ?? createRunManifest(mode, shuffleSeed)
  const selectedScenarios = scenarios ?? resolveManifestScenarios(manifest)
  if (selectedScenarios.length === 0) throw new Error('Cannot start a shift with an empty scenario pack')
  const actualManifest = scenarios && !replayManifest
    ? { ...manifest, encounterIds: selectedScenarios.map(({ id }) => id), familyIds: selectedScenarios.map(familyIdForScenario), scheduledCount: selectedScenarios.length }
    : manifest
  return {
    mode,
    pacing,
    shuffleSeed: actualManifest.seed,
    manifest: actualManifest,
    scenarios: selectedScenarios,
    scenarioIndex: 0,
    phase: mode === 'spaet' ? 'priority' : 'dialogue',
    selectedGuest: null,
    pendingGuest: null,
    waitedOneService: false,
    deadlineMissed: false,
    episodeFacts: [],
    episodeStatuses: [],
    remainingSeconds: SHIFT_SECONDS,
    satisfaction: START_SATISFACTION,
    composure: START_COMPOSURE,
    answered: [],
    done: false,
    finishReason: null,
  }
}

export function currentScenario(state: ShiftState): LobbyScenario | undefined {
  return state.done || (state.mode === 'spaet' && state.phase === 'priority')
    ? undefined
    : state.scenarios[state.scenarioIndex]
}

export function orderedOptions(scenario: LobbyScenario, seed: number, encounterIndex: number): ResponseOption[] {
  const options = [...scenario.options]
  let randomState = 2166136261 ^ seed ^ Math.imul(encounterIndex + 1, 0x45d9f3b)
  for (const character of scenario.id) {
    randomState = Math.imul(randomState ^ character.charCodeAt(0), 16777619)
  }
  const nextRandom = () => {
    randomState ^= randomState << 13
    randomState ^= randomState >>> 17
    randomState ^= randomState << 5
    return (randomState >>> 0) / 0x100000000
  }
  for (let index = options.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1))
    ;[options[index], options[swapIndex]] = [options[swapIndex], options[index]]
  }
  return options
}

export function tickClock(state: ShiftState, seconds = 1): ShiftState {
  if (state.done || state.pacing === 'relaxed' || seconds <= 0) return state
  const remainingSeconds = Math.max(0, state.remainingSeconds - seconds)
  if (remainingSeconds === state.remainingSeconds) return state
  const timedOut = remainingSeconds <= 0
  return {
    ...state,
    remainingSeconds,
    done: timedOut,
    finishReason: timedOut ? 'timeout' : state.finishReason,
  }
}

export function choosePriority(state: ShiftState, guest: SpaetGuestId): ShiftState {
  if (state.done || state.mode !== 'spaet' || state.phase !== 'priority') return state
  const variantId = state.manifest.episodeVariant ?? 'taxi-urgent'
  const pendingGuest: SpaetGuestId = guest === 'taxi' ? 'family' : 'taxi'
  const variant = spaetVariantFor(variantId)
  return {
    ...state,
    scenarios: [spaetOpening(variantId, guest), spaetPending(variantId, pendingGuest), variant.reservation],
    phase: 'dialogue',
    selectedGuest: guest,
    pendingGuest,
  }
}

export function chooseOption(state: ShiftState, optionId: OptionId): ShiftState {
  const scenario = currentScenario(state)
  if (!scenario) return state
  const option = scenario.options.find((candidate) => candidate.id === optionId)
  if (!option) return state

  const satisfaction = clamp(state.satisfaction + option.effects.satisfaction * EFFECT_MULTIPLIER)
  const composure = clamp(state.composure + option.effects.composure * EFFECT_MULTIPLIER)
  const remainingSeconds = state.pacing === 'challenge'
    ? Math.max(0, state.remainingSeconds - option.effects.timeCostSec)
    : state.remainingSeconds
  const answered: AnsweredCard[] = [...state.answered, {
    scenario, option, wasBest: option.id === scenario.bestOptionId,
    satisfactionAfter: satisfaction, composureAfter: composure, remainingSecondsAfter: remainingSeconds,
  }]
  let scenarios = state.scenarios
  let episodeFacts = state.episodeFacts
  let episodeStatuses = state.episodeStatuses
  let deadlineMissed = state.deadlineMissed
  let waitedOneService = state.waitedOneService
  if (state.mode === 'spaet') {
    const evidence = scenario.evidenceByOption?.[optionId]
    if (evidence) {
      episodeFacts = [...episodeFacts, evidence.factId]
      episodeStatuses = [...episodeStatuses, evidence.status]
    }
    if (state.scenarioIndex === 0) {
      const variant = spaetVariantFor(state.manifest.episodeVariant ?? 'taxi-urgent')
      deadlineMissed = state.selectedGuest !== variant.urgentGuest || evidence?.status === 'open'
      waitedOneService = true
      if (deadlineMissed) {
        const deadline = variant.urgentGuest === 'taxi' ? 'taksi' : 'shuttle keluarga'
        episodeFacts = [...episodeFacts, `Saat satu layanan selesai, ${deadline} berangkat sebelum kebutuhannya ditangani.`]
      }
      if (state.pendingGuest) scenarios = [scenario, spaetPending(variant.id, state.pendingGuest), variant.reservation]
    }
  }
  if (state.mode === 'promise' && state.scenarioIndex === 0) scenarios = [scenario, promiseFollowupByOption[optionId]]
  const nextIndex = state.scenarioIndex + 1
  const completed = nextIndex >= state.manifest.scheduledCount
  const timedOut = state.pacing === 'challenge' && remainingSeconds <= 0
  return {
    ...state,
    scenarios,
    scenarioIndex: nextIndex,
    remainingSeconds,
    satisfaction,
    composure,
    answered,
    episodeFacts,
    episodeStatuses,
    deadlineMissed,
    waitedOneService,
    done: completed || timedOut,
    finishReason: completed ? 'completed' : timedOut ? 'timeout' : null,
  }
}

export function outcomeFor(state: ShiftState): EpisodeOutcome | null {
  if (state.mode !== 'spaet') return null
  if (state.finishReason === 'timeout') return 'timeout'
  if (state.finishReason !== 'completed') return null
  if (state.episodeStatuses.some((status) => status === 'open')) return 'open'
  return state.deadlineMissed ? 'recovered' : 'lobby-smooth'
}

export function efficiencyFor(answered: AnsweredCard[], total = lobbyScenarios.length): number {
  if (answered.length === 0) return 0
  const avgTimeCost = answered.reduce((sum, card) => sum + card.option.effects.timeCostSec, 0) / answered.length
  return clamp(Math.round(100 * (answered.length / total) * (1 - (avgTimeCost / 45) * 0.3)))
}

export function gradeFor(finalScore: number): ShiftReport['grade'] {
  if (finalScore >= 90) return 1
  if (finalScore >= 80) return 2
  if (finalScore >= 65) return 3
  if (finalScore >= 50) return 4
  if (finalScore >= 35) return 5
  return 6
}

export function buildReport(state: ShiftState): ShiftReport {
  const scenarioCount = state.manifest.scheduledCount
  const efficiency = efficiencyFor(state.answered, scenarioCount)
  const finalScore = Math.round(state.satisfaction * 0.4 + state.composure * 0.3 + efficiency * 0.3)
  const grade = gradeFor(finalScore)
  const achievement = achievementFor(state, grade)
  const bestLines = state.answered.filter((card) => card.wasBest).slice(-3).map((card) => card.scenario.shiftReportLine)
  const patchLines = state.mode === 'spaet'
    ? (state.episodeFacts.length > 0 ? state.episodeFacts : ['Belum ada layanan yang dikomit saat waktu habis.'])
    : bestLines.length > 0 ? bestLines : ['Erfahrung gesammelt. Viel Erfahrung.']

  return {
    mode: state.mode,
    shiftLabel: shiftLabels[state.mode],
    scenarioCount,
    satisfaction: state.satisfaction,
    composure: state.composure,
    efficiency,
    finalScore,
    grade,
    answeredCount: state.answered.length,
    achievement,
    patchLines,
    storyOutcome: outcomeFor(state),
  }
}

export function achievementFor(state: ShiftState, grade: ShiftReport['grade']): Achievement {
  const bestIds = new Set(state.answered.filter((card) => card.wasBest).map((card) => card.scenario.id))
  if (grade === 1) {
    return { id: 'note-eins-setzen', name: 'Note Eins, setzen!', flavor: 'Das Zeugnis rahmen wir ein.' }
  }
  if (bestIds.has('busgruppe-checkout')) {
    return { id: 'kartenturm-meister', name: 'Kartenturm-Meister', flavor: '24 Karten. Null Verluste. Jenga-Weltklasse.' }
  }
  if (bestIds.has('teddy-verloren')) {
    return { id: 'teddy-detektiv', name: 'Teddy-Detektiv', flavor: 'Der wichtigste Fall des Tages: gelöst.' }
  }
  if (state.composure >= 80) {
    return { id: 'die-ruhe-selbst', name: 'Die Ruhe selbst', flavor: 'Innerlich Chaos, äußerlich Kurhotel.' }
  }
  if (bestIds.has('pms-absturz')) {
    return { id: 'papier-schlaegt-absturz', name: 'Papier schlägt Absturz', flavor: 'Analoge Technologie: ungeschlagen seit 1450.' }
  }
  if (bestIds.has('moewen-beschwerde')) {
    return { id: 'moewenfluesterer', name: 'Möwenflüsterer', flavor: 'Die Möwen respektieren dich jetzt. Ein bisschen.' }
  }
  return { id: 'schicht-ueberlebt', name: 'Schicht überlebt', flavor: 'Nicht schön, aber dokumentiert.' }
}

export function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds)
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}
