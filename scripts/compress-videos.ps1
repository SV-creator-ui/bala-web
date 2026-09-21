# Video compression script - reduces Vercel bandwidth usage
# Usage: powershell -ExecutionPolicy Bypass -File scripts\compress-videos.ps1
#
# Output goes to public-compressed/ (originals stay untouched).
# Review the files, then replace public/ contents if OK.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root "public"
$dst  = Join-Path $root "public-compressed"

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Error "ffmpeg not found in PATH"
    exit 1
}

# Compression profiles
# CRF: lower = better quality, larger file. 23=visually lossless, 28=web loop, 32=aggressive
# preset: slow = better compression, medium = compromise
$profiles = @{
    # Large hero/game videos with excessive bitrate - CRF 28, scale to 1080p max
    "big" = @{ crf = 28; preset = "slow"; scale = "1920:-2"; audio = "aac"; bitrate = "96k" }

    # Loops (autoplay muted, short) - CRF 30, no audio
    "loop" = @{ crf = 30; preset = "slow"; scale = "-2:-2"; audio = "none"; bitrate = "" }

    # Hero autoplay - CRF 28, keep audio (user can unmute via sound button)
    "hero" = @{ crf = 28; preset = "slow"; scale = "-2:-2"; audio = "aac"; bitrate = "96k" }

    # Game cards portrait - CRF 30, no audio
    "card" = @{ crf = 30; preset = "slow"; scale = "-2:-2"; audio = "none"; bitrate = "" }
}

# File-to-profile mapping
$fileMap = [ordered]@{
    "games\g-veiksmas-4.mp4"                  = "big"    # 15MB 1080p 23Mbps -> ~1-2 MB
    "games\g-veiksmas-3.mp4"                  = "big"    # 7MB 720p 14Mbps -> ~700 KB
    "games\g-cops-robbers.mp4"                = "card"
    "games\g-video.mp4"                       = "card"
    "games\g-party-ship.mp4"                  = "card"
    "games\g-cookdup.mp4"                     = "card"
    "games\g-nuotykis-5.mp4"                  = "card"
    "hero-video.mp4"                          = "hero"   # 4.7MB portrait 27s
    "hero-vr.mp4"                             = "hero"
    "assets\vr-cave-trailer.mp4"              = "big"    # 3.5MB, keep audio
    "assets\hero-bala-vr.mp4"                 = "hero"
    "assets\loops\pirates-plague.mp4"         = "loop"
    "assets\loops\pirates-plague.webm"        = "loop"
    "assets\loops\dragon-tower.mp4"           = "loop"
    "assets\loops\dragon-tower.webm"          = "loop"
    "assets\loops\runaway-train.mp4"          = "loop"
    "assets\loops\runaway-train.webm"         = "loop"
    "assets\loops\manor-of-escape.mp4"        = "loop"
    "assets\loops\manor-of-escape.webm"       = "loop"
    "assets\loops\depths-of-osiris.mp4"       = "loop"
    "assets\loops\depths-of-osiris.webm"      = "loop"
    "assets\loops\space-station-tiberia.mp4"  = "loop"
    "assets\loops\space-station-tiberia.webm" = "loop"
}

# vr-cave-trailer keeps audio (it's a trailer)
$audioOverride = @{
    "assets\vr-cave-trailer.mp4" = "aac"
}

function Compress-Video {
    param(
        [string]$srcFile,
        [string]$dstFile,
        [hashtable]$profile,
        [string]$audioOverride = $null
    )

    $dstDir = Split-Path -Parent $dstFile
    if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }

    $isWebm = $dstFile -like "*.webm"
    $vcodec = if ($isWebm) { "libvpx-vp9" } else { "libx264" }

    $ffargs = @("-y", "-i", $srcFile)

    # Video codec params
    $ffargs += @("-c:v", $vcodec, "-crf", $profile.crf, "-preset", $profile.preset)

    if ($isWebm) {
        # VP9 requires -b:v 0 with CRF
        $ffargs += @("-b:v", "0")
    } else {
        $ffargs += @("-pix_fmt", "yuv420p", "-movflags", "+faststart")
    }

    # Scale filter (only if not "-2:-2")
    if ($profile.scale -ne "-2:-2") {
        # Only shrink if source is larger
        $maxW = $profile.scale.Split(':')[0]
        $ffargs += @("-vf", "scale='min($maxW,iw)':-2")
    }

    # Audio
    $audio = if ($audioOverride) { $audioOverride } else { $profile.audio }
    if ($audio -eq "none") {
        $ffargs += @("-an")
    } else {
        $ffargs += @("-c:a", $audio)
        if ($profile.bitrate) { $ffargs += @("-b:a", $profile.bitrate) }
    }

    $ffargs += $dstFile

    $logFile = Join-Path $env:TEMP ("ffmpeg-" + [guid]::NewGuid().ToString() + ".log")
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & ffmpeg @ffargs 2> $logFile
    $exit = $LASTEXITCODE
    $ErrorActionPreference = $prevPref
    if ($exit -ne 0) {
        Write-Host "  ffmpeg failed (exit $exit). Log: $logFile" -ForegroundColor Red
        Get-Content $logFile -Tail 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkRed }
    } else {
        Remove-Item $logFile -ErrorAction SilentlyContinue
    }
}

$totalOrig = 0
$totalNew  = 0
$results = @()

foreach ($rel in $fileMap.Keys) {
    $srcFile = Join-Path $src $rel
    $dstFile = Join-Path $dst $rel

    if (-not (Test-Path $srcFile)) {
        Write-Host "SKIPPED (not found): $rel" -ForegroundColor Yellow
        continue
    }

    $profileName = $fileMap[$rel]
    $profile = $profiles[$profileName]
    $override = $audioOverride[$rel]

    Write-Host ""
    Write-Host "[$profileName] $rel" -ForegroundColor Cyan

    $origSize = (Get-Item $srcFile).Length

    Compress-Video -srcFile $srcFile -dstFile $dstFile -profile $profile -audioOverride $override

    if (Test-Path $dstFile) {
        $newSize = (Get-Item $dstFile).Length
        $saved = [math]::Round(($origSize - $newSize) / 1MB, 2)
        $pct = [math]::Round((1 - $newSize / $origSize) * 100, 1)
        Write-Host ("  {0:N2} MB -> {1:N2} MB (saved {2} MB, {3}%)" -f ($origSize/1MB), ($newSize/1MB), $saved, $pct) -ForegroundColor Green

        $totalOrig += $origSize
        $totalNew  += $newSize
        $results += [PSCustomObject]@{
            File     = $rel
            OrigMB   = [math]::Round($origSize/1MB, 2)
            NewMB    = [math]::Round($newSize/1MB, 2)
            SavedPct = $pct
        }
    } else {
        Write-Host "  FAILED - output file not created" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Yellow
$results | Sort-Object -Property SavedPct -Descending | Format-Table -AutoSize
Write-Host ("Total: {0:N2} MB -> {1:N2} MB (saved {2:N2} MB)" -f ($totalOrig/1MB), ($totalNew/1MB), (($totalOrig-$totalNew)/1MB)) -ForegroundColor Green
Write-Host ""
Write-Host "Output: $dst" -ForegroundColor Cyan
Write-Host "Review the compressed files (quality) before replacing originals." -ForegroundColor Cyan
