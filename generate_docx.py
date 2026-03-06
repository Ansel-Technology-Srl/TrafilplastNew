#!/usr/bin/env python3
"""
Genera il documento DOCX di Analisi Funzionale per Recinzioni Portal.
Include diagrammi di flusso generati con matplotlib.
"""
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np
from io import BytesIO
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

OUT_DIR = '/home/user/TrafilplastNew/diagrams'
os.makedirs(OUT_DIR, exist_ok=True)

# ─── Colori ──────────────────────────────────────────────────────────
C_PRIMARY = '#1e40af'
C_PRIMARY_LIGHT = '#3b82f6'
C_GREEN = '#16a34a'
C_AMBER = '#d97706'
C_RED = '#dc2626'
C_GRAY = '#6b7280'
C_BG = '#f8fafc'
C_WHITE = '#ffffff'

# ─── Utility per diagrammi ──────────────────────────────────────────

def draw_box(ax, x, y, w, h, text, color=C_PRIMARY, text_color='white', fontsize=9, style='round'):
    """Disegna un box con testo centrato."""
    if style == 'diamond':
        diamond = plt.Polygon([(x, y+h/2), (x+w/2, y+h), (x+w, y+h/2), (x+w/2, y)],
                              closed=True, facecolor=color, edgecolor='#1e293b', linewidth=1.2)
        ax.add_patch(diamond)
        ax.text(x+w/2, y+h/2, text, ha='center', va='center', fontsize=fontsize-1,
                color=text_color, fontweight='bold', wrap=True)
    else:
        rounding = 0.02
        bbox = FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad={rounding}",
                              facecolor=color, edgecolor='#1e293b', linewidth=1.2)
        ax.add_patch(bbox)
        ax.text(x+w/2, y+h/2, text, ha='center', va='center', fontsize=fontsize,
                color=text_color, fontweight='bold', wrap=True)

def draw_arrow(ax, x1, y1, x2, y2, label='', color='#475569'):
    """Disegna una freccia tra due punti."""
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, lw=1.5))
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx+0.02, my, label, fontsize=7, color=color, fontstyle='italic')


# ═══════════════════════════════════════════════════════════════════
# DIAGRAMMA 1: Flusso Generale dell'Applicazione
# ═══════════════════════════════════════════════════════════════════
def create_general_flow():
    fig, ax = plt.subplots(1, 1, figsize=(14, 10))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)
    ax.axis('off')
    ax.set_facecolor(C_BG)
    fig.patch.set_facecolor(C_BG)
    ax.set_title('Flusso Generale - Recinzioni Portal', fontsize=16, fontweight='bold', color=C_PRIMARY, pad=15)

    # Start
    draw_box(ax, 5.5, 9.0, 3, 0.6, 'ACCESSO AL PORTALE', C_PRIMARY)
    # Login
    draw_box(ax, 5.5, 7.8, 3, 0.6, 'Login / Autenticazione', '#334155')
    draw_arrow(ax, 7, 9.0, 7, 8.4)

    # Decision - User Type
    draw_box(ax, 5.2, 6.5, 3.6, 0.7, 'Tipo Utente?', C_AMBER, style='diamond')
    draw_arrow(ax, 7, 7.8, 7, 7.2)

    # Admin path
    draw_box(ax, 0.5, 5.0, 2.8, 0.6, 'ADMIN (Tipo 1)', C_RED)
    draw_arrow(ax, 5.2, 6.85, 3.3, 5.6, 'Admin')
    draw_box(ax, 0.5, 4.0, 2.8, 0.6, 'Gestione Utenti', '#475569')
    draw_box(ax, 0.5, 3.0, 2.8, 0.6, 'Import/Export Dati', '#475569')
    draw_arrow(ax, 1.9, 5.0, 1.9, 4.6)
    draw_arrow(ax, 1.9, 4.0, 1.9, 3.6)

    # Super User path
    draw_box(ax, 4.0, 5.0, 2.8, 0.6, 'SUPER USER (Tipo 2)', C_AMBER)
    draw_arrow(ax, 6.2, 6.5, 5.4, 5.6, 'Super')
    draw_box(ax, 4.0, 4.0, 2.8, 0.6, 'Gestione Listini', '#475569')
    draw_arrow(ax, 5.4, 5.0, 5.4, 4.6)

    # Shop User path
    draw_box(ax, 8.0, 5.0, 3.0, 0.6, 'SHOP USER (Tipo 3-4)', C_GREEN)
    draw_arrow(ax, 8.8, 6.5, 9.5, 5.6, 'Shop')
    draw_box(ax, 7.5, 4.0, 2.0, 0.6, 'Catalogo', '#475569')
    draw_box(ax, 10.0, 4.0, 2.5, 0.6, 'Configuratore', '#475569')
    draw_arrow(ax, 8.5, 5.0, 8.5, 4.6)
    draw_arrow(ax, 10.5, 5.0, 11.2, 4.6)

    # Cart flow
    draw_box(ax, 8.5, 2.8, 2.5, 0.6, 'Carrello', '#475569')
    draw_arrow(ax, 8.5, 4.0, 9.75, 3.4)
    draw_arrow(ax, 11.25, 4.0, 9.75, 3.4)

    # Quote
    draw_box(ax, 8.5, 1.6, 2.5, 0.6, 'Preventivo', '#475569')
    draw_arrow(ax, 9.75, 2.8, 9.75, 2.2)

    # Order
    draw_box(ax, 8.5, 0.4, 2.5, 0.6, 'Ordine + EDI', C_GREEN)
    draw_arrow(ax, 9.75, 1.6, 9.75, 1.0)

    fig.savefig(f'{OUT_DIR}/01_flusso_generale.png', dpi=150, bbox_inches='tight')
    plt.close()


