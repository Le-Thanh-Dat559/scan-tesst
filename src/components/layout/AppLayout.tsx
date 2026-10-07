import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ProcessingModal from '@/components/ui/ProcessingModal'

export default function AppLayout() {
  const location = useLocation()
  // Document viewer has its own dedicated top toolbar
  const isDocumentView = location.pathname.startsWith('/documents/') && location.pathname !== '/documents'

  return (
    <div className="flex h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden relative font-sans">
      {/* Ambient background glows */}
      <div className="absolute -top-40 left-[15%] w-[600px] h-[600px] bg-primary-500/5 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 right-[15%] w-[600px] h-[600px] bg-accent-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Sidebar - fixed width on desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10">
        {!isDocumentView && <Header />}

        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col relative z-10 scroll-smooth">
          <div className="page-enter flex-1 flex flex-col min-h-0 w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Processing Modal */}
      <ProcessingModal />
    </div>
  )
}