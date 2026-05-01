$postgresBin = "C:\Program Files\PostgreSQL\16\bin"
$dataDir = "C:\plxyground\.postgres-local\data"

& "$postgresBin\pg_ctl.exe" stop -D $dataDir