# ═══════════════════════════════════════════════════════════════════
# DIAGRAMMA 2: Flusso Autenticazione
# ═══════════════════════════════════════════════════════════════════
def create_auth_flow():
    fig, ax = plt.subplots(1, 1, figsize=(12, 9))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 9)
    ax.axis('off')
    ax.set_facecolor(C_BG)
    fig.patch.set_facecolor(C_BG)
    ax.set_title('Flusso Autenticazione', fontsize=16, fontweight='bold', color=C_PRIMARY, pad=15)

    # Login Page
    draw_box(ax, 4.5, 8.0, 3, 0.6, 'Pagina di Login', C_PRIMARY)
    # Fields
    draw_box(ax, 1.0, 7.0, 2.5, 0.5, 'Username', '#64748b')
    draw_box(ax, 4.0, 7.0, 2.5, 0.5, 'Password', '#64748b')
    draw_box(ax, 7.0, 7.0, 2.5, 0.5, 'Ricordami', '#64748b')
    draw_arrow(ax, 3.5, 8.0, 2.25, 7.5)
    draw_arrow(ax, 6, 8.0, 5.25, 7.5)
    draw_arrow(ax, 7.5, 8.0, 8.25, 7.5)

    # Submit
    draw_box(ax, 4.0, 5.8, 3, 0.6, 'POST /api/auth/login', '#334155')
    draw_arrow(ax, 6, 7.0, 5.5, 6.4)

    # Decision
    draw_box(ax, 3.8, 4.5, 3.4, 0.7, 'Credenziali valide?', C_AMBER, style='diamond')
    draw_arrow(ax, 5.5, 5.8, 5.5, 5.2)

    # Success
    draw_box(ax, 7.5, 3.2, 3.5, 0.6, 'JWT Token + Refresh Token', C_GREEN)
    draw_arrow(ax, 7.2, 4.85, 9.25, 3.8, 'SI')
    draw_box(ax, 7.5, 2.2, 3.5, 0.6, 'Redirect per Ruolo', '#475569')
    draw_arrow(ax, 9.25, 3.2, 9.25, 2.8)

    # Fail
    draw_box(ax, 1.0, 3.2, 3.5, 0.6, 'Errore: credenziali errate', C_RED)
    draw_arrow(ax, 3.8, 4.85, 2.75, 3.8, 'NO')

    # Brute force protection
    draw_box(ax, 1.0, 2.2, 3.5, 0.6, 'Blocco dopo 5 tentativi', C_RED)
    draw_arrow(ax, 2.75, 3.2, 2.75, 2.8)

    # Forgot Password
    draw_box(ax, 0.5, 0.5, 3.0, 0.6, 'Password Dimenticata', C_PRIMARY_LIGHT)
    draw_box(ax, 4.0, 0.5, 3.0, 0.6, 'Email con Link Reset', '#475569')
    draw_box(ax, 7.5, 0.5, 3.5, 0.6, 'Nuova Password + Token', '#475569')
    draw_arrow(ax, 3.5, 0.8, 4.0, 0.8)
    draw_arrow(ax, 7.0, 0.8, 7.5, 0.8)

    fig.savefig(f'{OUT_DIR}/02_flusso_autenticazione.png', dpi=150, bbox_inches='tight')
    plt.close()


