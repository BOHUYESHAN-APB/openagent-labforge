#!/usr/bin/env pwsh
# sync-upstream.ps1 - Check upstream OpenCode for changes that affect our plugin
#
# Usage: ./scripts/sync-upstream.ps1
#
# This script checks the upstream OpenCode plugin API and compaction logic
# for changes that might affect our plugin.

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

$upstreamDir = "Future/opencode-dev"
$pluginApiFile = "$upstreamDir/packages/plugin/src/index.ts"
$compactionFile = "$upstreamDir/packages/opencode/src/session/compaction.ts"

# Files to track
$trackedFiles = @(
    $pluginApiFile,
    $compactionFile
)

Write-Host "=== Upstream Sync Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if upstream exists
if (-not (Test-Path $upstreamDir)) {
    Write-Host "ERROR: Upstream directory not found: $upstreamDir" -ForegroundColor Red
    Write-Host "Run: git clone https://github.com/anomalyco/opencode.git $upstreamDir"
    exit 1
}

# Fetch latest
Write-Host "Fetching latest upstream..." -ForegroundColor Yellow
git -C $upstreamDir fetch --all 2>$null

# Check for changes
Write-Host ""
Write-Host "=== Checking Hook Signatures ===" -ForegroundColor Cyan

# Extract hook signatures from plugin API
$apiContent = Get-Content $pluginApiFile -Raw
$hooks = @(
    "experimental.session.compacting",
    "chat.message",
    "experimental.chat.messages.transform",
    "command.execute.before"
)

foreach ($hook in $hooks) {
    if ($apiContent -match [regex]::Escape($hook)) {
        Write-Host "  ✓ $hook - Found in API" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $hook - NOT FOUND!" -ForegroundColor Red
    }
}

# Check compaction logic
Write-Host ""
Write-Host "=== Checking Compaction Logic ===" -ForegroundColor Cyan

$compactionContent = Get-Content $compactionFile -Raw

# Check for key patterns we depend on
$patterns = @(
    @{ Pattern = "experimental.session.compacting"; Desc = "Compacting hook trigger" },
    @{ Pattern = "buildPrompt"; Desc = "Default prompt builder" },
    @{ Pattern = "previousSummary"; Desc = "Incremental compaction support" },
    @{ Pattern = "SUMMARY_TEMPLATE"; Desc = "Summary template" }
)

foreach ($p in $patterns) {
    if ($compactionContent -match $p.Pattern) {
        Write-Host "  ✓ $($p.Desc)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($p.Desc) - NOT FOUND!" -ForegroundColor Red
    }
}

# Check our dependencies
Write-Host ""
Write-Host "=== Our Plugin Dependencies ===" -ForegroundColor Cyan

$ourFiles = @(
    "src/hooks/compaction/index.ts",
    "src/hooks/compaction/prompt.ts",
    "src/checkpoint/manager.ts",
    "src/checkpoint/persistence.ts"
)

foreach ($file in $ourFiles) {
    if (Test-Path $file) {
        $lines = (Get-Content $file | Measure-Object -Line).Lines
        Write-Host "  ✓ $file ($lines lines)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file - NOT FOUND!" -ForegroundColor Red
    }
}

# Summary
Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Our plugin uses stable plugin hooks (API layer), not internal APIs."
Write-Host "Checkpoint system is independent of upstream."
Write-Host "Compaction prompt is injected via hook, not by modifying upstream code."
Write-Host ""
Write-Host "To sync upstream:" -ForegroundColor Yellow
Write-Host "  1. git -C $upstreamDir pull origin main"
Write-Host "  2. Run this script again to check for changes"
Write-Host "  3. If hooks changed, update src/hooks/compaction/index.ts"
Write-Host "  4. If compaction logic changed, review src/hooks/compaction/prompt.ts"
