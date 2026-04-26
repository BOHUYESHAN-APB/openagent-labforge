// @ts-nocheck
/** @jsxImportSource @opentui/solid */
import { createEffect, createMemo, createSignal, on, onCleanup } from "solid-js"
import type { TuiPluginApi } from "../types"
import { captureMagicContextSnapshot, type MagicContextSnapshot } from "../../features/magic-context/tui-snapshot"
import { loadPluginConfig } from "../../plugin-config"

const SINGLE_BORDER = { type: "single" } as any
const REFRESH_DEBOUNCE_MS = 150

// Token breakdown segment colors
const COLORS = {
  system: "#c084fc",       // Purple
  compartments: "#60a5fa", // Blue
  memories: "#34d399",     // Green
  conversation: "#9ca3af", // Gray
}

interface TokenSegment {
  key: string
  tokens: number
  color: string
  label: string
}

/**
 * Format tokens in compact form (e.g., "1.5M", "23K")
 */
function compactTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

/**
 * Token Breakdown Bar Component
 * Shows segmented bar with different colors for each token category
 */
const TokenBreakdown = (props: {
  theme: any
  snapshot: MagicContextSnapshot
}) => {
  const barWidth = 36

  const segments = createMemo<TokenSegment[]>(() => {
    const s = props.snapshot
    const result: TokenSegment[] = []

    // System Prompt (purple)
    if (s.systemPromptTokens > 0) {
      result.push({
        key: "sys",
        tokens: s.systemPromptTokens,
        color: COLORS.system,
        label: "System",
      })
    }

    // Compartments (blue)
    if (s.compartmentTokens > 0) {
      result.push({
        key: "comp",
        tokens: s.compartmentTokens,
        color: COLORS.compartments,
        label: "Compartments",
      })
    }

    // Memories (green)
    if (s.memoryTokens > 0) {
      result.push({
        key: "mem",
        tokens: s.memoryTokens,
        color: COLORS.memories,
        label: "Memories",
      })
    }

    // Conversation (gray)
    if (s.conversationTokens > 0) {
      result.push({
        key: "conv",
        tokens: s.conversationTokens,
        color: props.theme.textMuted,
        label: "Conversation",
      })
    }

    return result
  })

  const totalTokens = createMemo(() => props.snapshot.inputTokens || 1)

  // Calculate proportional widths for each segment
  const segmentWidths = createMemo(() => {
    const total = totalTokens()
    const segs = segments()
    if (segs.length === 0) return []

    // Calculate raw proportions
    const proportions = segs.map((seg) => seg.tokens / total)

    // Convert to character widths (minimum 1 char if tokens > 0)
    let widths = proportions.map((p) => Math.max(1, Math.round(p * barWidth)))

    // Adjust to exactly barWidth
    const sum = widths.reduce((a, b) => a + b, 0)
    if (sum > barWidth) {
      // Shrink from the largest segments
      let excess = sum - barWidth
      while (excess > 0) {
        const maxIdx = widths.indexOf(Math.max(...widths))
        if (widths[maxIdx] > 1) {
          widths[maxIdx]--
          excess--
        } else {
          break
        }
      }
    } else if (sum < barWidth) {
      // Expand the largest segments
      let deficit = barWidth - sum
      while (deficit > 0) {
        const maxIdx = widths.indexOf(Math.max(...widths))
        widths[maxIdx]++
        deficit--
      }
    }

    return widths
  })

  const barSegments = createMemo(() => {
    const segs = segments()
    const widths = segmentWidths()
    return segs.map((seg, i) => ({
      chars: "█".repeat(widths[i] || 0),
      color: seg.color,
    }))
  })

  return (
    <box width="100%" flexDirection="column">
      {/* Segmented bar */}
      <box flexDirection="row">
        {barSegments().map((seg, i) => (
          <text key={i} fg={seg.color}>{seg.chars}</text>
        ))}
      </box>

      {/* Legend rows */}
      <box flexDirection="column" marginTop={0}>
        {segments().map((seg) => {
          const pct = ((seg.tokens / totalTokens()) * 100).toFixed(0)
          return (
            <box
              key={seg.key}
              width="100%"
              flexDirection="row"
              justifyContent="space-between"
            >
              <text fg={seg.color}>{seg.label}</text>
              <text fg={props.theme.textMuted}>
                {compactTokens(seg.tokens)} ({pct}%)
              </text>
            </box>
          )
        })}
      </box>
    </box>
  )
}

/**
 * Stat Row Component
 * Shows a label-value pair
 */
const StatRow = (props: {
  theme: any
  label: string
  value: string
  accent?: boolean
  warning?: boolean
  dim?: boolean
}) => {
  const fg = createMemo(() => {
    if (props.warning) return props.theme.warning
    if (props.accent) return props.theme.accent
    if (props.dim) return props.theme.textMuted
    return props.theme.text
  })

  return (
    <box width="100%" flexDirection="row" justifyContent="space-between">
      <text fg={props.theme.textMuted}>{props.label}</text>
      <text fg={fg()}>
        <b>{props.value}</b>
      </text>
    </box>
  )
}

/**
 * Section Header Component
 */
