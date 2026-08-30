$envPath = "C:\Projects\edumath-main\backend\.env"
$keys = @('AI_PROVIDER','GEMINI_API_KEY','GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN','GOOGLE_DRIVE_OAUTH_CLIENT_ID','GOOGLE_DRIVE_OAUTH_CLIENT_SECRET')
$vars = @{}
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line -match '^\s*([^=]+?)\s*=\s*(.*)$') {
      $k = $matches[1].Trim()
      $v = $matches[2].Trim().Trim('"').Trim("'")
      $vars[$k] = $v
    }
  }
}
foreach ($k in $keys) {
  $has = ($vars.ContainsKey($k) -and -not [string]::IsNullOrWhiteSpace($vars[$k]))
  Write-Output "$k`: $(if ($has) { 'yes' } else { 'no' })"
}
if ($vars.ContainsKey('AI_PROVIDER') -and -not [string]::IsNullOrWhiteSpace($vars['AI_PROVIDER'])) {
  Write-Output "AI_PROVIDER value: $($vars['AI_PROVIDER'])"
}
Write-Output "drive-oauth-token.json: $(if (Test-Path 'C:\Projects\Banking\backend\drive-oauth-token.json') { 'yes' } else { 'no' })"
Write-Output "drive-oauth-client.json: $(if (Test-Path 'C:\Projects\Banking\backend\drive-oauth-client.json') { 'yes' } else { 'no' })"
$conn = Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue
Write-Output "port 8765 listening: $(if ($conn) { 'yes' } else { 'no' })"