# ═══════════════════════════════════════════════════════════════════
# DIAGRAMMA 3: Flusso Catalogo
# ═══════════════════════════════════════════════════════════════════
def create_catalog_flow():
    fig, ax = plt.subplots(1, 1, figsize=(13, 9))
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 9)
    ax.axis('off')
    ax.set_facecolor(C_BG)
    fig.patch.set_facecolor(C_BG)
    ax.set_title('Flusso Catalogo Prodotti', fontsize=16, fontweight='bold', color=C_PRIMARY, pad=15)

    # Entry
    draw_box(ax, 5, 8.0, 3, 0.6, 'CATALOGO PRODOTTI', C_PRIMARY)

    # Filters
    draw_box(ax, 0.5, 6.8, 2.5, 0.5, 'Ricerca Testo', '#64748b')
    draw_box(ax, 3.5, 6.8, 2.5, 0.5, 'Filtro Categoria', '#64748b')
    draw_box(ax, 6.5, 6.8, 2.5, 0.5, 'Filtro Famiglia', '#64748b')
    draw_box(ax, 9.5, 6.8, 2.5, 0.5, 'Ordinamento', '#64748b')
    draw_arrow(ax, 5, 8.0, 1.75, 7.3)
    draw_arrow(ax, 6, 8.0, 4.75, 7.3)
    draw_arrow(ax, 7, 8.0, 7.75, 7.3)
    draw_arrow(ax, 8, 8.0, 10.75, 7.3)

    # API
    draw_box(ax, 4, 5.5, 5, 0.6, 'GET /api/prodotti?filtri&paginazione', '#334155')
    draw_arrow(ax, 6.5, 6.8, 6.5, 6.1)

    # View modes
    draw_box(ax, 2, 4.2, 3, 0.6, 'Vista Griglia', '#475569')
    draw_box(ax, 7.5, 4.2, 3, 0.6, 'Vista Lista', '#475569')
    draw_arrow(ax, 5, 5.5, 3.5, 4.8, 'Grid')
    draw_arrow(ax, 8, 5.5, 9, 4.8, 'List')

    # Product actions
    draw_box(ax, 0.5, 2.8, 3, 0.6, 'Dettaglio Prodotto', C_PRIMARY_LIGHT)
    draw_box(ax, 4.5, 2.8, 3, 0.6, 'Aggiungi al Carrello', C_GREEN)
    draw_box(ax, 8.5, 2.8, 3, 0.6, 'Configura Recinzione', C_AMBER)
    draw_arrow(ax, 3.5, 4.2, 2, 3.4)
    draw_arrow(ax, 3.5, 4.2, 6, 3.4)
    draw_arrow(ax, 9, 4.2, 10, 3.4)

    # Detail modal
    draw_box(ax, 0.5, 1.5, 3, 0.5, 'Modale Dettaglio', '#475569')
    draw_arrow(ax, 2, 2.8, 2, 2.0)
    # show info
    draw_box(ax, 0.0, 0.5, 1.8, 0.5, 'Info Tecniche', '#94a3b8')
    draw_box(ax, 2.0, 0.5, 1.8, 0.5, 'Traduzioni', '#94a3b8')
    draw_arrow(ax, 1.5, 1.5, 0.9, 1.0)
    draw_arrow(ax, 2.5, 1.5, 2.9, 1.0)

    # Navigate
    draw_box(ax, 4.5, 1.5, 3, 0.5, '→ Carrello', C_GREEN)
    draw_arrow(ax, 6, 2.8, 6, 2.0)
    draw_box(ax, 8.5, 1.5, 3, 0.5, '→ Configuratore', C_AMBER)
    draw_arrow(ax, 10, 2.8, 10, 2.0)

    fig.savefig(f'{OUT_DIR}/03_flusso_catalogo.png', dpi=150, bbox_inches='tight')
    plt.close()


