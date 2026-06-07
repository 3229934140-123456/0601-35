import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatTime, truncateText } from '../utils'
import './ApprovalsPage.css'

export default function ApprovalsPage() {
  const { 
    approvals, 
    fetchApprovals, 
    approveApproval, 
    rejectApproval,
    triggerRecords,
    fetchTriggerRecords,
    projects,
    isLoading
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'triggers'>('pending')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null)

  useEffect(() => {
    fetchApprovals()
    fetchTriggerRecords()
  }, [])

  const pendingApprovals = approvals.filter(a => a.status === 'pending')
  const historyApprovals = approvals.filter(a => a.status !== 'pending')

  const getProjectInfo = (projectId: string) => {
    return projects.find(p => p.id === projectId)
  }

  const handleApprove = async (approvalId: string) => {
    if (confirm('确定批准此发布请求吗？')) {
      await approveApproval(approvalId)
    }
  }

  const openRejectModal = (approvalId: string) => {
    setSelectedApprovalId(approvalId)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const handleReject = async () => {
    if (selectedApprovalId) {
      await rejectApproval(selectedApprovalId, rejectReason)
      setRejectModalOpen(false)
      setSelectedApprovalId(null)
      setRejectReason('')
    }
  }

  const renderApprovalCard = (approval: typeof approvals[0], showActions: boolean = false) => (
    <div key={approval.id} className="approval-card">
      <div className="approval-header">
        <div className="approval-title-row">
          <span className="approval-title">{approval.title}</span>
          <span className={`approval-status status-${approval.status}`}>
            {approval.status === 'pending' && '⏳ 待审批'}
            {approval.status === 'approved' && '✓ 已通过'}
            {approval.status === 'rejected' && '✗ 已驳回'}
          </span>
        </div>
        <div className="approval-project">
          📁 {approval.projectName} · 🌿 {approval.branch}
          {approval.version && ` · 📌 ${approval.version}`}
        </div>
      </div>
      
      <div className="approval-body">
        <p className="approval-description">{approval.description}</p>
        
        <div className="approval-meta">
          <div className="meta-item">
            <span className="meta-label">提交人</span>
            <span className="meta-value">👤 {approval.submitter}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">提交时间</span>
            <span className="meta-value">🕐 {formatTime(approval.submittedAt)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">审批人</span>
            <span className="meta-value">
              {approval.approvers.map(a => `👤 ${a}`).join(', ')}
            </span>
          </div>
          {approval.approvedBy && approval.approvedBy.length > 0 && (
            <div className="meta-item">
              <span className="meta-label">已批准</span>
              <span className="meta-value text-success">
                {approval.approvedBy.map(a => `✓ ${a}`).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {showActions && approval.status === 'pending' && (
        <div className="approval-actions">
          <button 
            className="btn btn-success btn-sm"
            onClick={() => handleApprove(approval.id)}
          >
            ✓ 批准
          </button>
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => openRejectModal(approval.id)}
          >
            ✗ 驳回
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="approvals-page">
      <div className="page-header">
        <h1 className="page-title">发布审批</h1>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          待审批
          {pendingApprovals.length > 0 && (
            <span className="tab-badge">{pendingApprovals.length}</span>
          )}
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          历史记录
        </button>
        <button 
          className={`tab ${activeTab === 'triggers' ? 'active' : ''}`}
          onClick={() => setActiveTab('triggers')}
        >
          本机触发记录
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'pending' && (
          <div className="approvals-list">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <span>加载中...</span>
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-text">暂无待审批项</div>
              </div>
            ) : (
              pendingApprovals.map(a => renderApprovalCard(a, true))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="approvals-list">
            {historyApprovals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">暂无历史记录</div>
              </div>
            ) : (
              historyApprovals.map(a => renderApprovalCard(a))
            )}
          </div>
        )}

        {activeTab === 'triggers' && (
          <div className="triggers-list">
            {triggerRecords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔫</div>
                <div className="empty-state-text">暂无触发记录</div>
              </div>
            ) : (
              triggerRecords.map(record => {
                const project = getProjectInfo(record.projectId)
                return (
                  <div key={record.id} className="trigger-record-item card">
                    <div className="trigger-info">
                      <span className="trigger-project">{record.projectName}</span>
                      <span className="trigger-branch">🌿 {record.branch}</span>
                      {project && (
                        <span className="trigger-platform">
                          🏭 {project.ciPlatform.toUpperCase()}
                        </span>
                      )}
                      <span className={`trigger-status status-${record.status}`}>
                        {record.status === 'success' && '✓ 成功'}
                        {record.status === 'failed' && '✗ 失败'}
                        {record.status === 'running' && '⏳ 运行中'}
                        {record.status === 'pending' && '⏳ 排队中'}
                        {record.status === 'canceled' && '⊘ 已取消'}
                      </span>
                    </div>
                    <div className="trigger-time">{formatTime(record.triggeredAt)}</div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {rejectModalOpen && (
        <div className="modal-overlay" onClick={() => setRejectModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>驳回发布请求</h3>
              <button className="modal-close" onClick={() => setRejectModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>驳回原因</label>
                <textarea
                  className="input"
                  rows={4}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="请输入驳回原因..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRejectModalOpen(false)}>取消</button>
              <button 
                className="btn btn-danger" 
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
