param(
    [string]$DbPath = "backend\plxyground.db",
    [string]$BackupDir = "backend\backups"
)

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$timestamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
Copy-Item -Path $DbPath -Destination "$BackupDir\plxyground-$timestamp.db" -Force
Write-Host "Backup created in $BackupDir"