# ═══════════════════════════════════════════════════════════════════
# DIAGRAMMA 4: Flusso Configuratore Recinzioni
# ═══════════════════════════════════════════════════════════════════
def create_configurator_flow():
    fig, ax = plt.subplots(1, 1, figsize=(14, 10))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)
    ax.axis('off')
    ax.set_facecolor(C_BG)
    fig.patch.set_facecolor(C_BG)
    ax.set_title('Flusso Configuratore Recinzioni 3D', fontsize=16, fontweight='bold', color=C_PRIMARY, pad=15)

    # Entry
    draw_box(ax, 5, 9.0, 4, 0.6, 'CONFIGURATORE RECINZIONI', C_PRIMARY)

    # Step 1
    draw_box(ax, 0.5, 7.5, 4, 0.7, 'STEP 1: Parametri Base', C_PRIMARY_LIGHT)
    draw_arrow(ax, 5, 9.0, 2.5, 8.2)
    draw_box(ax, 0.3, 6.3, 2.0, 0.5, 'Colore Doghe', '#64748b')
    draw_box(ax, 2.5, 6.3, 2.0, 0.5, 'Colore Pali', '#64748b')
    draw_box(ax, 0.3, 5.5, 2.0, 0.5, 'Tipo Fissaggio', '#64748b')
    draw_box(ax, 2.5, 5.5, 2.0, 0.5, 'Tipo Doghe', '#64748b')
    draw_box(ax, 0.3, 4.7, 4.0, 0.5, 'Altezza (100/150/185/200 cm)', '#64748b')
    draw_arrow(ax, 2.5, 7.5, 1.3, 6.8)
    draw_arrow(ax, 2.5, 7.5, 3.5, 6.8)
    draw_arrow(ax, 2.5, 7.5, 1.3, 6.0)
    draw_arrow(ax, 2.5, 7.5, 3.5, 6.0)
    draw_arrow(ax, 2.5, 7.5, 2.3, 5.2)

    # Step 2
    draw_box(ax, 5.5, 7.5, 3.5, 0.7, 'STEP 2: Design Sezioni', C_PRIMARY_LIGHT)
    draw_arrow(ax, 4.5, 7.85, 5.5, 7.85)
    draw_box(ax, 5.3, 6.3, 2.0, 0.5, 'Lunghezza', '#64748b')
    draw_box(ax, 7.5, 6.3, 2.0, 0.5, 'Angolo (0/90°)', '#64748b')
    draw_box(ax, 5.3, 5.5, 4.2, 0.5, 'Aggiungi/Rimuovi Sezioni', '#64748b')
    draw_arrow(ax, 7.25, 7.5, 6.3, 6.8)
    draw_arrow(ax, 7.25, 7.5, 8.5, 6.8)
    draw_arrow(ax, 7.25, 7.5, 7.4, 6.0)

    # 3D Preview
    draw_box(ax, 10, 7.5, 3.5, 0.7, 'Anteprima 2D/3D', C_AMBER)
    draw_arrow(ax, 9, 7.85, 10, 7.85)
    draw_box(ax, 10, 6.3, 1.6, 0.5, 'Vista 3D', '#64748b')
    draw_box(ax, 11.8, 6.3, 1.6, 0.5, 'Vista 2D', '#64748b')
    draw_arrow(ax, 11.75, 7.5, 10.8, 6.8)
    draw_arrow(ax, 11.75, 7.5, 12.6, 6.8)

    # Step 3 - Calcolo
    draw_box(ax, 4.5, 3.8, 5, 0.7, 'STEP 3: Calcolo Distinta Base', C_GREEN)
    draw_arrow(ax, 7, 5.5, 7, 4.5)
    draw_box(ax, 3.5, 3.0, 3.5, 0.5, 'POST /api/configuratore/distinta-base', '#334155')
    draw_arrow(ax, 7, 3.8, 5.25, 3.5)

    # Results
    draw_box(ax, 1.0, 2.0, 3.0, 0.5, 'Lista Componenti', '#475569')
    draw_box(ax, 4.5, 2.0, 2.5, 0.5, 'Quantita', '#475569')
    draw_box(ax, 7.5, 2.0, 2.5, 0.5, 'Prezzi', '#475569')
    draw_box(ax, 10.5, 2.0, 2.5, 0.5, 'Totale', '#475569')
    draw_arrow(ax, 5.25, 3.0, 2.5, 2.5)
    draw_arrow(ax, 5.25, 3.0, 5.75, 2.5)
    draw_arrow(ax, 5.25, 3.0, 8.75, 2.5)
    draw_arrow(ax, 5.25, 3.0, 11.75, 2.5)

    # Add to cart
    draw_box(ax, 5, 0.8, 4, 0.6, 'AGGIUNGI AL CARRELLO', C_GREEN)
    draw_arrow(ax, 7, 2.0, 7, 1.4)

    fig.savefig(f'{OUT_DIR}/04_flusso_configuratore.png', dpi=150, bbox_inches='tight')
    plt.close()


