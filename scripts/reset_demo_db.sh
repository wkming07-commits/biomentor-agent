#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"

DB_PATH="$BACKEND_DIR/biomentor.db"
DB_WAL_PATH="$BACKEND_DIR/biomentor.db-wal"
DB_SHM_PATH="$BACKEND_DIR/biomentor.db-shm"

echo "=== BioMentor Agent Demo DB Reset ==="
echo ""

PORT=9090
PID=$(lsof -ti tcp:$PORT 2>/dev/null || true)
if [ -n "$PID" ]; then
    echo "[info] Found process on port $PORT (PID: $PID)"
    read -r -p "Kill the process on port $PORT? [y/N] " CONFIRM
    if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        kill "$PID" 2>/dev/null || true
        sleep 1
        echo "[info] Process on port $PORT killed"
    else
        echo "[info] Skipped killing process on port $PORT"
    fi
else
    echo "[info] No process found on port $PORT"
fi

echo ""
echo "[info] Cleaning up old database files..."

REMOVED_ANY=false

if [ -f "$DB_PATH" ]; then
    rm -f "$DB_PATH"
    echo "  - Removed $DB_PATH"
    REMOVED_ANY=true
else
    echo "  - $DB_PATH (not found, skip)"
fi

if [ -f "$DB_WAL_PATH" ]; then
    rm -f "$DB_WAL_PATH"
    echo "  - Removed $DB_WAL_PATH"
    REMOVED_ANY=true
else
    echo "  - $DB_WAL_PATH (not found, skip)"
fi

if [ -f "$DB_SHM_PATH" ]; then
    rm -f "$DB_SHM_PATH"
    echo "  - Removed $DB_SHM_PATH"
    REMOVED_ANY=true
else
    echo "  - $DB_SHM_PATH (not found, skip)"
fi

if [ "$REMOVED_ANY" = false ]; then
    echo "  No database files found to remove"
fi

echo ""
echo "=== Recommended Startup ==="
echo ""
echo "To avoid disk I/O errors with the default database, use a /tmp-based"
echo "SQLite database:"
echo ""
echo "  export DATABASE_URL=sqlite:////tmp/biomentor_demo_23cases.db"
echo "  cd $BACKEND_DIR"
echo "  python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT"
echo ""
echo "This will seed 23 industry cases on startup (see [seed] log output)."
echo ""
echo ".env.local and seed_data files are NOT affected by this script."
echo ""
echo "=== Done ==="