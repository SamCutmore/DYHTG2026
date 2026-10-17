import { useEffect, useState } from 'react'
import { listMarketGroups, listTypes } from './api/clients'
import type { InvType, MarketGroup } from './api/types'
import './Sidebar.css'

type SidebarProps = {
  search: string
  selectedTypeId: number | null
  onSearchChange: (value: string) => void
  onSelectType: (type: InvType) => void
}

type GroupNode = {
  group: MarketGroup
  children: GroupNode[] | null
  types: InvType[] | null
  expanded: boolean
  loading: boolean
}

function matchesSearch(name: string, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return name.toLowerCase().includes(q)
}

function Sidebar({
  search,
  selectedTypeId,
  onSearchChange,
  onSelectType,
}: SidebarProps) {
  const [roots, setRoots] = useState<GroupNode[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingRoots, setLoadingRoots] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoadingRoots(true)
    listMarketGroups('root')
      .then((groups) => {
        if (cancelled) return
        setRoots(
          groups.map((group) => ({
            group,
            children: null,
            types: null,
            expanded: false,
            loading: false,
          })),
        )
        setError(null)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load market')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRoots(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function toggleGroup(path: number[]) {
    const node = getNode(roots, path)
    if (!node) return

    if (node.expanded) {
      setRoots((prev) =>
        updateNode(prev, path, (n) => ({ ...n, expanded: false })),
      )
      return
    }

    if (node.children !== null && node.types !== null) {
      setRoots((prev) =>
        updateNode(prev, path, (n) => ({ ...n, expanded: true })),
      )
      return
    }

    const groupId = node.group.marketGroupId
    const loadTypes = node.group.hasTypes

    setRoots((prev) =>
      updateNode(prev, path, (n) => ({ ...n, loading: true, expanded: true })),
    )

    try {
      const [childGroups, types] = await Promise.all([
        listMarketGroups(groupId),
        loadTypes ? listTypes(groupId) : Promise.resolve([] as InvType[]),
      ])
      setRoots((prev) =>
        updateNode(prev, path, (n) => ({
          ...n,
          loading: false,
          expanded: true,
          children: childGroups.map((group) => ({
            group,
            children: null,
            types: null,
            expanded: false,
            loading: false,
          })),
          types,
        })),
      )
      setError(null)
    } catch (e) {
      setRoots((prev) =>
        updateNode(prev, path, (n) => ({
          ...n,
          loading: false,
          expanded: false,
        })),
      )
      setError(e instanceof Error ? e.message : 'Failed to open group')
    }
  }

  return (
    <aside className="sidebar">
      <h2>Market</h2>
      <label className="sidebar-search">
        <span>Search</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Filter groups and items"
        />
      </label>

      <section className="sidebar-tree" aria-labelledby="market-tree-heading">
        <h3 id="market-tree-heading">Browse</h3>
        {loadingRoots ? <p>Loading…</p> : null}
        {error ? <p className="sidebar-error">{error}</p> : null}
        {!loadingRoots && !roots.length ? <p>No market groups</p> : null}
        <ul>
          {roots.map((node, index) => (
            <GroupBranch
              key={node.group.marketGroupId}
              node={node}
              path={[index]}
              search={search}
              selectedTypeId={selectedTypeId}
              onToggle={toggleGroup}
              onSelectType={onSelectType}
            />
          ))}
        </ul>
      </section>
    </aside>
  )
}

type BranchProps = {
  node: GroupNode
  path: number[]
  search: string
  selectedTypeId: number | null
  onToggle: (path: number[]) => void
  onSelectType: (type: InvType) => void
}

function GroupBranch({
  node,
  path,
  search,
  selectedTypeId,
  onToggle,
  onSelectType,
}: BranchProps) {
  const groupVisible = matchesSearch(node.group.marketGroupName, search)
  const childTypes = (node.types ?? []).filter((t) =>
    matchesSearch(t.typeName, search),
  )
  const q = search.trim()
  const showBecauseChild =
    !!q &&
    ((node.children ?? []).some((c) =>
      matchesSearch(c.group.marketGroupName, search),
    ) ||
      childTypes.length > 0)

  if (!groupVisible && !showBecauseChild && !node.expanded) {
    return null
  }

  return (
    <li className="sidebar-group">
      <button
        type="button"
        className="sidebar-group-toggle"
        aria-expanded={node.expanded}
        onClick={() => onToggle(path)}
      >
        <span className="sidebar-caret">{node.expanded ? '▾' : '▸'}</span>
        <span>{node.group.marketGroupName}</span>
        {node.loading ? <span className="sidebar-muted">…</span> : null}
      </button>

      {node.expanded ? (
        <ul>
          {(node.children ?? []).map((child, index) => (
            <GroupBranch
              key={child.group.marketGroupId}
              node={child}
              path={[...path, index]}
              search={search}
              selectedTypeId={selectedTypeId}
              onToggle={onToggle}
              onSelectType={onSelectType}
            />
          ))}
          {childTypes.map((type) => (
            <li key={type.typeId}>
              <button
                type="button"
                className={
                  selectedTypeId === type.typeId
                    ? 'sidebar-type selected'
                    : 'sidebar-type'
                }
                onClick={() => onSelectType(type)}
              >
                {type.typeName}
              </button>
            </li>
          ))}
          {!node.loading &&
          !(node.children ?? []).length &&
          !childTypes.length ? (
            <li className="sidebar-muted">Empty</li>
          ) : null}
        </ul>
      ) : null}
    </li>
  )
}

function getNode(roots: GroupNode[], path: number[]): GroupNode | null {
  let current: GroupNode | undefined = roots[path[0]]
  for (let i = 1; i < path.length; i++) {
    if (!current?.children) return null
    current = current.children[path[i]]
  }
  return current ?? null
}

function updateNode(
  roots: GroupNode[],
  path: number[],
  updater: (node: GroupNode) => GroupNode,
): GroupNode[] {
  if (path.length === 0) return roots
  return roots.map((node, index) => {
    if (index !== path[0]) return node
    if (path.length === 1) return updater(node)
    if (!node.children) return node
    return {
      ...node,
      children: updateNode(node.children, path.slice(1), updater),
    }
  })
}

export default Sidebar
