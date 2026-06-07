import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatTime, formatDuration, formatFileSize, getStatusColor, truncateText } from '../utils'
import type { Artifact } from '../types'
import './PipelineDetail.css'

export default function PipelineDetail() {
  const { 
    selectedPipelineId, 
    pipelines, 
    buildLogs,
    logSearchKeyword,
    setLogSearchKeyword,
    setSelectedPipeline,
    setCurrentView,
    fetchBuildLogs,
    searchBuildLogs,
    copyBuildLink,
    triggerBuild,
    cancelBuild,
    downloadArtifact,
    isLoading
  } = useAppStore()

  const [activeJob, setActiveJob] = useState<string | null>(null)
  const [showArtifacts, setShowArtifacts] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [downloadingArtifacts, setDownloadingArtifacts] = useState<Record<string, 'downloading' | 'success' | 'failed' | null>>({})
  const logContainerRef = useRef<HTMLDivElement>(null)

  const pipeline = pipelines.find(p => p.id === selectedPipelineId)

  useEffect(() => {
    if (selectedPipelineId) {
      fetchBuildLogs(selectedPipelineId)
    }
  }, [selectedPipelineId, fetchBuildLogs])

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [buildLogs])

  if (!pipeline) {
    return (
      <div className="pipeline-detail-empty">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">请选择一个流水线查看详情</div>
          <button className="btn btn-primary mt-4" onClick={() => setCurrentView('projects')}>
            返回项目列表
          </button>
        </div>
      </div>
    )
  }

  const statusColor = getStatusColor(pipeline.status)
  const canCancel = pipeline.status === 'running' || pipeline.status === 'pending'

  const handleSearch = () => {
    if (selectedPipelineId) {
      searchBuildLogs(selectedPipelineId, searchInput)
    }
  }

  const handleCopyLink = () => {
    copyBuildLink(pipeline.id)
    alert('构建链接已复制到剪贴板')
  }

  const handleCancel = async () => {
    if (confirm('确定要取消此构建吗？')) {
      await cancelBuild(pipeline.id)
    }
  }

  const handleRebuild = async () => {
    const newPipeline = await triggerBuild(pipeline.projectId, pipeline.branch)
    if (newPipeline) {
      setSelectedPipeline(newPipeline.id)
    }
  }

  const handleDownloadArtifact = async (artifact: Artifact) => {
    const artifactId = artifact.id
    setDownloadingArtifacts(prev => ({ ...prev, [artifactId]: 'downloading' }))
    
    try {
      if (window.electronAPI && artifact.downloadUrl) {
        window.electronAPI.downloadFile(artifact.downloadUrl, artifact.name)
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const success = Math.random() > 0.3
      if (success) {
        setDownloadingArtifacts(prev => ({ ...prev, [artifactId]: 'success' }))
        setTimeout(() => {
          setDownloadingArtifacts(prev => ({ ...prev, [artifactId]: null }))
        }, 3000)
      } else {
        throw new Error('下载失败')
      }
    } catch (error) {
      setDownloadingArtifacts(prev => ({ ...prev, [artifactId]: 'failed' }))
      setTimeout(() => {
        setDownloadingArtifacts(prev => ({ ...prev, [artifactId]: null }))
      }, 3000)
    }
  }

  const totalDuration = pipeline.stages.reduce((acc, stage) => acc + (stage.duration || 0), 0)

  return (
    <div className="pipeline-detail-page">
      <div className="detail-header">
        <button 
          className="btn btn-ghost btn-sm back-btn"
          onClick={() => setCurrentView('projects')}
        >
          ← 返回
        </button>
        <div className="detail-header-content">
          <div className="detail-title-row">
            <h1 className="detail-title">
              <span className="detail-project">{pipeline.projectName}</span>
              <span className="detail-separator">/</span>
              <span className="detail-branch">🌿 {pipeline.branch}</span>
            </h1>
            <span className={`detail-status status-${pipeline.status}`}>
              {pipeline.status === 'success' && '✓ 构建成功'}
              {pipeline.status === 'failed' && '✗ 构建失败'}
              {pipeline.status === 'running' && '⏳ 构建中...'}
              {pipeline.status === 'pending' && '⏳ 排队中'}
              {pipeline.status === 'canceled' && '⊘ 已取消'}
              {pipeline.status === 'skipped' && '↷ 已跳过'}
            </span>
          </div>
          <div className="detail-meta">
            <span>👤 {pipeline.commit.author}</span>
            <span>🕐 {formatFullTime(pipeline.startedAt)}</span>
            {pipeline.duration ? <span>⏱️ 总耗时 {formatDuration(pipeline.duration)}</span> : null}
            <span>
              {pipeline.triggerType === 'push' && '📤 推送触发'}
              {pipeline.triggerType === 'manual' && '👆 手动触发'}
              {pipeline.triggerType === 'schedule' && '⏰ 定时触发'}
              {pipeline.triggerType === 'merge_request' && '🔀 MR触发'}
            </span>
          </div>
        </div>
        <div className="detail-actions">
          {canCancel && (
            <button className="btn btn-danger btn-sm" onClick={handleCancel}>
              ⊘ 取消构建
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleCopyLink}>
            🔗 复制链接
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleRebuild}>
            ↻ 重新构建
          </button>
        </div>
      </div>

      <div className="commit-info card">
        <div className="commit-info-left">
          <code className="commit-sha-large">{pipeline.commit.sha}</code>
          <div className="commit-message-large">
            {pipeline.commit.message}
          </div>
        </div>
      </div>

      <div className="stages-section">
        <h3 className="section-title">阶段耗时</h3>
        <div className="stages-timeline">
          {pipeline.stages.map((stage, index) => (
            <div key={stage.id} className="stage-timeline-item">
              <div className="stage-timeline-connector">
                <div 
                  className="stage-dot-large" 
                  style={{ borderColor: getStatusColor(stage.status), background: stage.status === 'success' ? getStatusColor(stage.status) : 'transparent' }}
                />
                {index < pipeline.stages.length - 1 && (
                  <div 
                    className="stage-line" 
                    style={{ 
                      background: stage.status === 'success' ? getStatusColor(stage.status) : 'var(--border-color)' 
                    }}
                  />
                )}
              </div>
              <div className={`stage-card stage-card-${stage.status}`}>
                <div className="stage-header">
                  <span className="stage-name-large">{stage.name}</span>
                  <span className={`stage-status-badge badge-${stage.status}`}>
                    {stage.status === 'success' && '成功'}
                    {stage.status === 'failed' && '失败'}
                    {stage.status === 'running' && '运行中'}
                    {stage.status === 'pending' && '排队中'}
                    {stage.status === 'canceled' && '已取消'}
                    {stage.status === 'skipped' && '已跳过'}
                  </span>
                </div>
                {stage.duration !== undefined && stage.duration > 0 && (
                  <div className="stage-duration">
                    耗时: {formatDuration(stage.duration)}
                    <div className="duration-bar">
                      <div 
                        className="duration-bar-fill" 
                        style={{ 
                          width: `${Math.min((stage.duration / totalDuration) * 100, 100)}%`,
                          background: statusColor
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="stage-jobs">
                  {stage.jobs.map(job => (
                    <div 
                      key={job.id}
                      className={`job-item ${activeJob === job.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveJob(job.id)
                        if (selectedPipelineId) {
                          fetchBuildLogs(selectedPipelineId, job.id)
                        }
                      }}
                    >
                      <span className="job-dot" style={{ background: getStatusColor(job.status) }} />
                      <span className="job-name">{job.name}</span>
                      {job.duration ? (
                        <span className="job-duration">{formatDuration(job.duration)}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="logs-section">
        <div className="logs-header">
          <h3 className="section-title">构建日志</h3>
          <div className="logs-search">
            <input
              type="text"
              className="input"
              placeholder="搜索日志关键词..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-secondary btn-sm" onClick={handleSearch}>
              🔍 搜索
            </button>
          </div>
        </div>
        <div className="logs-container" ref={logContainerRef}>
          {isLoading ? (
            <div className="logs-loading">
              <div className="loading-spinner" />
              <span>加载日志中...</span>
            </div>
          ) : buildLogs.length === 0 ? (
            <div className="logs-empty">暂无日志</div>
          ) : (
            <div className="logs-content">
              {buildLogs.map((log, index) => (
                <div 
                  key={index} 
                  className={`log-line log-${log.level}`}
                >
                  <span className="log-time">
                    {log.timestamp ? formatTime(log.timestamp, 'HH:mm:ss') : ''}
                  </span>
                  <span className={`log-level level-${log.level}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="log-stage">[{log.stage}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pipeline.artifacts && pipeline.artifacts.length > 0 && (
        <div className="artifacts-section">
          <div className="artifacts-header" onClick={() => setShowArtifacts(!showArtifacts)}>
            <h3 className="section-title">
              <span className="toggle-icon">{showArtifacts ? '▼' : '▶'}</span>
              构建产物 ({pipeline.artifacts.length})
            </h3>
          </div>
          {showArtifacts && (
            <div className="artifacts-list">
              {pipeline.artifacts.map(artifact => (
                <div key={artifact.id} className="artifact-item card">
                  <div className="artifact-icon">📦</div>
                  <div className="artifact-info">
                    <div className="artifact-name">{artifact.name}</div>
                    <div className="artifact-meta">
                      <span>{formatFileSize(artifact.size)}</span>
                      <span>·</span>
                      <span>{formatTime(artifact.createdAt)}</span>
                    </div>
                  </div>
                  <button 
                    className={`btn btn-sm ${
                      downloadingArtifacts[artifact.id] === 'failed' ? 'btn-danger' :
                      downloadingArtifacts[artifact.id] === 'success' ? 'btn-success' :
                      'btn-primary'
                    }`}
                    onClick={() => handleDownloadArtifact(artifact)}
                    disabled={downloadingArtifacts[artifact.id] === 'downloading'}
                  >
                    {downloadingArtifacts[artifact.id] === 'downloading' && '⏳ 下载中...'}
                    {downloadingArtifacts[artifact.id] === 'success' && '✓ 下载成功'}
                    {downloadingArtifacts[artifact.id] === 'failed' && '✗ 下载失败'}
                    {!downloadingArtifacts[artifact.id] && '⬇ 下载'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatFullTime(timestamp?: number): string {
  if (!timestamp) return '--'
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}
