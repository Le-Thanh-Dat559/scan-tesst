import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ScanPage,
  DocumentInfo,
  ImageFilters,
  DashboardStats,
  AppSettings,
  ThemeMode,
  ScanPreset,
  OcrLanguage,
  PdfOptions,
} from '@/types'
import { defaultFilters, defaultSettings } from '@/types'
import { generateId } from '@/utils/helpers'

/* ===== Theme Store ===== */
interface ThemeStore {
  mode: ThemeMode
  resolved: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  initialize: () => void
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolved: 'light',
      setMode: (mode: ThemeMode) => {
        const resolved = resolveTheme(mode)
        set({ mode, resolved })
        applyTheme(resolved)
      },
      initialize: () => {
        const resolved = resolveTheme(get().mode)
        set({ resolved })
        applyTheme(resolved)

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (get().mode === 'system') {
            const newResolved = resolveTheme('system')
            set({ resolved: newResolved })
            applyTheme(newResolved)
          }
        })
      },
    }),
    { name: 'scanpro-theme' },
  ),
)

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/* ===== Auth Store ===== */
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'scanpro-auth',
    }
  )
)

/* ===== Scan Store ===== */
interface ScanState {
  pages: ScanPage[]
  currentPageIndex: number
  activePreset: ScanPreset
  undoStack: ScanPage[][]
  redoStack: ScanPage[][]
}

interface ScanActions {
  addPage: (page: Omit<ScanPage, 'id' | 'pageNumber' | 'rotation' | 'filters'>) => void
  addPages: (pages: Omit<ScanPage, 'id' | 'pageNumber' | 'rotation' | 'filters'>[]) => void
  removePage: (id: string) => void
  duplicatePage: (id: string) => void
  reorderPages: (fromIndex: number, toIndex: number) => void
  setCurrentPage: (index: number) => void
  updatePage: (id: string, updates: Partial<ScanPage>) => void
  updatePageFilters: (id: string, filters: Partial<ImageFilters>) => void
  rotatePage: (id: string, degrees: number) => void
  setPreset: (preset: ScanPreset) => void
  clearPages: () => void
  undo: () => void
  redo: () => void
  saveUndoState: () => void
}

export const useScanStore = create<ScanState & ScanActions>()((set, get) => ({
  pages: [],
  currentPageIndex: 0,
  activePreset: 'document',
  undoStack: [],
  redoStack: [],

  saveUndoState: () => {
    const { pages, undoStack } = get()
    set({
      undoStack: [...undoStack.slice(-20), pages.map(p => ({ ...p }))],
      redoStack: [],
    })
  },

  addPage: (page) => {
    const { pages } = get()
    get().saveUndoState()
    const newPage: ScanPage = {
      ...page,
      id: generateId(),
      pageNumber: pages.length + 1,
      rotation: 0,
      filters: { ...defaultFilters },
    }
    set({ pages: [...pages, newPage], currentPageIndex: pages.length })
  },

  addPages: (newPages) => {
    const { pages } = get()
    get().saveUndoState()
    const mappedPages: ScanPage[] = newPages.map((p, i) => ({
      ...p,
      id: generateId(),
      pageNumber: pages.length + i + 1,
      rotation: 0,
      filters: { ...defaultFilters },
    }))
    set({
      pages: [...pages, ...mappedPages],
      currentPageIndex: pages.length,
    })
  },

  removePage: (id) => {
    get().saveUndoState()
    const { pages, currentPageIndex } = get()
    const filtered = pages.filter(p => p.id !== id).map((p, i) => ({ ...p, pageNumber: i + 1 }))
    const newIndex = Math.min(currentPageIndex, filtered.length - 1)
    set({ pages: filtered, currentPageIndex: Math.max(0, newIndex) })
  },

  duplicatePage: (id) => {
    get().saveUndoState()
    const { pages } = get()
    const page = pages.find(p => p.id === id)
    if (!page) return
    const index = pages.indexOf(page)
    const newPage: ScanPage = {
      ...page,
      id: generateId(),
      pageNumber: index + 2,
    }
    const newPages = [...pages]
    newPages.splice(index + 1, 0, newPage)
    set({ pages: newPages.map((p, i) => ({ ...p, pageNumber: i + 1 })) })
  },

  reorderPages: (fromIndex, toIndex) => {
    get().saveUndoState()
    const { pages } = get()
    const newPages = [...pages]
    const [moved] = newPages.splice(fromIndex, 1)
    newPages.splice(toIndex, 0, moved)
    set({
      pages: newPages.map((p, i) => ({ ...p, pageNumber: i + 1 })),
      currentPageIndex: toIndex,
    })
  },

  setCurrentPage: (index) => set({ currentPageIndex: index }),

  updatePage: (id, updates) => {
    set({
      pages: get().pages.map(p => p.id === id ? { ...p, ...updates } : p),
    })
  },

  updatePageFilters: (id, filters) => {
    set({
      pages: get().pages.map(p =>
        p.id === id ? { ...p, filters: { ...p.filters, ...filters } } : p
      ),
    })
  },

  rotatePage: (id, degrees) => {
    get().saveUndoState()
    set({
      pages: get().pages.map(p =>
        p.id === id ? { ...p, rotation: (p.rotation + degrees) % 360 } : p
      ),
    })
  },

  setPreset: (preset) => set({ activePreset: preset }),

  clearPages: () => {
    get().saveUndoState()
    set({ pages: [], currentPageIndex: 0 })
  },

  undo: () => {
    const { undoStack, pages } = get()
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    set({
      pages: prev,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...get().redoStack, pages],
    })
  },

  redo: () => {
    const { redoStack, pages } = get()
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    set({
      pages: next,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...get().undoStack, pages],
    })
  },
}))

