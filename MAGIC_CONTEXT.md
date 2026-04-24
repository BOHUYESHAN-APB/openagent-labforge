# Magic Context - Cache-Aware Context Management

OpenAgent LabForge includes advanced context management inspired by [Magic Context](https://github.com/cortexkit/opencode-magic-context) (MIT licensed).

## Overview

Magic Context solves the problem of unnecessary compression that breaks Anthropic's prompt cache. Traditional compression triggers immediately when thresholds are reached, wasting cached prefixes. Magic Context defers operations until the cache expires, maximizing cache efficiency.

## Key Features

### 1. Cache-Aware TTL Mechanism
- Respects Anthropic's prompt cache TTL (default 5 minutes)
- Defers compression until cache expires
- Configurable TTL: `5m`, `10m`, `1h`, `30s`
- Automatic execution when threshold exceeded

### 2. Tag System (§N§)
- Precise message references with monotonic tags
- Format: `§1§`, `§2§`, `§3§`, etc.
- Enables selective context reduction
- Protected tags (last 20) prevent accidental deletion

### 3. Agent Tools
- **ctx_reduce**: Mark tags for removal to reduce context size
- **ctx_expand**: Retrieve raw message history
- **ctx_memory**: Manage cross-session project memories
- **ctx_search**: Inspect Magic Context state

### 4. Background Compression
- Async Historian agent compresses without blocking
- Compartments store compressed history blocks
- Fallback to sync compression when disabled

### 5. Cross-Session Memories
- Project-scoped persistent knowledge
- 8 predefined categories (ARCHITECTURE_DECISIONS, PATTERNS, etc.)
- Automatic deduplication via normalized hashing
- Text-based search with filters

### 6. TUI Visualization
- Real-time context usage monitoring
- Token breakdown (system, memory, history, archive)
- Cache TTL countdown
- Visual progress bars with color coding

## Configuration

Enable Magic Context in your config:

```json
{
  "experimental": {
    "magic_context": {
      "enabled": true,
      "cache_ttl": "5m",
      "execute_threshold_percentage": 65,
      "async_compression": true,
      "tag_system_enabled": true,
      "cross_session_memories": true,
      "tui_sidebar": true
    }
  }
}
```

### Configuration Options

- **enabled** (boolean, default: false): Master switch for Magic Context
- **cache_ttl** (string, default: "5m"): Cache TTL for deferring operations
  - Supports: "30s", "1m", "5m", "10m", "1h"
- **execute_threshold_percentage** (number, default: 65): Trigger compression when usage exceeds this percentage
- **async_compression** (boolean, default: true): Enable background compression via Historian agent
- **tag_system_enabled** (boolean, default: true): Enable §N§ tags for message references
- **cross_session_memories** (boolean, default: true): Enable persistent project memories
- **tui_sidebar** (boolean, default: true): Enable TUI sidebar visualization

## Usage

### Using ctx_reduce

Mark tags for removal to reduce context size:

```
Use ctx_reduce to drop tags §5§-§15§
```

The tool will:
- Parse the tag range
- Protect the last 20 tags (queue for later removal)
- Immediately drop unprotected tags

### Using ctx_expand

List all active tags with metadata:

```
Use ctx_expand to see all active tags
```

Shows:
- Tag numbers with §N§ format
- Message types (message, tool, file)
- Byte sizes
- Creation timestamps

### Using ctx_memory

Manage cross-session memories:

```
# Write a memory
Use ctx_memory to write: "We use JSON storage instead of SQLite for simplicity" (category: ARCHITECTURE_DECISIONS)

# List memories
Use ctx_memory to list all memories

# Search memories
Use ctx_memory to search for "JSON"

# Update a memory
Use ctx_memory to update memory #1 with new content

# Delete a memory
Use ctx_memory to delete memory #1
```

Memory categories:
- ARCHITECTURE_DECISIONS
- CONSTRAINTS
- PATTERNS
- BUGS_FIXED
- TECHNICAL_DEBT
- USER_PREFERENCES
- PROJECT_CONTEXT
- OTHER

### Using ctx_search

Inspect Magic Context state:

```
Use ctx_search to see current status
```

Shows:
- Session metadata (TTL, compressions)
- Tag counts (active, dropped, compacted)
- Pending operations queue
- Storage usage

### TUI Commands

- **/ctx-status**: Show detailed Magic Context status with debug info
- **/ctx-flush**: Force execute all pending operations
- **/ctx-clear**: Clear session state (warning: destructive)

## How It Works

### TTL-Aware Scheduling

1. **Threshold Check**: When context usage exceeds threshold (default 65%)
2. **TTL Check**: Is cache TTL expired?
   - If **expired**: Execute compression immediately
   - If **not expired**: Queue operation, defer until TTL expires
3. **Execution**: Compression runs when TTL expires or threshold is critical

### Tag System

Messages are tagged with monotonic numbers:

```
§1§ User: Can you help me implement a feature?
§2§ Assistant: Sure! Let me read the code first.
§3§ Tool: [read file output]
§4§ Assistant: I see the structure. Here's my plan...
```

Tags enable precise context reduction:
- `ctx_reduce drop: "1-3"` removes messages §1§-§3§
- Last 20 tags are protected (queued for later removal)

### Background Compression

When async compression is enabled:

1. Historian agent launches in background
2. Compresses specified tag range
3. Stores result as compartment
4. Marks tags as "compacted"
5. Main agent continues without blocking

### Cross-Session Memories

Memories persist across sessions:

1. Write memory with category and content
2. Automatic deduplication via normalized hash
3. Search and retrieve in future sessions
4. Track usage statistics (seenCount, retrievalCount)

## Storage

Magic Context uses JSON files in `.opencode/openagent-labforge/magic-context/`:

- **tags.json**: Tag registry with message references
- **pending-ops.json**: Queued operations awaiting cache expiry
- **session-meta/{session-id}.json**: Per-session TTL and state
- **compartments/{session-id}.json**: Compressed history blocks
- **memories/{project-hash}.json**: Cross-session memories per project

## Performance

- **File I/O**: Atomic writes with temp + rename pattern
- **Deduplication**: SHA-256 hashing for memory deduplication
- **Search**: Simple text search (case-insensitive substring matching)
- **Caching**: In-memory caching for frequently accessed data

## Troubleshooting

### Magic Context not working

1. Check config: `experimental.magic_context.enabled = true`
2. Verify TTL format: Use "5m", "10m", "1h", "30s"
3. Check logs: Look for `[magic-context]` entries

### Tags not appearing

1. Verify `tag_system_enabled = true`
2. Check if messages are being tagged (look for §N§ prefix)
3. Use `/ctx-status` to see tag counts

### Compression not deferring

1. Check `cache_ttl` setting
2. Verify threshold: `execute_threshold_percentage`
3. Use `/ctx-status` to see pending operations

### Memories not persisting

1. Verify `cross_session_memories = true`
2. Check storage directory exists: `.opencode/openagent-labforge/magic-context/memories/`
3. Use `ctx_memory list` to verify memories are stored

## Credits

Magic Context implementation inspired by [opencode-magic-context](https://github.com/cortexkit/opencode-magic-context) by cortexkit (MIT License).

## License

OpenAgent LabForge is licensed under SUL-1.0. Magic Context features are original implementations inspired by the MIT-licensed opencode-magic-context project.
