import { describe, expect, it } from 'vitest'
import { createRunManifest, resolveManifestScenarios } from './runManifest'
import { familyIdForScenario } from '../content/scenarioVariants'

describe('random shift manifests', () => {
  it.each([
    ['frueh', 12],
    ['nacht', 4],
    ['surprise', 5],
  ] as const)('creates a deterministic %s manifest with %i distinct families', (mode, count) => {
    const first = createRunManifest(mode, 412)
    expect(createRunManifest(mode, 412)).toEqual(first)
    expect(first.scheduledCount).toBe(count)
    expect(first.encounterIds).toHaveLength(count)
    expect(new Set(first.encounterIds).size).toBe(count)
    expect(new Set(first.familyIds).size).toBe(count)
    expect(resolveManifestScenarios(first)).toHaveLength(count)
    expect(resolveManifestScenarios(first).map(({ id }) => id)).toEqual(first.encounterIds)
  })

  it('samples five distinct compatible morning families for surprise', () => {
    for (let seed = 0; seed < 80; seed += 1) {
      const manifest = createRunManifest('surprise', seed)
      const scenarios = resolveManifestScenarios(manifest)
      expect(scenarios).toHaveLength(5)
      expect(new Set(scenarios.map(familyIdForScenario)).size).toBe(5)
      expect(scenarios.every((scenario) => !scenario.id.startsWith('nacht-'))).toBe(true)
    }
  })

  it('retains all twelve and four independent families while choosing authored variants by seed', () => {
    const morning = createRunManifest('frueh', 7)
    const night = createRunManifest('nacht', 7)
    expect(new Set(morning.familyIds).size).toBe(12)
    expect(new Set(night.familyIds).size).toBe(4)

    const morningVariants = new Set<number>()
    const nightVariants = new Set<number>()
    for (let seed = 0; seed < 80; seed += 1) {
      morningVariants.add(createRunManifest('frueh', seed).variantIds.length)
      nightVariants.add(createRunManifest('nacht', seed).variantIds.length)
    }
    expect(morningVariants).toContain(1)
    expect(nightVariants).toContain(1)
  })

  it('keeps the promise chain fixed and treats Spätschicht as one three-encounter block', () => {
    const promise = createRunManifest('promise', 29)
    expect(promise.encounterIds).toEqual(['promise-guest-start', 'promise-return-manageable'])
    const spaet = createRunManifest('spaet', 29)
    expect(spaet.scheduledCount).toBe(3)
    expect(spaet.familyIds).toEqual(['spaet-linked-episode'])
    expect(spaet.episodeVariant).toMatch(/^(taxi-urgent|shuttle-urgent)$/)
  })
})
