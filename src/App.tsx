import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useThemeStore, useDocumentStore, useAuthStore } from '@/stores'
import { ToastProvider } from '@/components/ui/Toast'

// Layouts
import AppLayout from '@/components/layout/AppLayout'
import AuthLayout from '@/components/layout/AuthLayout'

// Pages
import Home from '@/pages/Home'
import Scan from '@/pages/Scan'
import Documents from '@/pages/Documents'
import DocumentViewer from '@/pages/DocumentViewer'
import OCR from '@/pages/OCR'
import PdfTools from '@/pages/PdfTools'
import Settings from '@/pages/Settings'
import Login from '@/pages/Login'
import Register from '@/pages/Register'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  const { initialize } = useThemeStore()
  const { updateStats } = useDocumentStore()

  // Initialize theme and update stats on mount
  useEffect(() => {
    initialize()
    updateStats()
  }, [initialize, updateStats])

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Main Routes */}
          <Route 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/scan" element={<Scan />} />
            
            <Route path="/documents" element={<Documents />} />
            <Route path="/documents/:id" element={<DocumentViewer />} />
            
            <Route path="/ocr" element={<OCR />} />
            <Route path="/pdf-tools" element={<PdfTools />} />
            <Route path="/settings" element={<Settings />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
