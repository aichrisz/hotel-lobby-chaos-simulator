import { lobbyScenarios, type LobbyScenario, type OptionId, type ResponseOption } from '../content/lobbyScenarios'

export const SHIFT_SECONDS = 180
export const START_SATISFACTION = 70
export const START_COMPOSURE = 100
export const EFFECT_MULTIPLIER = 5

export interface AnsweredCard {
  scenario: LobbyScenario
  option: ResponseOption
  wasBest: boolean
  satisfactionAfter: number
  composureAfter: number
  remainingSecondsAfter: number
}

export interface ShiftState {
  scenarioIndex: number
  remainingSeconds: number
  satisfaction: number
  composure: number
  answered: AnsweredCard[]
  done: boolean
}

export interface ShiftReport {
  satisfaction: number
  composure: number
  efficiency: number
  finalScore: number
  grade: 1 | 2 | 3 | 4 | 5 | 6
  answeredCount: number
  achievement: Achievement
  patchLines: string[]
}

export interface Achievement {
  id: string
  name: string
  flavor: string
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

export function initialShiftState(): ShiftState {
  return {
    scenarioIndex: 0,
    remainingSeconds: SHIFT_SECONDS,
    satisfaction: START_SATISFACTION,
    composure: START_COMPOSURE,
    answered: [],
    done: false,
  }
}

export function currentScenario(state: ShiftState): LobbyScenario | undefined {
  return state.done ? undefined : lobbyScenarios[state.scenarioIndex]
}

export function chooseOption(state: ShiftState, optionId: OptionId): ShiftState {
  const scenario = currentScenario(state)
  if (!scenario) return state
  const option = scenario.options.find((candidate) => candidate.id === optionId)
  if (!option) return state

  const satisfaction = clamp(state.satisfaction + option.effects.satisfaction * EFFECT_MULTIPLIER)
  const composure = clamp(state.composure + option.effects.composure * EFFECT_MULTIPLIER)
  const remainingSeconds = Math.max(0, state.remainingSeconds - option.effects.timeCostSec)
  const answered: AnsweredCard[] = [
    ...state.answered,
    {
      scenario,
      option,
      wasBest: option.id === scenario.bestOptionId,
      satisfactionAfter: satisfaction,
      composureAfter: composure,
      remainingSecondsAfter: remainingSeconds,
    },
  ]
  const nextIndex = state.scenarioIndex + 1
  const done = nextIndex >= lobbyScenarios.length || remainingSeconds <= 0

  return {
    scenarioIndex: nextIndex,
    remainingSeconds,
    satisfaction,
    composure,
    answered,
    done,
  }
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
  const efficiency = efficiencyFor(state.answered)
  const finalScore = Math.round(state.satisfaction * 0.4 + state.composure * 0.3 + efficiency * 0.3)
  const grade = gradeFor(finalScore)
  const achievement = achievementFor(state, grade)
  const bestLines = state.answered.filter((card) => card.wasBest).slice(-3).map((card) => card.scenario.shiftReportLine)
  const patchLines = bestLines.length > 0 ? bestLines : ['Erfahrung gesammelt. Viel Erfahrung.']

  return {
    satisfaction: state.satisfaction,
    composure: state.composure,
    efficiency,
    finalScore,
    grade,
    answeredCount: state.answered.length,
    achievement,
    patchLines,
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
