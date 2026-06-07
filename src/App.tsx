import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import ProjectList from './components/ProjectList'
import PipelineDetail from './components/PipelineDetail'
import ApprovalsPage from './components/ApprovalsPage'
import NotificationsPage from './components/NotificationsPage'
import SettingsPage from './components/SettingsPage'
import './styles/app.css'

export default function App() {
  const { 
    currentView, 
    fetchProjects, 
    fetchApprovals, 
    fetchNotifications, 
    fetchAccounts,
    fetchTriggerRecords,
    settings
  } = useAppStore()

  useEffect(() => {
    fetchProjects()
    fetchApprovals()
    fetchNotifications()
    fetchAccounts()
    fetchTriggerRecords()
  }, [])

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
