import type { Location } from './api/types'

/** Selected location plus every descendant under it (any depth). */
export function locationScopeIds(
  locations: Pick<Location, 'locationId' | 'parentLocationId'>[],
  selectedId: number,
): number[] {
  const children = new Map<number, number[]>()
  for (const loc of locations) {
    if (loc.parentLocationId == null) continue
    const list = children.get(loc.parentLocationId) ?? []
    list.push(loc.locationId)
    children.set(loc.parentLocationId, list)
  }

  const ids: number[] = []
  const stack = [selectedId]
  const seen = new Set<number>()

  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    ids.push(id)
    for (const child of children.get(id) ?? []) {
      stack.push(child)
    }
  }

  return ids
}
