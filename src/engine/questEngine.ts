import type { ChoiceStep, DialogueStep, Scenario, TypingStep } from '../types/content'
import { evaluateTyping, type TypingVerdict } from './answerMatch'
import {
  applyHint,
  heartsFor,
  rankFor,
  satisfactionAfter,
  scoreChoice,
  scoreTyping,
  TYPING_MAX_ATTEMPTS,
  withStreak,
  xpFor,
  type Rank,
} from './scoring'

export interface AnswerLogEntry {
  stepId: string
  kind: DialogueStep['kind']
  correct: boolean
  points: number
  feedback: string
  response: string
  verdict?: TypingVerdict
}

export interface QuestResult {
  score: number
  maxScore: number
  rank: Rank
  xpGain: number
  satisfaction: number
  hearts: number
  log: AnswerLogEntry[]
}

export interface QuestState {
  scenario: Scenario
  stepIndex: number
  score: number
  satisfaction: number
  streak: number
  attemptsByStep: Record<string, number>
  hintedStepIds: string[]
  log: AnswerLogEntry[]
  completed: boolean
  result?: QuestResult
}

export function maxScoreForScenario(scenario: Scenario): number {
  return scenario.steps.reduce((sum, step) => sum + (step.kind === 'typing' ? 150 : 100), 0)
}

export function startQuest(scenario: Scenario): QuestState {
  return {
    scenario,
    stepIndex: 0,
    score: 0,
    satisfaction: 100,
    streak: 0,
    attemptsByStep: {},
    hintedStepIds: [],
    log: [],
    completed: false,
  }
}

export function currentStep(state: QuestState): DialogueStep | undefined {
  return state.scenario.steps[state.stepIndex]
}

function completeIfNeeded(state: QuestState): QuestState {
  if (state.stepIndex < state.scenario.steps.length) return state
  const maxScore = maxScoreForScenario(state.scenario)
  const rank = rankFor(state.score, maxScore)
  return {
    ...state,
    completed: true,
    result: {
      score: state.score,
      maxScore,
      rank,
      xpGain: xpFor(state.scenario.xpReward, rank),
      satisfaction: state.satisfaction,
      hearts: heartsFor(state.satisfaction),
      log: state.log,
    },
  }
}

function advance(state: QuestState): QuestState {
  return completeIfNeeded({ ...state, stepIndex: state.stepIndex + 1 })
}

function nextAttempt(state: QuestState, stepId: string): number {
  return (state.attemptsByStep[stepId] ?? 0) + 1
}

function addAttempt(state: QuestState, stepId: string, attempt: number): QuestState {
  return { ...state, attemptsByStep: { ...state.attemptsByStep, [stepId]: attempt } }
}

export function useHint(state: QuestState): QuestState {
  const step = currentStep(state)
  if (!step || state.completed || !step.hint || state.hintedStepIds.includes(step.id)) return state
  return {
    ...state,
    satisfaction: satisfactionAfter(state.satisfaction, 'hint'),
    hintedStepIds: [...state.hintedStepIds, step.id],
  }
}

export function chooseChoice(state: QuestState, choiceIndex: number): QuestState {
  const step = currentStep(state)
  if (!step || state.completed || step.kind !== 'choice') return state
  const choiceStep = step as ChoiceStep
  const choice = choiceStep.choices[choiceIndex]
  if (!choice) return state

  const attempt = nextAttempt(state, step.id)
  const attempted = addAttempt(state, step.id, attempt)
  if (!choice.correct) {
    return {
      ...attempted,
      satisfaction: satisfactionAfter(attempted.satisfaction, 'wrongChoice'),
      streak: 0,
      log: [
        ...attempted.log,
        { stepId: step.id, kind: 'choice', correct: false, points: 0, feedback: choice.feedback, response: choice.text },
      ],
    }
  }

  const basePoints = scoreChoice(attempt)
  const hinted = attempted.hintedStepIds.includes(step.id)
  const afterHint = hinted ? applyHint(basePoints) : basePoints
  const nextStreak = attempt === 1 ? attempted.streak + 1 : 0
  const points = withStreak(afterHint, nextStreak)
  return advance({
    ...attempted,
    score: attempted.score + points,
    streak: nextStreak,
    log: [
      ...attempted.log,
      { stepId: step.id, kind: 'choice', correct: true, points, feedback: choice.feedback, response: choice.text },
    ],
  })
}

export function submitTyping(state: QuestState, input: string): QuestState {
  const step = currentStep(state)
  if (!step || state.completed || step.kind !== 'typing') return state
  const typingStep = step as TypingStep
  const attempt = nextAttempt(state, step.id)
  const attempted = addAttempt(state, step.id, attempt)
  const verdict = evaluateTyping(input, typingStep)
  const success = verdict !== 'wrong'

  if (!success && attempt < TYPING_MAX_ATTEMPTS) {
    return {
      ...attempted,
      satisfaction: satisfactionAfter(attempted.satisfaction, 'wrongTyping'),
      streak: 0,
      log: [
        ...attempted.log,
        { stepId: step.id, kind: 'typing', correct: false, points: 0, verdict, feedback: 'Try again — focus on the key hotel phrase.', response: input },
      ],
    }
  }

  const basePoints = success ? scoreTyping(verdict) : 0
  const hinted = attempted.hintedStepIds.includes(step.id)
  const afterHint = hinted ? applyHint(basePoints) : basePoints
  const nextStreak = success && attempt === 1 ? attempted.streak + 1 : 0
  const points = withStreak(afterHint, nextStreak)
  const nextSatisfaction = success ? attempted.satisfaction : satisfactionAfter(attempted.satisfaction, 'wrongTyping')
  return advance({
    ...attempted,
    score: attempted.score + points,
    satisfaction: nextSatisfaction,
    streak: nextStreak,
    log: [
      ...attempted.log,
      {
        stepId: step.id,
        kind: 'typing',
        correct: success,
        points,
        verdict,
        feedback: success ? `Accepted as ${verdict}.` : `Answer revealed: ${typingStep.acceptedAnswers[0]}`,
        response: input,
      },
    ],
  })
}