# ═══════════════════════════════════════════════════════════════════
# DIAGRAMMA 5: Flusso Carrello → Preventivo → Ordine
# ═══════════════════════════════════════════════════════════════════
def create_order_flow():
    fig, ax = plt.subplots(1, 1, figsize=(14, 10))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)
    ax.axis('off')
    ax.set_facecolor(C_BG)
    fig.patch.set_facecolor(C_BG)
    ax.set_title('Flusso Carrello → Preventivo → Ordine → EDI', fontsize=16, fontweight='bold', color=C_PRIMARY, pad=15)

    # Carrello
    draw_box(ax, 5, 9.0, 4, 0.6, 'CARRELLO', C_PRIMARY)
    draw_box(ax, 1, 7.8, 3, 0.5, 'Prodotti da Catalogo', '#475569')
    draw_box(ax, 5, 7.8, 4, 0.5, 'Configurazioni Recinzione', '#475569')
    draw_box(ax, 10, 7.8, 3, 0.5, 'Modifica Quantita', '#475569')
    draw_arrow(ax, 5, 9.0, 2.5, 8.3)
    draw_arrow(ax, 7, 9.0, 7, 8.3)
    draw_arrow(ax, 9, 9.0, 11.5, 8.3)

    # Cart actions
    draw_box(ax, 1, 6.8, 3, 0.5, 'Riconfigura', '#64748b')
    draw_box(ax, 5, 6.8, 4, 0.5, 'Elimina Articoli', '#64748b')
    draw_box(ax, 10, 6.8, 3, 0.5, 'Riepilogo Totali', '#64748b')
    draw_arrow(ax, 2.5, 7.8, 2.5, 7.3)
    draw_arrow(ax, 7, 7.8, 7, 7.3)
    draw_arrow(ax, 11.5, 7.8, 11.5, 7.3)

    # Preventivo form
    draw_box(ax, 5, 5.5, 4, 0.7, 'PREVENTIVO (Form Dati)', C_AMBER)
    draw_arrow(ax, 7, 6.8, 7, 6.2)
    draw_box(ax, 0.5, 4.5, 2.5, 0.5, 'Dati Fatturazione', '#64748b')
    draw_box(ax, 3.5, 4.5, 2.5, 0.5, 'Dati Consegna', '#64748b')
    draw_box(ax, 6.5, 4.5, 2.5, 0.5, 'Pagamento', '#64748b')
    draw_box(ax, 9.5, 4.5, 2.5, 0.5, 'Note', '#64748b')
    draw_arrow(ax, 5, 5.5, 1.75, 5.0)
    draw_arrow(ax, 6, 5.5, 4.75, 5.0)
    draw_arrow(ax, 8, 5.5, 7.75, 5.0)
    draw_arrow(ax, 9, 5.5, 10.75, 5.0)

    # Save
    draw_box(ax, 4.5, 3.5, 5, 0.6, 'POST /api/ordini (Salva Preventivo)', '#334155')
    draw_arrow(ax, 7, 4.5, 7, 4.1)

    # Ordini page
    draw_box(ax, 5, 2.3, 4, 0.7, 'GESTIONE ORDINI', C_GREEN)
    draw_arrow(ax, 7, 3.5, 7, 3.0)

    # Actions
    draw_box(ax, 0.2, 1.0, 2.3, 0.5, 'Conferma\nOrdine', C_GREEN)
    draw_box(ax, 2.8, 1.0, 2.3, 0.5, 'Scarica\nPDF', '#475569')
    draw_box(ax, 5.5, 1.0, 2.5, 0.5, 'Preview\nEURITMO', C_PRIMARY_LIGHT)
    draw_box(ax, 8.3, 1.0, 2.3, 0.5, 'Invia a\nFornitore', C_AMBER)
    draw_box(ax, 10.9, 1.0, 2.3, 0.5, 'Elimina\nOrdine', C_RED)
    draw_arrow(ax, 5, 2.3, 1.35, 1.5)
    draw_arrow(ax, 6, 2.3, 3.95, 1.5)
    draw_arrow(ax, 7, 2.3, 6.75, 1.5)
    draw_arrow(ax, 8, 2.3, 9.45, 1.5)
    draw_arrow(ax, 9, 2.3, 12.05, 1.5)

    # EDI
    draw_box(ax, 4.5, 0.0, 5, 0.5, 'File EURITMO .edi + Email Fornitore', '#334155')
    draw_arrow(ax, 9.45, 1.0, 7, 0.5)

    fig.savefig(f'{OUT_DIR}/05_flusso_ordini.png', dpi=150, bbox_inches='tight')
    plt.close()


