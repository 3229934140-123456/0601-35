import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatTime } from '../utils'
import './NotificationsPage.css'

export default function NotificationsPage() {
  const { 
    notifications, 
    fetchNotifications, 
    markNotificationRead,
    markAllNotificationsRead,
    openPipelineDetail,
    projects
  } = useAppStore()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'build_success': return '✅'
      case 'build_failed': return '❌'
      case 'approval_required': return '📋'
      case 'build_canceled': return '⊘'
      default: return '🔔'
    }
  }

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'build_success': return 'notification-success'
      case 'build_failed': return 'notification-failed'
      case 'approval_required': return 'notification-warning'
      default: return ''
    }
  }

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    if (!notif.read) {
      markNotificationRead(notif.id)
    }
    if (notif.pipelineId && notif.projectId) {
      openPipelineDetail(notif.pipelineId, notif.projectId)
    }
  }

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
  }

  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp)

  const getProjectInfo = (projectId: string) => {
    return projects.find(p => p.id === projectId)
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1 className="page-title">
          通知中心
          {unreadCount > 0 && <span className="unread-label">{unreadCount} 条未读</span>}
        </h1>
        <div className="page-actions">
          {unreadCount > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
              ✓ 全部已读
            </button>
          )}
        </div>
      </div>

      <div className="notifications-list">
        {sortedNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <div className="empty-state-text">暂无通知</div>
          </div>
        ) : (
          sortedNotifications.map(notif => (
            <div
              key={notif.id}
              className={`notification-item ${getNotificationStyle(notif.type)} ${notif.read ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notif.type)}
              </div>
              <div className="notification-content">
                <div className="notification-title-row">
                  <span className="notification-title">{notif.title}</span>
                  {!notif.read && <span className="unread-dot" />}
                </div>
                <div className="notification-message">{notif.message}</div>
                <div className="notification-meta">
                  <span className="notification-project">📁 {notif.projectName}</span>
                  {getProjectInfo(notif.projectId) && (
                    <>
                      <span className="notification-platform">
                        🏭 {getProjectInfo(notif.projectId)?.ciPlatform.toUpperCase()}
                      </span>
                    </>
                  )}
                  <span className="notification-time">{formatTime(notif.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
