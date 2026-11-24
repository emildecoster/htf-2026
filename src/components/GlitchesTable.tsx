
import { useMemo, useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import {
  EllipsisVertical,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  ChevronRight,
  RefreshCw,
  UserPlus,
  Eye,
  Trash2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  CalendarDays,
  ArrowUpDown,
  X,
  MessageSquare,
} from 'lucide-react'

import { IconButton } from '#/components/ui/IconButton.tsx'
import type { Glitch, GlitchStatus } from '#/lib/glitch.ts'
import { GLITCH_STATUSES } from '#/lib/glitch.ts'
import {
  updateGlitchStatus,
  deleteGlitch,
  getDefenders,
  assignGlitch,
} from '#/lib/glitches.functions.ts'

const columns = ['ID', 'Description', 'Status', 'Timestamp', 'Action']

const statusStyles: Record<GlitchStatus, string> = {
  LEAKED: 'bg-red-500/10 text-red-500 border-red-500/20',
  ASSESSING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  CONTAINING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  FIXED: 'bg-green-500/10 text-green-500 border-green-500/20',
}

const timestampFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

type Props = {
  glitches: Glitch[]
  isCommander: boolean
  currentGuardianId: string | null
}

type Defender = {
  guardianId: string
  codename: string
}

type MenuPage = 'main' | 'status' | 'delete' | 'details' | 'assign'

type SortOption =
  | 'newest'
  | 'oldest'
  | 'id-asc'
  | 'id-desc'
  | 'status'

export function GlitchesTable({
  glitches,
  isCommander,
  currentGuardianId,
}: Props) {
  const router = useRouter()

  const navigate = useNavigate()

  // Action menu
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPage, setMenuPage] = useState<MenuPage>('main')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Status slider
  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<string, GlitchStatus>
  >({})

  // Defender assignment
  const [defenders, setDefenders] = useState<Defender[]>([])
  const [loadingDefenders, setLoadingDefenders] = useState(false)

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    GlitchStatus | 'ALL'
  >('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showAssignedOnly, setShowAssignedOnly] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // Search, filter and sort Glitches
  const filteredGlitches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const result = glitches.filter((glitch) => {
      const matchesSearch =
        !query ||
        glitch.glitchId.toLowerCase().includes(query) ||
        glitch.description.toLowerCase().includes(query) ||
        glitch.status.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'ALL' || glitch.status === statusFilter

      const glitchDate = glitch.timestamp.slice(0, 10)

      const matchesStartDate =
        !startDate || glitchDate >= startDate

      const matchesEndDate =
        !endDate || glitchDate <= endDate

      const matchesAssignment =
        !showAssignedOnly ||
        (isCommander
          ? glitch.assignedGuardianId !== null
          : currentGuardianId !== null &&
            glitch.assignedGuardianId === currentGuardianId)

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate &&
        matchesAssignment
      )
    })

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.timestamp.localeCompare(a.timestamp)

        case 'oldest':
          return a.timestamp.localeCompare(b.timestamp)

        case 'id-asc':
          return a.glitchId.localeCompare(b.glitchId)

        case 'id-desc':
          return b.glitchId.localeCompare(a.glitchId)

        case 'status':
          return (
            GLITCH_STATUSES.indexOf(a.status) -
            GLITCH_STATUSES.indexOf(b.status)
          )

        default:
          return 0
      }
    })
  }, [
    glitches,
    searchQuery,
    statusFilter,
    startDate,
    endDate,
    sortBy,
    showAssignedOnly,
    isCommander,
    currentGuardianId,
  ])

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'ALL' ||
    startDate !== '' ||
    endDate !== '' ||
    sortBy !== 'newest' ||
    showAssignedOnly

  function clearFilters() {
    setSearchQuery('')
    setStatusFilter('ALL')
    setStartDate('')
    setEndDate('')
    setSortBy('newest')
    setShowAssignedOnly(false)
  }

  // Check whether the current Guardian can change this Glitch's status.
  function canChangeStatus(glitch: Glitch) {
    return (
      isCommander ||
      (currentGuardianId !== null &&
        glitch.assignedGuardianId === currentGuardianId)
    )
  }

  // Update status
  async function handleStatusChange(
    glitchId: string,
    status: GlitchStatus,
  ) {
    setUpdatingId(glitchId)
    setError(null)

    try {
      await updateGlitchStatus({
        data: { glitchId, status },
      })

      closeMenu()

      setSelectedStatuses((previous) => {
        const updated = { ...previous }
        delete updated[glitchId]
        return updated
      })

      await router.invalidate()
    } catch (err) {
      console.error('Failed to update Glitch:', err)
      setError(`Could not update ${glitchId}. Please try again.`)
    } finally {
      setUpdatingId(null)
    }
  }

  // Quick next status
  async function handleNextStatus(glitch: Glitch) {
    if (!canChangeStatus(glitch)) return

    const currentIndex = GLITCH_STATUSES.indexOf(glitch.status)

    if (
      currentIndex < 0 ||
      currentIndex >= GLITCH_STATUSES.length - 1
    ) {
      return
    }

    await handleStatusChange(
      glitch.glitchId,
      GLITCH_STATUSES[currentIndex + 1],
    )
  }

  // Delete Glitch
  async function handleDeleteGlitch(glitchId: string) {
    setUpdatingId(glitchId)
    setError(null)

    try {
      await deleteGlitch({
        data: { glitchId },
      })

      closeMenu()

      setSelectedStatuses((previous) => {
        const updated = { ...previous }
        delete updated[glitchId]
        return updated
      })

      await router.invalidate()
    } catch (err) {
      console.error('Failed to delete Glitch:', err)
      setError(`Could not delete ${glitchId}. Please try again.`)
    } finally {
      setUpdatingId(null)
    }
  }

  // Load available Defenders
  async function handleOpenAssignment() {
    setMenuPage('assign')
    setLoadingDefenders(true)
    setError(null)

    try {
      const result = await getDefenders()
      setDefenders(result)
    } catch (err) {
      console.error('Failed to load Defenders:', err)
      setError('Could not load Defenders. Please try again.')
    } finally {
      setLoadingDefenders(false)
    }
  }

  // Assign or unassign a Defender
  async function handleAssignGlitch(
    glitchId: string,
    guardianId: string | null,
  ) {
    setUpdatingId(glitchId)
    setError(null)

    try {
      await assignGlitch({
        data: { glitchId, guardianId },
      })

      closeMenu()
      await router.invalidate()
    } catch (err) {
      console.error('Failed to assign Defender:', err)
      setError(
        `Could not assign Defender to ${glitchId}. Please try again.`,
      )
    } finally {
      setUpdatingId(null)
    }
  }

  function closeMenu() {
    setOpenMenu(null)
    setMenuPage('main')
  }

  return (
    <section className="flex flex-col gap-6">
      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500"
        >
          {error}

          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-app p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />

          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by ID, description or status..."
            className="w-full rounded-lg border border-line bg-surface py-3 pl-10 pr-10 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-blue-500"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Status filter */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="status-filter"
              className="flex items-center gap-2 text-xs font-medium text-muted"
            >
              <SlidersHorizontal className="size-3.5" />
              Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as GlitchStatus | 'ALL',
                )
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg outline-none focus:border-blue-500"
            >
              <option value="ALL">All statuses</option>

              {GLITCH_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="start-date"
              className="flex items-center gap-2 text-xs font-medium text-muted"
            >
              <CalendarDays className="size-3.5" />
              From date
            </label>

            <input
              id="start-date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg outline-none focus:border-blue-500"
            />
          </div>

          {/* End date */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="end-date"
              className="flex items-center gap-2 text-xs font-medium text-muted"
            >
              <CalendarDays className="size-3.5" />
              To date
            </label>

            <input
              id="end-date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg outline-none focus:border-blue-500"
            />
          </div>

          {/* Sorting */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="sort-by"
              className="flex items-center gap-2 text-xs font-medium text-muted"
            >
              <ArrowUpDown className="size-3.5" />
              Sort by
            </label>

            <select
              id="sort-by"
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as SortOption)
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg outline-none focus:border-blue-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="id-asc">ID (A–Z)</option>
              <option value="id-desc">ID (Z–A)</option>
              <option value="status">Status order</option>
            </select>
          </div>
        </div>

        {/* Assigned only checkbox */}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-surface px-3 py-3 text-sm transition-colors transition-colors hover:bg-subtle hover:cursor-pointer">
          <input
            type="checkbox"
            checked={showAssignedOnly}
            onChange={(event) =>
              setShowAssignedOnly(event.target.checked)
            }
            className="size-4 rounded border-line accent-blue-500"
          />

          <span className="flex flex-col gap-0.5">
            <span className="font-medium text-fg">
              {isCommander
                ? 'Show assigned Glitches only'
                : 'Show Glitches assigned to me only'}
            </span>
            <span className="text-xs text-muted">
              {isCommander
                ? 'Hide Glitches that have no assigned Defender.'
                : 'Hide Glitches that are assigned to other Defenders or unassigned.'}
            </span>
          </span>
        </label>

        {/* Filter summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p className="text-xs text-muted">
            Showing{' '}
            <span className="font-semibold text-fg">
              {filteredGlitches.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-fg">
              {glitches.length}
            </span>{' '}
            glitches
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-2 text-xs font-medium text-blue-500 transition-colors hover:text-blue-400"
            >
              <X className="size-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* GLITCH TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b-2 border-line text-muted">
              {columns.map((col, i) => (
                <th
                  key={col}
                  className={`px-5 py-4 font-normal ${
                    i === columns.length - 1 ? 'text-center' : ''
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-fg">
            {filteredGlitches.map((glitch) => {
              const isOpen = openMenu === glitch.glitchId
              const isUpdating = updatingId === glitch.glitchId
              const canEditStatus = canChangeStatus(glitch)
              const isAssignedToMe =
                currentGuardianId !== null &&
                glitch.assignedGuardianId === currentGuardianId

              const currentIndex = GLITCH_STATUSES.indexOf(
                glitch.status,
              )

              const nextStatus =
                currentIndex >= 0 &&
                currentIndex < GLITCH_STATUSES.length - 1
                  ? GLITCH_STATUSES[currentIndex + 1]
                  : null

              const selectedStatus =
                selectedStatuses[glitch.glitchId] ?? glitch.status

              const selectedIndex =
                GLITCH_STATUSES.indexOf(selectedStatus)

              return (
                <tr
                  key={glitch.glitchId}
                  className={`border-b border-line transition-colors transition-colors hover:bg-subtle hover:cursor-pointer ${
                    isAssignedToMe ? 'bg-blue-500/[0.035]' : ''
                  }`}
                >
                  {/* ID and assignment indicator */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-2">
                      <span className="font-medium">
                        {glitch.glitchId}
                      </span>

                      {isAssignedToMe && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-500">
                          <Check className="size-3" />
                          Assigned to you
                        </span>
                      )}

                      {isCommander &&
                        glitch.assignedGuardianId !== null && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] font-semibold text-purple-500">
                            <UserPlus className="size-3" />
                            {glitch.assignedGuardianCodename ?? 'Unknown Defender'}
                          </span>
                        )}
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-5 py-4">
                    {glitch.description}
                  </td>

                  {/* Status + Arrow */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[glitch.status]}`}
                      >
                        {glitch.status}
                      </span>

                      {canEditStatus && (
                        <button
                          type="button"
                          disabled={!nextStatus || isUpdating}
                          onClick={() => handleNextStatus(glitch)}
                          title={
                            nextStatus
                              ? `Change to ${nextStatus}`
                              : 'Glitch is already fixed'
                          }
                          aria-label={
                            nextStatus
                              ? `Advance ${glitch.glitchId} to ${nextStatus}`
                              : `${glitch.glitchId} is already fixed`
                          }
                          className="rounded-md p-1.5 transition-colors transition-colors hover:bg-subtle hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          {isUpdating ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : nextStatus ? (
                            <ArrowRight className="size-4" />
                          ) : (
                            <Check className="size-4 text-green-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Timestamp */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <time
                      dateTime={glitch.timestamp}
                      suppressHydrationWarning
                    >
                      {timestampFormat.format(
                        new Date(glitch.timestamp),
                      )}
                    </time>
                  </td>

                  {/* ACTION MENU */}
                  <td className="relative px-5 py-4 text-center">
                    <div className="relative inline-block">
                      <IconButton
                        aria-label={`${glitch.glitchId} actions`}
                        aria-expanded={isOpen}
                        className="transition-colors hover:bg-subtle hover:cursor-pointer"
                        onClick={() => {
                          if (isOpen) {
                            closeMenu()
                          } else {
                            setOpenMenu(glitch.glitchId)
                            setMenuPage('main')
                          }
                        }}
                      >
                        <EllipsisVertical className="size-5" />
                      </IconButton>

                      {isOpen && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-app text-left shadow-xl">
                          {/* MAIN MENU */}
                          {menuPage === 'main' && (
                            <div className="p-2">
                              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                                Glitch Actions
                              </p>

                              {canEditStatus && (
                                <button
                                  type="button"
                                  onClick={() => setMenuPage('status')}
                                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors hover:bg-subtle hover:cursor-pointer"
                                >
                                  <span className="flex items-center gap-3">
                                    <RefreshCw className="size-4 text-blue-500" />
                                    Status
                                  </span>
                                  <ChevronRight className="size-4 text-muted" />
                                </button>
                              )}

                              {isCommander && (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleOpenAssignment}
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors hover:bg-subtle hover:cursor-pointer"
                                  >
                                    <span className="flex items-center gap-3">
                                      <UserPlus className="size-4 text-muted" />
                                      Assign Guardian
                                    </span>
                                    <ChevronRight className="size-4 text-muted" />
                                  </button>

                                  <div className="my-2 border-t border-line" />
                                </>
                              )}

                              {/* VIEW ECHOES */}
                              <button
                                type="button"
                                onClick={() =>
                                  navigate({
                                    to: '/glitches/$glitchId',
                                    params: { glitchId: glitch.glitchId },
                                  })
                                }
                                className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors hover:bg-subtle hover:cursor-pointer"
                              >
                                <span className="flex items-center gap-3">
                                  <MessageSquare className="size-4 text-muted" />
                                  View Echoes
                                </span>
                                <ChevronRight className="size-4 text-muted" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setMenuPage('details')}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors hover:bg-subtle hover:cursor-pointer"
                              >
                                <span className="flex items-center gap-3">
                                  <Eye className="size-4 text-muted" />
                                  View Details
                                </span>
                                <ChevronRight className="size-4 text-muted" />
                              </button>

                              {isCommander && (
                                <>
                                  <div className="my-2 border-t border-line" />

                                  <button
                                    type="button"
                                    onClick={() => setMenuPage('delete')}
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm text-red-500 hover:bg-red-500/10"
                                  >
                                    <span className="flex items-center gap-3">
                                      <Trash2 className="size-4" />
                                      Delete Glitch
                                    </span>
                                    <ChevronRight className="size-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* STATUS SUBMENU */}
                          {menuPage === 'status' && canEditStatus && (
                            <div className="p-4">
                              <button
                                type="button"
                                onClick={() => setMenuPage('main')}
                                className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-fg"
                              >
                                <ArrowLeft className="size-4" />
                                Back to Actions
                              </button>

                              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
                                Change Status
                              </p>

                              <input
                                type="range"
                                min={0}
                                max={GLITCH_STATUSES.length - 1}
                                step={1}
                                value={selectedIndex}
                                onChange={(event) => {
                                  const status =
                                    GLITCH_STATUSES[
                                      Number(event.target.value)
                                    ]

                                  setSelectedStatuses((previous) => ({
                                    ...previous,
                                    [glitch.glitchId]: status,
                                  }))
                                }}
                                disabled={isUpdating}
                                aria-label="Select glitch status"
                                className="w-full cursor-pointer accent-blue-500 disabled:opacity-50"
                              />

                              <div className="mt-2 flex justify-between gap-1">
                                {GLITCH_STATUSES.map((status, index) => (
                                  <span
                                    key={status}
                                    className={`text-[9px] ${
                                      selectedIndex === index
                                        ? 'font-bold text-fg'
                                        : 'text-muted'
                                    }`}
                                  >
                                    {status}
                                  </span>
                                ))}
                              </div>

                              <div className="mt-5 flex items-center justify-between gap-2">
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[selectedStatus]}`}
                                >
                                  {selectedStatus}
                                </span>

                                <button
                                  type="button"
                                  disabled={
                                    isUpdating ||
                                    selectedStatus === glitch.status
                                  }
                                  onClick={() =>
                                    handleStatusChange(
                                      glitch.glitchId,
                                      selectedStatus,
                                    )
                                  }
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                                >
                                  {isUpdating ? (
                                    <span className="flex items-center gap-2">
                                      <Loader2 className="size-3 animate-spin" />
                                      Saving...
                                    </span>
                                  ) : (
                                    'Save status'
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* ASSIGN GUARDIAN SUBMENU */}
                          {menuPage === 'assign' && isCommander && (
                            <div className="p-4">
                              <button
                                type="button"
                                onClick={() => setMenuPage('main')}
                                disabled={isUpdating}
                                className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-fg"
                              >
                                <ArrowLeft className="size-4" />
                                Back to Actions
                              </button>

                              <div className="mb-4 flex items-center gap-2">
                                <UserPlus className="size-4 text-blue-500" />
                                <h3 className="text-sm font-semibold">
                                  Assign Guardian
                                </h3>
                              </div>

                              <p className="mb-3 text-xs text-muted">
                                Select one Defender for {glitch.glitchId}.
                              </p>

                              {loadingDefenders ? (
                                <div className="flex items-center gap-2 py-4 text-sm text-muted">
                                  <Loader2 className="size-4 animate-spin" />
                                  Loading Defenders...
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {defenders.map((defender) => {
                                    const isAssigned =
                                      glitch.assignedGuardianId ===
                                      defender.guardianId

                                    return (
                                      <button
                                        key={defender.guardianId}
                                        type="button"
                                        disabled={isUpdating || isAssigned}
                                        onClick={() =>
                                          handleAssignGlitch(
                                            glitch.glitchId,
                                            defender.guardianId,
                                          )
                                        }
                                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-sm transition-colors ${
                                          isAssigned
                                            ? 'border-blue-500/40 bg-blue-500/10 text-blue-500'
                                            : 'border-line transition-colors hover:bg-subtle hover:cursor-pointer'
                                        } disabled:cursor-not-allowed disabled:opacity-70`}
                                      >
                                        <span>{defender.codename}</span>

                                        {isAssigned ? (
                                          <span className="flex items-center gap-1 text-xs">
                                            <Check className="size-3" />
                                            Assigned
                                          </span>
                                        ) : isUpdating ? (
                                          <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                          <ChevronRight className="size-4 text-muted" />
                                        )}
                                      </button>
                                    )
                                  })}

                                  {defenders.length === 0 && (
                                    <p className="py-3 text-xs text-muted">
                                      No Defenders found.
                                    </p>
                                  )}

                                  {glitch.assignedGuardianId && (
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() =>
                                        handleAssignGlitch(
                                          glitch.glitchId,
                                          null,
                                        )
                                      }
                                      className="mt-3 w-full rounded-lg border border-red-500/20 px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                                    >
                                      Remove Assignment
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* DETAILS */}
                          {menuPage === 'details' && (
                            <div className="p-4">
                              <button
                                type="button"
                                onClick={() => setMenuPage('main')}
                                className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-fg"
                              >
                                <ArrowLeft className="size-4" />
                                Back to Actions
                              </button>

                              <div className="mb-3 flex items-center gap-2">
                                <Eye className="size-4 text-blue-500" />
                                <h3 className="text-sm font-semibold">
                                  Glitch Details
                                </h3>
                              </div>

                              <div className="space-y-3 text-sm">
                                <div>
                                  <p className="text-xs text-muted">Glitch ID</p>
                                  <p className="font-medium">
                                    {glitch.glitchId}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-muted">
                                    Description
                                  </p>
                                  <p>{glitch.description}</p>
                                </div>

                                <div>
                                  <p className="text-xs text-muted">Status</p>
                                  <span
                                    className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs ${statusStyles[glitch.status]}`}
                                  >
                                    {glitch.status}
                                  </span>
                                </div>

                                <div>
                                  <p className="text-xs text-muted">
                                    Assigned Guardian ID
                                  </p>
                                  <p className="break-all">
                                    {glitch.assignedGuardianId ?? 'Unassigned'}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-muted">
                                    Timestamp
                                  </p>
                                  <p>
                                    {timestampFormat.format(
                                      new Date(glitch.timestamp),
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* DELETE CONFIRMATION */}
                          {menuPage === 'delete' && isCommander && (
                            <div className="p-4">
                              <button
                                type="button"
                                onClick={() => setMenuPage('main')}
                                disabled={isUpdating}
                                className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-fg"
                              >
                                <ArrowLeft className="size-4" />
                                Back to Actions
                              </button>

                              <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-red-500/10">
                                <AlertTriangle className="size-5 text-red-500" />
                              </div>

                              <h3 className="text-sm font-semibold">
                                Delete Glitch?
                              </h3>

                              <p className="mt-2 text-xs leading-relaxed text-muted">
                                Are you sure you want to permanently delete{' '}
                                <span className="font-semibold text-fg">
                                  {glitch.glitchId}
                                </span>
                                ? All associated Echoes will also be deleted.
                                This action cannot be undone.
                              </p>

                              <div className="mt-5 flex gap-2">
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => setMenuPage('main')}
                                  className="flex-1 rounded-lg border border-line px-3 py-2 text-xs font-medium transition-colors hover:bg-subtle hover:cursor-pointer disabled:opacity-50"
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() =>
                                    handleDeleteGlitch(glitch.glitchId)
                                  }
                                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  {isUpdating ? (
                                    <>
                                      <Loader2 className="size-3 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="size-3" />
                                      Delete permanently
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {/* EMPTY STATE */}
            {filteredGlitches.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-surface">
                      <Search className="size-5 text-muted" />
                    </div>

                    <div>
                      <p className="font-medium text-fg">
                        No Glitches found
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Try changing your search or filters.
                      </p>
                    </div>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-2 text-sm font-medium text-blue-500 hover:text-blue-400"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
