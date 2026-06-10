import { applyQuestResult, defaultProgress, loadProgress, saveProgress, STORAGE_KEY } from './persistence'

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loads default progress when storage is empty', () => {
    expect(loadProgress()).toEqual(defaultProgress)
  })

  it('saves and loads versioned progress', () => {
    const progress = { xp: 150, completedQuestIds: ['check-in'], bestRanks: { 'check-in': 'A' } }
    expect(saveProgress(progress)).toBe(true)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({ version: 1 })
    expect(loadProgress()).toEqual(progress)
  })

  it('falls back to defaults for corrupt json and wrong versions', () => {
    localStorage.setItem(STORAGE_KEY, '{nope')
    expect(loadProgress()).toEqual(defaultProgress)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999, progress: { xp: 10 } }))
    expect(loadProgress()).toEqual(defaultProgress)
  })

  it('returns false when save throws', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('full')
      },
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } satisfies Storage
    expect(saveProgress(defaultProgress, storage)).toBe(false)
  })

  it('applies quest result with additive xp, unique completion, and best rank', () => {
    const first = applyQuestResult(defaultProgress, 'quest-1', 100, 'C')
    const second = applyQuestResult(first, 'quest-1', 150, 'A')
    const third = applyQuestResult(second, 'quest-1', 50, 'B')
    expect(third.xp).toBe(300)
    expect(third.completedQuestIds).toEqual(['quest-1'])
    expect(third.bestRanks['quest-1']).toBe('A')
  })
})