# ═══════════════════════════════════════════════════════════════════
# DIAGRAMMA 6: Flusso Admin
# ═══════════════════════════════════════════════════════════════════
def create_admin_flow():
    fig, ax = plt.subplots(1, 1, figsize=(12, 8))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis('off')
    ax.set_facecolor(C_BG)
    fig.patch.set_facecolor(C_BG)
    ax.set_title('Flusso Amministratore', fontsize=16, fontweight='bold', color=C_PRIMARY, pad=15)

    # Admin
    draw_box(ax, 4, 7.0, 4, 0.6, 'AREA AMMINISTRATORE', C_RED)

    # Users
    draw_box(ax, 0.5, 5.5, 4, 0.7, 'Gestione Utenti', C_PRIMARY)
    draw_arrow(ax, 4, 7.0, 2.5, 6.2)
    draw_box(ax, 0.2, 4.3, 1.8, 0.5, 'Crea Utente', '#475569')
    draw_box(ax, 2.2, 4.3, 2.0, 0.5, 'Modifica', '#475569')
    draw_box(ax, 0.2, 3.4, 1.8, 0.5, 'Elimina', C_RED)
    draw_box(ax, 2.2, 3.4, 2.0, 0.5, 'Assegna Ruolo', '#475569')
    draw_arrow(ax, 2.5, 5.5, 1.1, 4.8)
    draw_arrow(ax, 2.5, 5.5, 3.2, 4.8)
    draw_arrow(ax, 2.5, 5.5, 1.1, 3.9)
    draw_arrow(ax, 2.5, 5.5, 3.2, 3.9)

    # Import/Export Users
    draw_box(ax, 0.2, 2.3, 2.0, 0.5, 'Export Excel', C_GREEN)
    draw_box(ax, 2.4, 2.3, 2.0, 0.5, 'Import Excel', C_AMBER)
    draw_arrow(ax, 1.2, 3.4, 1.2, 2.8)
    draw_arrow(ax, 3.4, 3.4, 3.4, 2.8)

    # Import
    draw_box(ax, 6.5, 5.5, 5, 0.7, 'Import/Export Dati Massivo', C_PRIMARY)
    draw_arrow(ax, 8, 7.0, 9, 6.2)
    draw_box(ax, 5.5, 4.3, 2.3, 0.5, 'Prodotti', '#475569')
    draw_box(ax, 8.2, 4.3, 2.3, 0.5, 'Prezzi', '#475569')
    draw_box(ax, 5.5, 3.4, 2.3, 0.5, 'Clienti', '#475569')
    draw_box(ax, 8.2, 3.4, 2.3, 0.5, 'Punti Vendita', '#475569')
    draw_arrow(ax, 9, 5.5, 6.65, 4.8)
    draw_arrow(ax, 9, 5.5, 9.35, 4.8)
    draw_arrow(ax, 9, 5.5, 6.65, 3.9)
    draw_arrow(ax, 9, 5.5, 9.35, 3.9)

    # Modes
    draw_box(ax, 5.5, 2.3, 2.3, 0.5, 'Merge Mode', C_GREEN)
    draw_box(ax, 8.2, 2.3, 2.3, 0.5, 'Replace Mode', C_RED)
    draw_arrow(ax, 6.65, 3.4, 6.65, 2.8)
    draw_arrow(ax, 9.35, 3.4, 9.35, 2.8)

    # Template/Format
    draw_box(ax, 5.5, 1.2, 5, 0.5, 'Excel/CSV con validazione e report errori', '#334155')
    draw_arrow(ax, 6.65, 2.3, 8, 1.7)
    draw_arrow(ax, 9.35, 2.3, 8, 1.7)

    fig.savefig(f'{OUT_DIR}/06_flusso_admin.png', dpi=150, bbox_inches='tight')
    plt.close()