const SectionHeader = (props: { theme: any; title: string }) => (
  <box width="100%" marginTop={1}>
    <text fg={props.theme.text}>
      <b>{props.title}</b>
    </text>
  </box>
)

/**
 * Magic Context Sidebar Content
 * Main component that displays Magic Context statistics
 */
const MagicContextSidebar = (props: {
  api: TuiPluginApi
  sessionID: () => string
  theme: any
}) => {
  const [snapshot, setSnapshot] = createSignal<MagicContextSnapshot | null>(null)
  let refreshTimer: ReturnType<typeof setTimeout> | undefined

  const refresh = () => {
    const sid = props.sessionID()
    if (!sid) return

    const directory = props.api.state.path.directory ?? ""
    const pluginConfig = loadPluginConfig(directory, undefined)

    // Capture snapshot
    const snap = captureMagicContextSnapshot(
      { directory } as any,
      pluginConfig,
      sid,
    )

    setSnapshot(snap)

    try {
      props.api.renderer.requestRender()
    } catch {
      // Ignore render errors
    }
  }

  const scheduleRefresh = () => {
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => {
      refreshTimer = undefined
      refresh()
    }, REFRESH_DEBOUNCE_MS)
  }

  onCleanup(() => {
    if (refreshTimer) clearTimeout(refreshTimer)
  })

  // Refresh on session change
  createEffect(
    on(props.sessionID, () => {
      refresh()
    }),
  )

  // Subscribe to events for live updates
  createEffect(
    on(
      props.sessionID,
      (sessionID) => {
        const unsubs = [
          props.api.event.on("message.updated", (event: any) => {
            if (event.properties.info.sessionID !== sessionID) return
            scheduleRefresh()
          }),
          props.api.event.on("session.updated", (event: any) => {
            if (event.properties.info.id !== sessionID) return
            scheduleRefresh()
          }),
          props.api.event.on("message.removed", (event: any) => {
            if (event.properties.sessionID !== sessionID) return
            scheduleRefresh()
          }),
        ]

        onCleanup(() => {
          for (const unsub of unsubs) unsub()
        })
      },
      { defer: false },
    ),
  )

  const s = createMemo(() => snapshot())

  // Don't render if Magic Context is not enabled or no snapshot
  if (!s()) {
    return null
  }

  return (
    <box
      width="100%"
      flexDirection="column"
      border={SINGLE_BORDER}
      borderColor={props.theme.borderActive}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={1}
      paddingRight={1}
    >
      {/* Header */}
      <box flexDirection="row" justifyContent="space-between" alignItems="center">
        <box paddingLeft={1} paddingRight={1} backgroundColor={props.theme.accent}>
          <text fg={props.theme.background}>
            <b>Magic Context</b>
          </text>
        </box>
        <text fg={props.theme.textMuted}>{s()!.usagePercentage.toFixed(0)}%</text>
      </box>

      {/* Token breakdown bar */}
      {s() && s()!.inputTokens > 0 && (
        <box marginTop={1}>
          <TokenBreakdown theme={props.theme} snapshot={s()!} />
        </box>
      )}

      {/* Cache section */}
      <SectionHeader theme={props.theme} title="Cache" />
      <StatRow
        theme={props.theme}
        label="TTL"
        value={s()!.cacheTtl}
      />
      <StatRow
        theme={props.theme}
        label="Remaining"
        value={s()!.cacheTtlRemaining}
        dim
      />

      {/* Tags section */}
      <SectionHeader theme={props.theme} title="Tags" />
      <StatRow
        theme={props.theme}
        label="Active"
        value={String(s()!.activeTagCount)}
        accent
      />
      <StatRow
        theme={props.theme}
        label="Compacted"
        value={String(s()!.compactedTagCount)}
        dim
      />

      {/* Storage section */}
      <SectionHeader theme={props.theme} title="Storage" />
      <StatRow
        theme={props.theme}
        label="Compartments"
        value={String(s()!.compartmentCount)}
      />
      <StatRow
        theme={props.theme}
        label="Memories"
        value={String(s()!.memoryCount)}
        accent
      />

      {/* Queue & Status */}
      {s()!.pendingOpsCount > 0 && (
        <>
          <SectionHeader theme={props.theme} title="Status" />
          <StatRow
            theme={props.theme}
            label="Queue"
            value={`${s()!.pendingOpsCount} pending`}
            warning
          />
        </>
      )}

      {/* Compression stats */}
      {s()!.compressionCount > 0 && (
        <>
          <SectionHeader theme={props.theme} title="Compression" />
          <StatRow
            theme={props.theme}
            label="Count"
            value={String(s()!.compressionCount)}
            dim
          />
        </>
      )}
    </box>
  )
}

export function createMagicContextSidebarSlot(api: TuiPluginApi) {
  return {
    order: 150,
    slots: {
      sidebar_content: (ctx: any, value: any) => {
        const theme = createMemo(() => ctx.theme.current)
        const sessionID = () => value.session_id
        return (
          <MagicContextSidebar
            api={api}
            sessionID={sessionID}
            theme={theme()}
          />
        )
      },
    },
  }
}

export default MagicContextSidebar
