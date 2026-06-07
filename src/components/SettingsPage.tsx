import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getPlatformIcon } from '../utils'
import './SettingsPage.css'

export default function SettingsPage() {
  const { 
    settings, 
    updateSettings, 
    accounts, 
    fetchAccounts,
    switchAccount,
    addAccount
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'account' | 'notification' | 'appearance' | 'about'>('account')
  const [addAccountModal, setAddAccountModal] = useState(false)
  const [newAccount, setNewAccount] = useState({
    username: '',
    email: '',
    platform: 'gitlab' as 'gitlab' | 'github' | 'jenkins' | 'coding',
    token: ''
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleAddAccount = async () => {
    if (newAccount.username && newAccount.token) {
      await addAccount(newAccount)
      setAddAccountModal(false)
      setNewAccount({ username: '', email: '', platform: 'gitlab', token: '' })
    }
  }

  const handleSwitchAccount = async (accountId: string) => {
    await switchAccount(accountId)
  }

  const SettingRow = ({ label, description, control }: { label: string; description?: string; control: React.ReactNode }) => (
    <div className="setting-row">
      <div className="setting-info">
        <div className="setting-label">{label}</div>
        {description && <div className="setting-description">{description}</div>}
      </div>
      <div className="setting-control">{control}</div>
    </div>
  )

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      className={`toggle-switch ${checked ? 'on' : 'off'}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  )

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">偏好设置</h1>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <button 
            className={`settings-nav-item ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            👤 账号管理
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'notification' ? 'active' : ''}`}
            onClick={() => setActiveTab('notification')}
          >
            🔔 通知设置
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            🎨 外观设置
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            ℹ️ 关于
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'account' && (
            <div className="settings-section">
              <h3 className="section-title">账号管理</h3>
              <div className="accounts-list">
                {accounts.map(account => (
                  <div 
                    key={account.id} 
                    className={`account-item ${account.isActive ? 'active' : ''}`}
                  >
                    <div className="account-icon">
                      {getPlatformIcon(account.platform)}
                    </div>
                    <div className="account-info">
                      <div className="account-name">{account.username}</div>
                      <div className="account-email">{account.email}</div>
                      <div className="account-platform">
                        {account.platform === 'gitlab' && 'GitLab'}
                        {account.platform === 'github' && 'GitHub'}
                        {account.platform === 'jenkins' && 'Jenkins'}
                        {account.platform === 'coding' && 'Coding'}
                      </div>
                    </div>
                    {account.isActive ? (
                      <span className="account-active-badge">当前使用</span>
                    ) : (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleSwitchAccount(account.id)}
                      >
                        切换
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                className="btn btn-primary add-account-btn"
                onClick={() => setAddAccountModal(true)}
              >
                ＋ 添加账号
              </button>
            </div>
          )}

          {activeTab === 'notification' && (
            <div className="settings-section">
              <h3 className="section-title">通知设置</h3>
              <div className="settings-group">
                <SettingRow
                  label="构建成功通知"
                  description="构建成功时显示系统通知"
                  control={
                    <ToggleSwitch
                      checked={settings.showSuccessNotification}
                      onChange={(v) => updateSettings({ showSuccessNotification: v })}
                    />
                  }
                />
                <SettingRow
                  label="构建失败通知"
                  description="构建失败时显示系统通知"
                  control={
                    <ToggleSwitch
                      checked={settings.showFailureNotification}
                      onChange={(v) => updateSettings({ showFailureNotification: v })}
                    />
                  }
                />
                <SettingRow
                  label="成功提示音"
                  description="构建成功时播放提示音"
                  control={
                    <ToggleSwitch
                      checked={settings.successSound}
                      onChange={(v) => updateSettings({ successSound: v })}
                    />
                  }
                />
                <SettingRow
                  label="失败提示音"
                  description="构建失败时播放提示音"
                  control={
                    <ToggleSwitch
                      checked={settings.failureSound}
                      onChange={(v) => updateSettings({ failureSound: v })}
                    />
                  }
                />
              </div>

              <h3 className="section-title section-subtitle">静默时段</h3>
              <div className="settings-group">
                <SettingRow
                  label="启用静默时段"
                  description="在指定时间段内不显示通知和提示音"
                  control={
                    <ToggleSwitch
                      checked={settings.quietHours.enabled}
                      onChange={(v) => updateSettings({ quietHours: { ...settings.quietHours, enabled: v } })}
                    />
                  }
                />
                {settings.quietHours.enabled && (
                  <div className="quiet-hours-inputs">
                    <div className="time-input-group">
                      <label>开始时间</label>
                      <input
                        type="time"
                        className="input"
                        value={settings.quietHours.startTime}
                        onChange={e => updateSettings({ quietHours: { ...settings.quietHours, startTime: e.target.value } })}
                      />
                    </div>
                    <div className="time-input-group">
                      <label>结束时间</label>
                      <input
                        type="time"
                        className="input"
                        value={settings.quietHours.endTime}
                        onChange={e => updateSettings({ quietHours: { ...settings.quietHours, endTime: e.target.value } })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <h3 className="section-title section-subtitle">刷新设置</h3>
              <div className="settings-group">
                <SettingRow
                  label="自动刷新间隔"
                  description="流水线状态自动刷新的时间间隔"
                  control={
                    <select 
                      className="select"
                      value={settings.refreshInterval}
                      onChange={e => updateSettings({ refreshInterval: Number(e.target.value) })}
                    >
                      <option value={15}>15 秒</option>
                      <option value={30}>30 秒</option>
                      <option value={60}>1 分钟</option>
                      <option value={300}>5 分钟</option>
                    </select>
                  }
                />
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3 className="section-title">外观设置</h3>
              <div className="settings-group">
                <SettingRow
                  label="主题"
                  description="选择应用显示主题"
                  control={
                    <select 
                      className="select"
                      value={settings.theme}
                      onChange={e => updateSettings({ theme: e.target.value as 'light' | 'dark' })}
                    >
                      <option value="dark">深色主题</option>
                      <option value="light">浅色主题</option>
                    </select>
                  }
                />
                <SettingRow
                  label="开机自启"
                  description="系统启动时自动运行"
                  control={
                    <ToggleSwitch
                      checked={settings.autoStart}
                      onChange={(v) => updateSettings({ autoStart: v })}
                    />
                  }
                />
                <SettingRow
                  label="最小化到托盘"
                  description="关闭窗口时最小化到系统托盘"
                  control={
                    <ToggleSwitch
                      checked={settings.minimizeToTray}
                      onChange={(v) => updateSettings({ minimizeToTray: v })}
                    />
                  }
                />
              </div>

              <h3 className="section-title section-subtitle">项目列表</h3>
              <div className="settings-group">
                <SettingRow
                  label="默认只显示关注项目"
                  description="项目列表默认只显示已标记关注的项目"
                  control={
                    <ToggleSwitch
                      checked={settings.showOnlyFavorites}
                      onChange={(v) => updateSettings({ showOnlyFavorites: v })}
                    />
                  }
                />
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="settings-section about-section">
              <div className="about-logo">🚀</div>
              <h2 className="about-title">CI Tray Tool</h2>
              <div className="about-version">版本 1.0.0</div>
              <p className="about-description">
                持续集成平台桌面托盘工具，帮助开发者快速查看流水线状态，
                支持多项目绑定、构建触发、发布审批等功能。
              </p>
              <div className="about-links">
                <a href="#" onClick={(e) => { e.preventDefault(); if ((window as any).electronAPI) (window as any).electronAPI.openExternal('https://github.com') }}>
                  项目主页
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); if ((window as any).electronAPI) (window as any).electronAPI.openExternal('https://github.com/issues') }}>
                  反馈问题
                </a>
              </div>
              <div className="about-copyright">
                © 2024 CI Tray Tool. All rights reserved.
              </div>
            </div>
          )}
        </div>
      </div>

      {addAccountModal && (
        <div className="modal-overlay" onClick={() => setAddAccountModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加账号</h3>
              <button className="modal-close" onClick={() => setAddAccountModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>平台</label>
                <select 
                  className="select"
                  value={newAccount.platform}
                  onChange={e => setNewAccount({ ...newAccount, platform: e.target.value as any })}
                >
                  <option value="gitlab">GitLab</option>
                  <option value="github">GitHub</option>
                  <option value="jenkins">Jenkins</option>
                  <option value="coding">Coding</option>
                </select>
              </div>
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入用户名"
                  value={newAccount.username}
                  onChange={e => setNewAccount({ ...newAccount, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>邮箱</label>
                <input
                  type="email"
                  className="input"
                  placeholder="请输入邮箱"
                  value={newAccount.email}
                  onChange={e => setNewAccount({ ...newAccount, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>访问令牌 (Token)</label>
                <input
                  type="password"
                  className="input"
                  placeholder="请输入访问令牌"
                  value={newAccount.token}
                  onChange={e => setNewAccount({ ...newAccount, token: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAddAccountModal(false)}>取消</button>
              <button 
                className="btn btn-primary" 
                onClick={handleAddAccount}
                disabled={!newAccount.username || !newAccount.token}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