# ═══════════════════════════════════════════════════════════════════
# DIAGRAMMA 7: Flusso Listini (Super User)
# ═══════════════════════════════════════════════════════════════════
def create_pricelist_flow():
    fig, ax = plt.subplots(1, 1, figsize=(12, 8))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis('off')
    ax.set_facecolor(C_BG)
    fig.patch.set_facecolor(C_BG)
    ax.set_title('Flusso Gestione Listini (Super User)', fontsize=16, fontweight='bold', color=C_PRIMARY, pad=15)

    # Entry
    draw_box(ax, 4, 7.0, 4, 0.6, 'GESTIONE LISTINI', C_AMBER)

    # PdV Selection
    draw_box(ax, 0.5, 5.5, 4, 0.7, 'Selezione Punto Vendita', C_PRIMARY)
    draw_arrow(ax, 4, 7.0, 2.5, 6.2)

    # Decision
    draw_box(ax, 3.5, 4.0, 4, 0.7, 'Listino Personalizzato\nesiste?', C_AMBER, style='diamond')
    draw_arrow(ax, 2.5, 5.5, 5.5, 4.7)

    # No custom
    draw_box(ax, 0.3, 2.5, 3.2, 0.6, 'Visualizza Listino Pubblico', '#475569')
    draw_arrow(ax, 3.5, 4.35, 1.9, 3.1, 'NO')
    draw_box(ax, 0.3, 1.3, 3.2, 0.6, 'Crea Listino Personalizzato', C_GREEN)
    draw_arrow(ax, 1.9, 2.5, 1.9, 1.9)

    # Has custom
    draw_box(ax, 8, 5.5, 3.5, 0.7, 'Editor Listino Personalizzato', C_GREEN)
    draw_arrow(ax, 7.5, 4.35, 9.75, 5.5, 'SI')

    # Actions
    draw_box(ax, 6.5, 4.0, 2.5, 0.5, 'Modifica Prezzi\n(inline)', '#475569')
    draw_box(ax, 9.2, 4.0, 2.5, 0.5, 'Confronto\nPubblico vs Custom', '#475569')
    draw_arrow(ax, 9.75, 5.5, 7.75, 4.5)
    draw_arrow(ax, 9.75, 5.5, 10.45, 4.5)

    draw_box(ax, 6.5, 2.8, 2.5, 0.5, 'Modifica Date\nValidita', '#475569')
    draw_box(ax, 9.2, 2.8, 2.5, 0.5, 'Reset a Prezzi\nPubblici', C_AMBER)
    draw_arrow(ax, 7.75, 4.0, 7.75, 3.3)
    draw_arrow(ax, 10.45, 4.0, 10.45, 3.3)

    draw_box(ax, 8, 1.5, 3.5, 0.5, 'Elimina Listino Personalizzato', C_RED)
    draw_arrow(ax, 9.75, 2.8, 9.75, 2.0)

    fig.savefig(f'{OUT_DIR}/07_flusso_listini.png', dpi=150, bbox_inches='tight')
    plt.close()


