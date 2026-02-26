#!/bin/bash
# ══════════════════════════════════════════════════════════════════════
# deploy.sh — Build locale per test (Linux/Mac)
# Esegue build backend + frontend e combina tutto nella cartella publish
# ══════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend/RecinzioniPortal.API"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
PUBLISH_DIR="$BACKEND_DIR/publish"
WWWROOT_DIR="$PUBLISH_DIR/wwwroot"

SKIP_BACKEND=false
SKIP_FRONTEND=false

# ─── Parse argomenti ─────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-backend)  SKIP_BACKEND=true;  shift ;;
        --skip-frontend) SKIP_FRONTEND=true; shift ;;
        -h|--help)
            echo "Uso: $0 [--skip-backend] [--skip-frontend]"
            echo ""
            echo "Build locale del Portale Recinzioni."
            echo "Output: $PUBLISH_DIR"
            exit 0
            ;;
        *) echo "Argomento sconosciuto: $1"; exit 1 ;;
    esac
done

# ─── Funzioni helper ─────────────────────────────────────────────────
step() { echo -e "\n\033[36m═══ $1 ═══\033[0m"; }
ok()   { echo -e "  \033[32m✓ $1\033[0m"; }
warn() { echo -e "  \033[33m⚠ $1\033[0m"; }
fail() { echo -e "  \033[31m✗ $1\033[0m"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     Portale Recinzioni — Build Locale            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Progetto: $PROJECT_ROOT"
echo "Backend:  $(if $SKIP_BACKEND; then echo 'SKIP'; else echo 'BUILD'; fi)"
echo "Frontend: $(if $SKIP_FRONTEND; then echo 'SKIP'; else echo 'BUILD'; fi)"

# ─── Step 1: Build Backend ───────────────────────────────────────────
if ! $SKIP_BACKEND; then
    step "Step 1/3: Build backend (.NET)"
    [ -d "$BACKEND_DIR" ] || fail "Cartella backend non trovata: $BACKEND_DIR"
    cd "$BACKEND_DIR"
    dotnet publish -c Release -o "$PUBLISH_DIR"
    ok "Backend compilato in: $PUBLISH_DIR"
else
    step "Step 1/3: Build backend SKIP"
fi

# ─── Step 2: Build Frontend ─────────────────────────────────────────
if ! $SKIP_FRONTEND; then
    step "Step 2/3: Build frontend (Vite + PWA)"
    [ -d "$FRONTEND_DIR" ] || fail "Cartella frontend non trovata: $FRONTEND_DIR"
    cd "$FRONTEND_DIR"
    npm install
    npm run build
    ok "Frontend compilato"
else
    step "Step 2/3: Build frontend SKIP"
fi

# ─── Step 3: Copia frontend in wwwroot ───────────────────────────────
if ! $SKIP_FRONTEND; then
    step "Step 3/3: Copia frontend in wwwroot"
    DIST_DIR="$FRONTEND_DIR/dist"
    [ -d "$DIST_DIR" ] || fail "Cartella dist non trovata: $DIST_DIR"
    mkdir -p "$WWWROOT_DIR"
    cp -r "$DIST_DIR"/* "$WWWROOT_DIR/"
    ok "Frontend copiato in $WWWROOT_DIR"
else
    step "Step 3/3: Copia frontend SKIP"
fi

# ─── Report ──────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║             Build completato!                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Output: $PUBLISH_DIR"
echo ""
echo "Per avviare localmente:"
echo "  cd $PUBLISH_DIR"
echo "  ASPNETCORE_ENVIRONMENT=Development dotnet RecinzioniPortal.API.dll"
echo ""
echo "Poi aprire: http://localhost:5000"
echo ""
