# Cleanup duplicate MCP server processes
# Run this when you encounter "semantic_scholar_fastmcp failed to open" errors

Write-Host "Cleaning up MCP server processes..." -ForegroundColor Yellow

# Kill semantic-scholar-fastmcp processes
$semanticProcesses = Get-Process -Name "semantic-scholar-fastmcp" -ErrorAction SilentlyContinue
if ($semanticProcesses) {
    $semanticProcesses | ForEach-Object {
        Write-Host "Killing semantic-scholar-fastmcp (PID: $($_.Id))" -ForegroundColor Cyan
        Stop-Process -Id $_.Id -Force
    }
} else {
    Write-Host "No semantic-scholar-fastmcp processes found" -ForegroundColor Green
}

# Kill uvx processes (used by paper-search-mcp and semantic-scholar-fastmcp)
$uvxProcesses = Get-Process -Name "uvx" -ErrorAction SilentlyContinue
if ($uvxProcesses) {
    $uvxProcesses | ForEach-Object {
        Write-Host "Killing uvx (PID: $($_.Id))" -ForegroundColor Cyan
        Stop-Process -Id $_.Id -Force
    }
} else {
    Write-Host "No uvx processes found" -ForegroundColor Green
}

# Kill npx processes (used by other MCP servers)
$npxProcesses = Get-Process -Name "npx" -ErrorAction SilentlyContinue
if ($npxProcesses) {
    $npxProcesses | ForEach-Object {
        Write-Host "Killing npx (PID: $($_.Id))" -ForegroundColor Cyan
        Stop-Process -Id $_.Id -Force
    }
} else {
    Write-Host "No npx processes found" -ForegroundColor Green
}

Write-Host "`nCleanup complete! You can now restart OpenCode." -ForegroundColor Green
Write-Host "Tip: Try to keep only one OpenCode window open to avoid this issue." -ForegroundColor Yellow
