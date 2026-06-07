import { useAppStore } from '../store/useAppStore'
import { getPlatformIcon } from '../utils'
import './Sidebar.css'

export default function Sidebar() {
  const { 
    currentView, 
    setCurrentView, 
    notifications,
    approvals 
  } = useAppStore()

  const unreadNotifs = notifications.filter(n => !n.read).length
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length

  const menuItems = [
    { id: 'projects', label: '项目', icon: '📁', view: 'projects' as const },
    { id: 'approvals', label: '审批', icon: '✅', badge: pendingApprovals, view: 'approvals' as const },
    { id: 'notifications', label: '通知', icon: '🔔', badge: unreadNotifs, view: 'notifications' as const },
    { id: 'settings', label: '设置', icon: '⚙️', view: 'settings' as const }
  ]

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${currentView === item.view ? 'active' : ''}`}
            onClick={() => setCurrentView(item.view)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="sidebar-badge">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">👤</div>
          <div className="user-details">
            <div className="user-name">zhangsan</div>
            <div className="user-platform">
              <span className="platform-icon">{getPlatformIcon('gitlab')}</span>
              GitLab
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
