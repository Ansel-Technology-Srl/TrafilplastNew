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

# ─── Step 1: Pulizia cartella publish ─────────────────────────────────
step "Step 1/4: Pulizia cartella publish"
if [ -d "$PUBLISH_DIR" ]; then
    # Salva euritmo (archivio EDI) se esiste
    EURITMO_BAK=""
    if [ -d "$WWWROOT_DIR/euritmo" ]; then
        EURITMO_BAK="$(mktemp -d)"
        cp -r "$WWWROOT_DIR/euritmo" "$EURITMO_BAK/"
        ok "Backup euritmo in $EURITMO_BAK"
    fi
    rm -rf "$PUBLISH_DIR"
    ok "Cartella publish rimossa"
    # Ripristina euritmo
    if [ -n "$EURITMO_BAK" ] && [ -d "$EURITMO_BAK/euritmo" ]; then
        mkdir -p "$WWWROOT_DIR"
        cp -r "$EURITMO_BAK/euritmo" "$WWWROOT_DIR/"
        rm -rf "$EURITMO_BAK"
        ok "Cartella euritmo ripristinata"
    fi
else
    ok "Nessuna cartella publish precedente"
fi

# ─── Step 2: Build Backend ───────────────────────────────────────────
if ! $SKIP_BACKEND; then
    step "Step 2/4: Build backend (.NET)"
    [ -d "$BACKEND_DIR" ] || fail "Cartella backend non trovata: $BACKEND_DIR"
    cd "$BACKEND_DIR"
    dotnet publish -c Release -o "$PUBLISH_DIR"
    ok "Backend compilato in: $PUBLISH_DIR"
else
    step "Step 2/4: Build backend SKIP"
fi

# ─── Step 3: Build Frontend ─────────────────────────────────────────
if ! $SKIP_FRONTEND; then
    step "Step 3/4: Build frontend (Vite + PWA)"
    [ -d "$FRONTEND_DIR" ] || fail "Cartella frontend non trovata: $FRONTEND_DIR"
    cd "$FRONTEND_DIR"
    npm install
    npm run build
    ok "Frontend compilato"
else
    step "Step 3/4: Build frontend SKIP"
fi

# ─── Step 4: Copia frontend in wwwroot ───────────────────────────────
if ! $SKIP_FRONTEND; then
    step "Step 4/4: Copia frontend in wwwroot"
    DIST_DIR="$FRONTEND_DIR/dist"
    [ -d "$DIST_DIR" ] || fail "Cartella dist non trovata: $DIST_DIR"
    mkdir -p "$WWWROOT_DIR"
    # Pulisci i vecchi asset frontend (preserva euritmo)
    rm -rf "$WWWROOT_DIR/assets"
    rm -f "$WWWROOT_DIR"/sw.js "$WWWROOT_DIR"/workbox-*.js "$WWWROOT_DIR"/index.html "$WWWROOT_DIR"/manifest.webmanifest
    cp -r "$DIST_DIR"/* "$WWWROOT_DIR/"
    ok "Frontend copiato in $WWWROOT_DIR"
else
    step "Step 4/4: Copia frontend SKIP"
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
