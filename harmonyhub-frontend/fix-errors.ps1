# ========================================================
# 1. NoteRecognition — remove the setShowHint call
# ========================================================
$f = "src\components\games\NoteRecognition.tsx"
$c = Get-Content $f -Raw
$c = $c -replace '(?m)^\s*setShowHint\(false\);\s*\r?\n', ''
Set-Content $f $c -NoNewline
Write-Host "Fixed: NoteRecognition.tsx (removed setShowHint call)"

# ========================================================
# 2. PitchPerfectGame — remove setShowTargetTone calls,
#    restore liveAccuracy state
# ========================================================
$f = "src\components\games\PitchPerfectGame.tsx"
$c = Get-Content $f -Raw
$c = $c -replace '(?m)^\s*setShowTargetTone\(false\);\s*\r?\n', ''
$c = $c -replace '(?m)^\s*setShowTargetTone\(true\);\s*\r?\n', ''
# Insert liveAccuracy state back — right after the liveAccuracy references exist
# Place after the "const [round, setRound]" or similar line
if ($c -notmatch 'const \[liveAccuracy') {
    $c = $c -replace '(const \[round, setRound\] = useState\(1\);)', "`$1`n  const [liveAccuracy, setLiveAccuracy] = useState(0);"
}
Set-Content $f $c -NoNewline
Write-Host "Fixed: PitchPerfectGame.tsx (removed setShowTargetTone, restored liveAccuracy)"

# ========================================================
# 3. ScaleSinger — restore liveAccuracy state
# ========================================================
$f = "src\components\games\ScaleSinger.tsx"
$c = Get-Content $f -Raw
if ($c -notmatch 'const \[liveAccuracy') {
    $c = $c -replace '(const \[round, setRound\] = useState\(1\);)', "`$1`n  const [liveAccuracy, setLiveAccuracy] = useState(0);"
}
Set-Content $f $c -NoNewline
Write-Host "Fixed: ScaleSinger.tsx (restored liveAccuracy)"

# ========================================================
# 4. PracticePage — remove setPracticeStartTime call
# ========================================================
$f = "src\pages\PracticePage.tsx"
$c = Get-Content $f -Raw
$c = $c -replace '(?m)^\s*setPracticeStartTime\(Date\.now\(\)\);\s*\r?\n', ''
Set-Content $f $c -NoNewline
Write-Host "Fixed: PracticePage.tsx (removed setPracticeStartTime call)"

# ========================================================
# 5. SongsPage — remove page reference from query
# ========================================================
$f = "src\pages\SongsPage.tsx"
$c = Get-Content $f -Raw
$c = $c -replace 'queryKey: \["songs", page\]', 'queryKey: ["songs"]'
$c = $c -replace 'songService\.getSongs\(page\)', 'songService.getSongs()'
Set-Content $f $c -NoNewline
Write-Host "Fixed: SongsPage.tsx (removed page from query)"

Write-Host ""
Write-Host "All fixes applied. Now run: npx tsc --noEmit" -ForegroundColor Green