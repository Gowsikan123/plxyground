$postgresBin = "C:\Program Files\PostgreSQL\16\bin"
$dataDir = "C:\plxyground\.postgres-local\data"
$logFile = "C:\plxyground\.postgres-local\server.log"

& "$postgresBin\pg_ctl.exe" start -D $dataDir -l $logFile -o "-p 5434"
