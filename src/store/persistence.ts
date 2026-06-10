export interface GameProgress {
  xp: number
  completedQuestIds: string[]
  bestRanks: Record<string, string>
}

export interface PersistedGame {
  version: 1
  progress: GameProgress
}

export const STORAGE_KEY = 'hotel-quest-progress-v1'

export const defaultProgress: GameProgress = {
  xp: 0,
  completedQuestIds: [],
  bestRanks: {},
}

function isStorageAvailable(storage: Storage | undefined): storage is Storage {
  return typeof storage !== 'undefined' && storage !== null
}

export function loadProgress(storage: Storage | undefined = globalThis.localStorage): GameProgress {
  if (!isStorageAvailable(storage)) return defaultProgress
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress
    const parsed = JSON.parse(raw) as Partial<PersistedGame>
    if (parsed.version !== 1 || !parsed.progress) return defaultProgress
    return {
      xp: typeof parsed.progress.xp === 'number' && parsed.progress.xp >= 0 ? parsed.progress.xp : 0,
      completedQuestIds: Array.isArray(parsed.progress.completedQuestIds) ? parsed.progress.completedQuestIds.filter((id): id is string => typeof id === 'string') : [],
      bestRanks: parsed.progress.bestRanks && typeof parsed.progress.bestRanks === 'object' ? parsed.progress.bestRanks : {},
    }
  } catch {
    return defaultProgress
  }
}

export function saveProgress(progress: GameProgress, storage: Storage | undefined = globalThis.localStorage): boolean {
  if (!isStorageAvailable(storage)) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, progress } satisfies PersistedGame))
    return true
  } catch {
    return false
  }
}

export function applyQuestResult(
  progress: GameProgress,
  scenarioId: string,
  xpGain: number,
  rank: string,
): GameProgress {
  return {
    xp: progress.xp + xpGain,
    completedQuestIds: progress.completedQuestIds.includes(scenarioId)
      ? progress.completedQuestIds
      : [...progress.completedQuestIds, scenarioId],
    bestRanks: { ...progress.bestRanks, [scenarioId]: betterRank(progress.bestRanks[scenarioId], rank) },
  }
}

const order = ['D', 'C', 'B', 'A', 'S']
function betterRank(current: string | undefined, next: string): string {
  if (!current) return next
  return order.indexOf(next) > order.indexOf(current) ? next : current
}
