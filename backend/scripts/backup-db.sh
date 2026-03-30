#!/usr/bin/env bash
set -euo pipefail
DB_PATH=${1:-"backend/plxyground.db"}
BACKUP_DIR=${2:-"backend/backups"}
mkdir -p "$BACKUP_DIR"
cp "$DB_PATH" "$BACKUP_DIR/plxyground-$(date +%Y%m%d-%H%M%S).db"
echo "Backup created at $BACKUP_DIR"