# ═══════════════════════════════════════════════════════════════════
# DIAGRAMMA 8: Architettura Tecnica
# ═══════════════════════════════════════════════════════════════════
def create_architecture_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(14, 9))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 9)
    ax.axis('off')
    ax.set_facecolor(C_BG)
    fig.patch.set_facecolor(C_BG)
    ax.set_title('Architettura Tecnica', fontsize=16, fontweight='bold', color=C_PRIMARY, pad=15)

    # User
    draw_box(ax, 5, 8.0, 4, 0.6, 'UTENTE (Browser / PWA)', '#334155')

    # Frontend
    draw_box(ax, 2, 6.2, 10, 1.2, '', C_PRIMARY_LIGHT)
    ax.text(7, 7.1, 'FRONTEND - React 18 + Vite', ha='center', va='center',
            fontsize=12, color='white', fontweight='bold')
    ax.text(7, 6.55, 'React Router | Zustand | Three.js | i18next | Tailwind CSS | PWA',
            ha='center', va='center', fontsize=8, color='#dbeafe')
    draw_arrow(ax, 7, 8.0, 7, 7.4)

    # API Layer
    draw_box(ax, 2, 4.2, 10, 1.2, '', C_GREEN)
    ax.text(7, 5.1, 'BACKEND - ASP.NET Core 8 Web API', ha='center', va='center',
            fontsize=12, color='white', fontweight='bold')
    ax.text(7, 4.55, 'Auth | Prodotti | Configuratore | Ordini | Listini | Import | EURITMO | Email',
            ha='center', va='center', fontsize=8, color='#dcfce7')
    draw_arrow(ax, 7, 6.2, 7, 5.4)

    # Services
    draw_box(ax, 0.5, 2.4, 2.5, 0.8, 'SQL Server\nDatabase', '#475569')
    draw_box(ax, 3.5, 2.4, 2.5, 0.8, 'JWT Auth\nBCrypt', '#475569')
    draw_box(ax, 6.5, 2.4, 2.5, 0.8, 'SMTP\nEmail', '#475569')
    draw_box(ax, 9.5, 2.4, 2.5, 0.8, 'EURITMO\nEDI Files', '#475569')
    draw_arrow(ax, 4, 4.2, 1.75, 3.2)
    draw_arrow(ax, 5.5, 4.2, 4.75, 3.2)
    draw_arrow(ax, 8, 4.2, 7.75, 3.2)
    draw_arrow(ax, 10, 4.2, 10.75, 3.2)

    # Deploy
    draw_box(ax, 3, 0.8, 8, 0.8, '', '#1e293b')
    ax.text(7, 1.35, 'DEPLOYMENT - Windows Server / IIS', ha='center', va='center',
            fontsize=11, color='white', fontweight='bold')
    ax.text(7, 0.95, 'HTTPS | URL Rewrite | Compression | Security Headers',
            ha='center', va='center', fontsize=8, color='#94a3b8')
    draw_arrow(ax, 1.75, 2.4, 5, 1.6)
    draw_arrow(ax, 10.75, 2.4, 9, 1.6)

    fig.savefig(f'{OUT_DIR}/08_architettura.png', dpi=150, bbox_inches='tight')
    plt.close()


# ═══════════════════════════════════════════════════════════════════
# Genera tutti i diagrammi
# ═══════════════════════════════════════════════════════════════════
print("Generazione diagrammi...")
create_general_flow()
print("  01 - Flusso Generale ✓")
create_auth_flow()
print("  02 - Autenticazione ✓")
create_catalog_flow()
print("  03 - Catalogo ✓")
create_configurator_flow()
print("  04 - Configuratore ✓")
create_order_flow()
print("  05 - Ordini ✓")
create_admin_flow()
print("  06 - Admin ✓")
create_pricelist_flow()
print("  07 - Listini ✓")
create_architecture_diagram()
print("  08 - Architettura ✓")
print("Tutti i diagrammi generati in", OUT_DIR)
