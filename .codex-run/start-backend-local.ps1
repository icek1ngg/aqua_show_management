$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Get-Content -LiteralPath 'C:\Users\Admin\OneDrive\Documents\SWD392\.env' | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
    $name, $value = $line -split '=', 2
    $name = $name.Trim()
    $value = $value.Trim().Trim('"').Trim("'")
    if ($name) {
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
}

$env:FRONTEND_BASE_URL = 'https://09bd-42-118-50-96.ngrok-free.app'
$env:BACKEND_BASE_URL = 'https://operative-agent-relay.ngrok-free.dev'
$env:GOOGLE_REDIRECT_URI = 'https://operative-agent-relay.ngrok-free.dev/login/oauth2/code/google'

Set-Location 'C:\Users\Admin\OneDrive\Documents\SWD392\backend'
mvn spring-boot:run
