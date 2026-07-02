import { useState } from 'react'
import { PenLine, Sparkles } from 'lucide-react'
import { Toolbar } from './components/Toolbar'
import { EditorPanel } from './components/editor/EditorPanel'
import { AiPanel } from './components/ai/AiPanel'
import { Preview } from './components/preview/Preview'
import { SettingsDialog } from './components/SettingsDialog'

type Tab = 'content' | 'ai'

export default function App() {
  const [tab, setTab] = useState<Tab>('content')

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[460px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 print:hidden">
          <nav className="flex border-b border-slate-200 bg-white">
            <TabButton active={tab === 'content'} onClick={() => setTab('content')}>
              <PenLine size={14} /> Content
            </TabButton>
            <TabButton active={tab === 'ai'} onClick={() => setTab('ai')}>
              <Sparkles size={14} /> AI Tailor
            </TabButton>
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === 'content' ? <EditorPanel /> : <AiPanel />}
          </div>
        </aside>
        <Preview />
      </div>
      <SettingsDialog />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'border-teal-600 text-teal-700'
          : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  )
}
