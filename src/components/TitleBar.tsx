import { useAppStore } from '../store/useAppStore'
import './TitleBar.css'

export default function TitleBar() {
  const { notifications } = useAppStore()
  
  const unreadCount = notifications.filter(n => !n.read).length

  const handleMinimize = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.minimize()
    }
  }

  const handleMaximize = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.maximize()
    }
  }

  const handleClose = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.close()
    }
  }

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <div className="titlebar-logo">🚀</div>
        <div className="titlebar-title">CI Tray Tool</div>
      </div>
      <div className="titlebar-drag-region" />
      <div className="titlebar-right">
        <div className="titlebar-status-indicators">
          <div className="status-dot status-success" title="已连接">
            <span className="status-icon">●</span>
          </div>
          {unreadCount > 0 && (
            <div className="unread-badge" title="未读通知">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
        <div className="window-controls">
          <button className="window-btn" onClick={handleMinimize} title="最小化">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="5.5" width="8" height="1" rx="0.5" />
            </svg>
          </button>
          <button className="window-btn" onClick={handleMaximize} title="最大化">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2.5" y="2.5" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button className="window-btn window-btn-close" onClick={handleClose} title="关闭">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
              <line x1="3" y1="3" x2="9" y2="9" />
              <line x1="9" y1="3" x2="3" y2="9" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
