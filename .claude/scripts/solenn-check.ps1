# solenn-check.ps1 - PostToolUse hook : detecte les bugs Solenn dans les fichiers modifies

$raw = [Console]::In.ReadToEnd()
if (-not $raw.Trim()) { exit 0 }

try { $json = $raw | ConvertFrom-Json } catch { exit 0 }

$filePath = $json.tool_input.file_path
if (-not $filePath) { exit 0 }

# Limite aux fichiers src/*.jsx|js|tsx du projet Solenn
if ($filePath -notmatch 'coach-AI[/\\]src[/\\].*\.(jsx|js|tsx)$') { exit 0 }

$content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
if (-not $content) { exit 0 }

$issues = [System.Collections.Generic.List[string]]::new()

# 1. backdropFilter sans WebkitBackdropFilter -> invisible Safari iOS
if ($content -match 'backdropFilter' -and $content -notmatch 'WebkitBackdropFilter') {
    $issues.Add("[Safari] backdropFilter sans WebkitBackdropFilter -> invisible sur iOS")
}

# 2. position:fixed sans env(safe-area) = risque header overlap
if ($content -match "position\s*:\s*[`"']?fixed" -and $content -notmatch 'env\(safe-area') {
    $issues.Add("[iOS] position:fixed sans env(safe-area-inset-*) -> verifier paddingTop du contenu adjacent")
}

# 3. paddingTop en px fixe dans un fichier qui a aussi position:fixed
if (($content -match "position\s*:\s*[`"']?fixed") -and ($content -match "paddingTop\s*:\s*[`"']?\d+px")) {
    $issues.Add("[iOS CRITIQUE] paddingTop px fixe + position:fixed -> safe-area overlap sur iPhone. Utiliser calc(env(safe-area-inset-top, 0px) + Xpx)")
}

# 4. window.confirm / alert / prompt -> bloquant sur iOS
if ($content -match 'window\.(confirm|alert|prompt)\s*\(') {
    $issues.Add("[iOS] window.confirm/alert/prompt -> bloquant sur iOS, remplacer par dialog React")
}

# 5. Couleurs interdites (fond clair sur dark glassmorphism)
if ($content -match '#FFF8F4|#0A1633|rgba\(10,\s*22,\s*51|rgba\(26,\s*10,\s*0') {
    $issues.Add("[Design] Couleur interdite (texte/fond clair sur dark glassmorphism)")
}

if ($issues.Count -gt 0) {
    $fileName = Split-Path $filePath -Leaf
    $count = $issues.Count
    $issueList = $issues -join "`n"
    $msg = "SOLENN-CHECK [$fileName] - $count probleme(s) detecte(s):`n$issueList"
    @{
        hookSpecificOutput = @{
            hookEventName    = "PostToolUse"
            additionalContext = $msg
        }
    } | ConvertTo-Json -Compress
}
