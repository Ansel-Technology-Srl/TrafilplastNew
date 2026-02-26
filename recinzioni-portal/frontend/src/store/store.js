import { create } from 'zustand';
import api from '../services/api';

// ========== AUTH STORE ==========
export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  /**
   * Login: restituisce { success, message } così il frontend
   * può mostrare il messaggio di errore del backend (tentativi rimanenti, lockout, ecc.)
   */
  login: async (username, password, rememberMe) => {
    try {
      const res = await api.post('/auth/login', { username, password, rememberMe });
      if (res?.success) {
        api.setToken(res.data.token, rememberMe);
        if (rememberMe) localStorage.setItem('refreshToken', res.data.refreshToken);
        set({ user: res.data.user, isAuthenticated: true });
        return { success: true };
      }
      return { success: false, message: res?.message || 'Credenziali non valide' };
    } catch (err) {
      return { success: false, message: 'Errore di connessione al server' };
    }
  },

  logout: () => {
    api.clearToken();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) { set({ loading: false }); return; }
    api.token = token;
    try {
      const res = await api.get('/auth/me');
      if (res?.success) {
        set({ user: res.data, isAuthenticated: true, loading: false });
      } else {
        api.clearToken();
        set({ loading: false });
      }
    } catch {
      api.clearToken();
      set({ loading: false });
    }
  },

  /**
   * Cambio password per utente autenticato
   */
  changePassword: async (currentPassword, newPassword) => {
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword });
      return { success: res?.success, message: res?.message };
    } catch (err) {
      return { success: false, message: 'Errore di connessione' };
    }
  }
}));

// ========== CART STORE (session-only, come da AF §6.1) ==========
export const useCartStore = create((set, get) => ({
  items: [],

  addItem: (item) => set((state) => {
    const existing = state.items.find(i => i.prdCod === item.prdCod && !item.isConfigured);
    if (existing) {
      return { items: state.items.map(i =>
        i.prdCod === item.prdCod && !item.isConfigured
          ? { ...i, quantita: i.quantita + item.quantita }
          : i
      )};
    }
    return { items: [...state.items, { ...item, id: Date.now() }] };
  }),

  addConfiguredItem: (config, componenti, totale) => set((state) => ({
    items: [...state.items, {
      id: Date.now(),
      prdCod: 'CONF-REC',
      prdDes: `Recinzione configurata - H${config.altezzaPali}cm - ${config.sezioni.length} sez.`,
      prdUm: 'PZ',
      quantita: 1,
      prezzoUnitario: totale,
      isConfigured: true,
      config,
      componenti
    }]
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),

  updateQuantity: (id, qty) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, quantita: qty } : i)
  })),

  clear: () => set({ items: [] }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + (i.quantita * i.prezzoUnitario), 0),
  getVAT: () => get().getSubtotal() * 0.22,
  getTotal: () => get().getSubtotal() * 1.22,
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantita, 0)
}));
