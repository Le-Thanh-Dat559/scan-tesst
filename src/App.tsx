import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useThemeStore, useDocumentStore } from '@/stores'
import { isAuthenticated } from '@/services/api'
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
  // Dùng isAuthenticated từ api.ts (kiểm tra token trong localStorage)
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  const { initialize } = useThemeStore()
  const { loadDocuments } = useDocumentStore()

  // Initialize theme + load documents from MongoDB on mount
  useEffect(() => {
    initialize()
    // Chỉ load khi đã đăng nhập
    if (isAuthenticated()) {
      loadDocuments()
    }
  }, [initialize, loadDocuments])

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
