import { useEffect, useState, useRef, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatTime, formatDuration, formatFileSize, getStatusColor, truncateText } from '../utils'
import type { Artifact } from '../types'
import './PipelineDetail.css'

export default function PipelineDetail() {
  const { 
    selectedPipelineId, 
    pipelines, 
    buildLogs,
    downloadRecords,
    logSearchKeyword,
    setLogSearchKeyword,
    setSelectedPipeline,
    setCurrentView,
    fetchBuildLogs,
    searchBuildLogs,
    copyBuildLink,
    triggerBuild,
    cancelBuild,
    startDownload,
    retryDownload,
    isLoading
  } = useAppStore()

  const [activeJob, setActiveJob] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [showArtifacts, setShowArtifacts] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const logLineRefs = useRef<Array<HTMLDivElement | null>>([])

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

  const filteredLogs = useMemo(() => {
    if (!activeStage) return buildLogs
    return buildLogs.filter(log => log.stage === activeStage)
  }, [buildLogs, activeStage])

  const matchedIndices = useMemo(() => {
    if (!logSearchKeyword) return []
    const keyword = logSearchKeyword.toLowerCase()
    return filteredLogs
      .map((log, idx) => log.message.toLowerCase().includes(keyword) ? idx : -1)
      .filter(idx => idx !== -1)
  }, [filteredLogs, logSearchKeyword])

  useEffect(() => {
    setCurrentMatchIndex(0)
  }, [logSearchKeyword, activeStage])

  useEffect(() => {
    if (matchedIndices.length > 0 && currentMatchIndex >= 0 && logLineRefs.current[matchedIndices[currentMatchIndex]]) {
      logLineRefs.current[matchedIndices[currentMatchIndex]]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [currentMatchIndex, matchedIndices])

  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, idx) => 
      regex.test(part) ? <span key={idx} className="log-highlight">{part}</span> : part
    )
  }

  const goToPrevMatch = () => {
    if (matchedIndices.length === 0) return
    setCurrentMatchIndex(prev => 
      prev > 0 ? prev - 1 : matchedIndices.length - 1
    )
  }

  const goToNextMatch = () => {
    if (matchedIndices.length === 0) return
    setCurrentMatchIndex(prev => 
      prev < matchedIndices.length - 1 ? prev + 1 : 0
    )
  }

  const handleStageClick = (stageId: string) => {
    if (activeStage === stageId) {
      setActiveStage(null)
    } else {
      setActiveStage(stageId)
      setActiveJob(null)
    }
  }

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

  const getArtifactDownloadRecord = (artifactId: string) => {
    const recordsForArtifact = downloadRecords.filter(r => r.artifactId === artifactId)
    return recordsForArtifact.sort((a, b) => b.downloadedAt - a.downloadedAt)[0] || null
  }

  const handleDownloadArtifact = (artifact: Artifact) => {
    startDownload(artifact, pipeline)
  }

  const handleRetryDownload = (recordId: string) => {
    retryDownload(recordId)
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
              <div 
                className={`stage-card stage-card-${stage.status} ${activeStage === stage.id ? 'active' : ''}`}
                onClick={() => handleStageClick(stage.id)}
              >
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
          <div className="logs-header-left">
            <h3 className="section-title">构建日志</h3>
            {activeStage && (
              <span className="log-filter-badge">
                阶段: {pipeline.stages.find(s => s.id === activeStage)?.name}
                <button className="log-filter-clear" onClick={() => setActiveStage(null)}>✕</button>
              </span>
            )}
          </div>
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
            {logSearchKeyword && matchedIndices.length > 0 && (
              <div className="log-match-nav">
                <span className="log-match-count">
                  {currentMatchIndex + 1} / {matchedIndices.length}
                </span>
                <button 
                  className="btn btn-ghost btn-sm log-nav-btn" 
                  onClick={goToPrevMatch}
                  title="上一个"
                >
                  ↑
                </button>
                <button 
                  className="btn btn-ghost btn-sm log-nav-btn" 
                  onClick={goToNextMatch}
                  title="下一个"
                >
                  ↓
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="logs-container" ref={logContainerRef}>
          {isLoading ? (
            <div className="logs-loading">
              <div className="loading-spinner" />
              <span>加载日志中...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="logs-empty">
              {activeStage ? '该阶段暂无日志' : '暂无日志'}
            </div>
          ) : (
            <div className="logs-content">
              {filteredLogs.map((log, index) => {
                const isActiveMatch = matchedIndices[currentMatchIndex] === index
                return (
                  <div 
                    key={index} 
                    ref={el => logLineRefs.current[index] = el}
                    className={`log-line log-${log.level} ${isActiveMatch ? 'log-line-active' : ''}`}
                  >
                    <span className="log-time">
                      {log.timestamp ? formatTime(log.timestamp, 'HH:mm:ss') : ''}
                    </span>
                    <span className={`log-level level-${log.level}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="log-stage">[{log.stage}]</span>
                    <span className="log-message">
                      {highlightText(log.message, logSearchKeyword)}
                    </span>
                  </div>
                )
              })}
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
              {pipeline.artifacts.map(artifact => {
                const record = getArtifactDownloadRecord(artifact.id)
                const hasValidUrl = artifact.downloadUrl && artifact.downloadUrl !== '#' && artifact.downloadUrl !== ''
                
                return (
                  <div key={artifact.id} className="artifact-item card">
                    <div className="artifact-icon">📦</div>
                    <div className="artifact-info">
                      <div className="artifact-name">{artifact.name}</div>
                      <div className="artifact-meta">
                        <span>{formatFileSize(artifact.size)}</span>
                        <span>·</span>
                        <span>{formatTime(artifact.createdAt)}</span>
                      </div>
                      {record && record.status === 'failed' && record.errorMessage && (
                        <div className="artifact-error">{record.errorMessage}</div>
                      )}
                    </div>
                    {!hasValidUrl ? (
                      <span className="text-muted text-sm">链接不可用</span>
                    ) : record?.status === 'downloading' ? (
                      <button className="btn btn-sm btn-secondary" disabled>
                        ⏳ 下载中...
                      </button>
                    ) : record?.status === 'success' ? (
                      <button className="btn btn-sm btn-success" disabled>
                        ✓ 下载成功
                      </button>
                    ) : record?.status === 'failed' ? (
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRetryDownload(record.id)}
                      >
                        ↻ 重试
                      </button>
                    ) : (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleDownloadArtifact(artifact)}
                      >
                        ⬇ 下载
                      </button>
                    )}
                  </div>
                )
              })}
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
