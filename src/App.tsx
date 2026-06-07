import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import ProjectList from './components/ProjectList'
import PipelineDetail from './components/PipelineDetail'
import ApprovalsPage from './components/ApprovalsPage'
import NotificationsPage from './components/NotificationsPage'
import SettingsPage from './components/SettingsPage'
import DownloadsPage from './components/DownloadsPage'
import BuildHistoryPage from './components/BuildHistoryPage'
import './styles/app.css'

declare global {
  interface Window {
    electronAPI?: {
      onNavigate: (callback: (route: string) => void) => void
      onQuickBuild: (callback: (data: { projectId: string; branch: string }) => void) => void
      updateTrayProjects: (projects: Array<{ id: string; name: string; defaultBranch: string }>) => void
      showNotification: (title: string, body: string) => void
      openExternal: (url: string) => void
      downloadFile: (url: string, filename?: string) => Promise<{ success: boolean; error?: string }>
      copyToClipboard: (text: string) => void
    }
  }
}

export default function App() {
  const { 
    currentView, 
    setCurrentView,
    projects,
    fetchProjects, 
    fetchApprovals, 
    fetchNotifications, 
    fetchAccounts,
    fetchTriggerRecords,
    setSelectedProject,
    triggerBuild,
    settings
  } = useAppStore()

  useEffect(() => {
    fetchProjects()
    fetchApprovals()
    fetchNotifications()
    fetchAccounts()
    fetchTriggerRecords()
  }, [])

  useEffect(() => {
    if (window.electronAPI && projects.length > 0) {
      window.electronAPI.updateTrayProjects(
        projects.map(p => ({
          id: p.id,
          name: p.name,
          defaultBranch: p.defaultBranch
        }))
      )
    }
  }, [projects])

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onNavigate((route) => {
        if (route === 'settings') {
          setCurrentView('settings')
        }
      })

      window.electronAPI.onQuickBuild(async (data) => {
        setSelectedProject(data.projectId)
        setCurrentView('projects')
        setTimeout(async () => {
          await triggerBuild(data.projectId, data.branch)
          if (window.electronAPI) {
            window.electronAPI.showNotification(
              '构建已触发',
              `项目 ${projects.find(p => p.id === data.projectId)?.name || data.projectId} ${data.branch} 分支`
            )
          }
        }, 500)
      })
    }
  }, [setCurrentView, setSelectedProject, triggerBuild, projects])

  const renderContent = () => {
    switch (currentView) {
      case 'projects':
        return <ProjectList />
      case 'pipeline-detail':
        return <PipelineDetail />
      case 'approvals':
        return <ApprovalsPage />
      case 'notifications':
        return <NotificationsPage />
      case 'settings':
        return <SettingsPage />
      case 'downloads':
        return <DownloadsPage />
      default:
        return <ProjectList />
    }
  }

  return (
    <div className="app-container">
      <TitleBar />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