/* ===== Document Store ===== */
interface DocumentStore {
  documents: DocumentInfo[]
  stats: DashboardStats
  addDocument: (doc: DocumentInfo) => void
  removeDocument: (id: string) => void
  updateDocument: (id: string, updates: Partial<DocumentInfo>) => void
  getDocument: (id: string) => DocumentInfo | undefined
  updateStats: () => void
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documents: [],
      stats: {
        totalDocuments: 0,
        scannedDocuments: 0,
        pdfFiles: 0,
        ocrCount: 0,
      },

      addDocument: (doc) => {
        set({ documents: [doc, ...get().documents] })
        get().updateStats()
      },

      removeDocument: (id) => {
        set({ documents: get().documents.filter(d => d.id !== id) })
        get().updateStats()
      },

      updateDocument: (id, updates) => {
        set({
          documents: get().documents.map(d =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        })
      },

      getDocument: (id) => get().documents.find(d => d.id === id),

      updateStats: () => {
        const { documents } = get()
        set({
          stats: {
            totalDocuments: documents.length,
            scannedDocuments: documents.filter(d => d.type === 'scan').length,
            pdfFiles: documents.filter(d => d.type === 'pdf').length,
            ocrCount: documents.filter(d => d.type === 'ocr').length,
          },
        })
      },
    }),
    { name: 'scanpro-documents' },
  ),
)

/* ===== Settings Store ===== */
interface SettingsStore extends AppSettings {
  setTheme: (theme: ThemeMode) => void
  setDefaultPreset: (preset: ScanPreset) => void
  setDefaultOcrLang: (lang: OcrLanguage) => void
  setPdfOptions: (options: Partial<PdfOptions>) => void
  setAutoEnhance: (enabled: boolean) => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => {
        set({ theme })
        useThemeStore.getState().setMode(theme)
      },

      setDefaultPreset: (preset) => set({ defaultScanPreset: preset }),
      setDefaultOcrLang: (lang) => set({ defaultOcrLanguage: lang }),

      setPdfOptions: (options) =>
        set((state) => ({
          defaultPdfOptions: { ...state.defaultPdfOptions, ...options },
        })),

      setAutoEnhance: (enabled) => set({ autoEnhance: enabled }),

      resetSettings: () => set({ ...defaultSettings }),
    }),
    { name: 'scanpro-settings' },
  ),
)

/* ===== UI Store ===== */
interface UIStore {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
  processingModal: { open: boolean; message: string; progress: number }
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileMenu: (open: boolean) => void
  showProcessing: (message: string, progress?: number) => void
  updateProgress: (progress: number) => void
  hideProcessing: () => void
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  processingModal: { open: false, message: '', progress: 0 },

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileMenu: (open) => set({ mobileMenuOpen: open }),

  showProcessing: (message, progress = 0) =>
    set({ processingModal: { open: true, message, progress } }),
  updateProgress: (progress) =>
    set(s => ({ processingModal: { ...s.processingModal, progress } })),
  hideProcessing: () =>
    set({ processingModal: { open: false, message: '', progress: 0 } }),
}))
