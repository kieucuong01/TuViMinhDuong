$ErrorActionPreference = "Stop"

$taskName = "LaSoTinhHoa_SEO_Autopilot"
$scriptPath = Resolve-Path (Join-Path $PSScriptRoot "run-seo-autopilot.ps1")
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 8:00am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Runs LaSoTinhHoa SEO Autopilot weekly planning heartbeat." -Force

Write-Host "Installed scheduled task: $taskName"
