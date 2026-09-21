# Selectively copies compressed videos over originals
# ONLY replaces files where compression actually reduced size by more than threshold
# Usage: powershell -ExecutionPolicy Bypass -File scripts\apply-compressed.ps1
# Add -DryRun to preview without changing anything

param(
    [double]$MinSavingsPct = 5.0,
    [switch]$DryRun
)

$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root "public"
$dst  = Join-Path $root "public-compressed"
$backup = Join-Path $root "public-originals-backup"

if (-not (Test-Path $dst)) {
    Write-Error "public-compressed/ folder not found. Run compress-videos.ps1 first."
    exit 1
}

Write-Host ""
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN (no changes)' } else { 'APPLY' })" -ForegroundColor Yellow
Write-Host "Threshold: replace files that saved more than $MinSavingsPct%" -ForegroundColor Yellow
Write-Host ""

$toReplace = @()
$toKeep = @()

Get-ChildItem $dst -Recurse -Include *.mp4,*.webm | ForEach-Object {
    $rel = $_.FullName.Substring($dst.Length + 1)
    $origFile = Join-Path $src $rel
    if (Test-Path $origFile) {
        $o = (Get-Item $origFile).Length
        $n = $_.Length
        $pct = (1 - $n / $o) * 100
        $entry = [PSCustomObject]@{
            File = $rel
            OrigKB = [math]::Round($o/1KB)
            NewKB = [math]::Round($n/1KB)
            SavedPct = [math]::Round($pct, 1)
            Src = $origFile
            Dst = $_.FullName
        }
        if ($pct -gt $MinSavingsPct) {
            $toReplace += $entry
        } else {
            $toKeep += $entry
        }
    }
}

Write-Host "WILL REPLACE ($($toReplace.Count) files):" -ForegroundColor Green
$toReplace | Sort-Object -Property SavedPct -Descending | Format-Table File, OrigKB, NewKB, SavedPct -AutoSize

Write-Host "WILL KEEP ORIGINAL ($($toKeep.Count) files):" -ForegroundColor Cyan
$toKeep | Sort-Object -Property SavedPct | Format-Table File, OrigKB, NewKB, SavedPct -AutoSize

$totalOrig = ($toReplace | Measure-Object -Property OrigKB -Sum).Sum
$totalNew  = ($toReplace | Measure-Object -Property NewKB  -Sum).Sum
$saved = $totalOrig - $totalNew
Write-Host ("Savings from replacements: {0:N0} KB -> {1:N0} KB (saved {2:N2} MB)" -f $totalOrig, $totalNew, ($saved/1024)) -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN - no changes made. Remove -DryRun to apply." -ForegroundColor Yellow
    exit 0
}

# Backup originals before replacing
Write-Host "Creating backup at: $backup" -ForegroundColor Yellow
if (-not (Test-Path $backup)) { New-Item -ItemType Directory -Path $backup -Force | Out-Null }

foreach ($item in $toReplace) {
    $backupPath = Join-Path $backup $item.File
    $backupDir = Split-Path -Parent $backupPath
    if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
    Copy-Item -Path $item.Src -Destination $backupPath -Force
    Copy-Item -Path $item.Dst -Destination $item.Src -Force
    Write-Host "  Replaced: $($item.File)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done. $($toReplace.Count) files replaced." -ForegroundColor Green
Write-Host "Originals backed up to: $backup" -ForegroundColor Cyan
Write-Host "If something looks wrong: copy files from backup back to public/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run 'npm run dev' and check the site visually"
Write-Host "  2. If OK: deploy with 'vercel --prod --yes --scope bala24'"
Write-Host "  3. Delete public-compressed/ and public-originals-backup/ once confident"
