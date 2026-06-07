import type { Pipeline } from '../types'
import { useAppStore } from '../store/useAppStore'
import { formatTime, formatDuration, getStatusColor, truncateText } from '../utils'
import './PipelineCard.css'

interface PipelineCardProps {
  pipeline: Pipeline
}

export default function PipelineCard({ pipeline }: PipelineCardProps) {
  const { setSelectedPipeline, setCurrentView, copyBuildLink, cancelBuild } = useAppStore()

  const handleClick = () => {
    setSelectedPipeline(pipeline.id)
    setCurrentView('pipeline-detail')
  }

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要取消此构建吗？')) {
      await cancelBuild(pipeline.id)
    }
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    copyBuildLink(pipeline.id)
    alert('链接已复制到剪贴板')
  }

  const canCancel = pipeline.status === 'running' || pipeline.status === 'pending'

  const statusColor = getStatusColor(pipeline.status)

  return (
    <div 
      className={`pipeline-card status-${pipeline.status}`}
      onClick={handleClick}
    >
      <div className="pipeline-card-left">
        <div className="pipeline-status-icon" style={{ background: statusColor + '20', color: statusColor }}>
          {pipeline.status === 'success' && '✓'}
          {pipeline.status === 'failed' && '✗'}
          {pipeline.status === 'running' && (
            <div className="spinner-sm" />
          )}
          {pipeline.status === 'pending' && '⏳'}
          {pipeline.status === 'canceled' && '⊘'}
          {pipeline.status === 'skipped' && '↷'}
        </div>
        <div className="pipeline-info">
          <div className="pipeline-title-row">
            <span className="pipeline-branch">
              🌿 {pipeline.branch}
            </span>
            <span className={`pipeline-badge badge-${pipeline.status}`}>
              {pipeline.status === 'success' && '成功'}
              {pipeline.status === 'failed' && '失败'}
              {pipeline.status === 'running' && '运行中'}
              {pipeline.status === 'pending' && '排队中'}
              {pipeline.status === 'canceled' && '已取消'}
              {pipeline.status === 'skipped' && '已跳过'}
            </span>
            {pipeline.type === 'release' && (
              <span className="pipeline-type-badge release">发布</span>
            )}
            {pipeline.hasApproval && (
              <span className={`approval-badge ${pipeline.approvalStatus || ''}`}>
                {pipeline.approvalStatus === 'approved' ? '✓ 已审批' : 
                 pipeline.approvalStatus === 'rejected' ? '✗ 已驳回' : '⏳ 待审批'}
              </span>
            )}
          </div>
          <div className="pipeline-commit">
            <code className="commit-sha">{pipeline.commit.sha.slice(0, 7)}</code>
            <span className="commit-message">{truncateText(pipeline.commit.message.split('\n')[0], 60)}</span>
          </div>
          <div className="pipeline-meta">
            <span className="meta-item">
              👤 {pipeline.commit.author}
            </span>
            <span className="meta-item">
              🕐 {formatTime(pipeline.startedAt)}
            </span>
            {pipeline.duration !== undefined && pipeline.duration > 0 && (
              <span className="meta-item">
                ⏱️ {formatDuration(pipeline.duration)}
              </span>
            )}
            <span className="meta-item trigger-type">
              {pipeline.triggerType === 'push' && '📤 推送触发'}
              {pipeline.triggerType === 'manual' && '👆 手动触发'}
              {pipeline.triggerType === 'schedule' && '⏰ 定时触发'}
              {pipeline.triggerType === 'merge_request' && '🔀 MR触发'}
            </span>
          </div>
        </div>
      </div>

      <div className="pipeline-card-right">
        <div className="pipeline-stages">
          {pipeline.stages.map(stage => (
            <div 
              key={stage.id}
              className={`stage-pill stage-${stage.status}`}
              title={`${stage.name} - ${stage.status}`}
            >
              <span className="stage-dot" style={{ background: getStatusColor(stage.status) }} />
              <span className="stage-name">{stage.name}</span>
            </div>
          ))}
        </div>
        <div className="pipeline-actions">
          {canCancel && (
            <button 
              className="btn btn-ghost btn-sm"
              onClick={handleCancel}
              title="取消构建"
            >
              ⊘ 取消
            </button>
          )}
          <button 
            className="btn btn-ghost btn-sm"
            onClick={handleCopyLink}
            title="复制链接"
          >
            🔗 复制链接
          </button>
        </div>
      </div>
    </div>
  )
}
