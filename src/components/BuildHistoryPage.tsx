import { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatTime, formatDuration, getPlatformIcon } from '../utils'
import './BuildHistoryPage.css'

export default function BuildHistoryPage() {
  const { triggerRecords, projects, openPipelineDetail, setCurrentView, setSelectedProject } = useAppStore()

  const projectStats = useMemo(() => {
    const stats: Record<string, {
      projectId: string
      projectName: string
      repoUrl?: string
      ciPlatform?: string
      total: number
      success: number
      failed: number
      running: number
      pending: number
      canceled: number
      lastTriggeredAt: number
      lastPipelineId: string
      lastBranch: string
      lastStatus: string
    }> = {}

    for (const record of triggerRecords) {
      if (!stats[record.projectId]) {
        const project = projects.find(p => p.id === record.projectId)
        stats[record.projectId] = {
          projectId: record.projectId,
          projectName: project?.name || record.projectName,
          repoUrl: project?.repoUrl,
          ciPlatform: project?.ciPlatform,
          total: 0,
          success: 0,
          failed: 0,
          running: 0,
          pending: 0,
          canceled: 0,
          lastTriggeredAt: 0,
          lastPipelineId: '',
          lastBranch: '',
          lastStatus: ''
        }
      }
      
      const s = stats[record.projectId]
      s.total++
      if (record.status === 'success') s.success++
      else if (record.status === 'failed') s.failed++
      else if (record.status === 'running') s.running++
      else if (record.status === 'pending') s.pending++
      else if (record.status === 'canceled') s.canceled++
      
      if (record.triggeredAt > s.lastTriggeredAt) {
        s.lastTriggeredAt = record.triggeredAt
        s.lastPipelineId = record.pipelineId
        s.lastBranch = record.branch
        s.lastStatus = record.status
      }
    }

    return Object.values(stats).sort((a, b) => b.lastTriggeredAt - a.lastTriggeredAt)
  }, [triggerRecords, projects])

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId)
    setCurrentView('projects')
  }

  const handleLastPipelineClick = (pipelineId: string, projectId: string) => {
    openPipelineDetail(pipelineId, projectId)
  }

  const successRate = (stats: typeof projectStats[0]) => {
    const finished = stats.success + stats.failed
    if (finished === 0) return 0
    return Math.round((stats.success / finished) * 100)
  }

  return (
    <div className="build-history-page">
      <div className="page-header">
        <h2>本地构建历史</h2>
        <span className="record-count">共 {triggerRecords.length} 次触发 · {projectStats.length} 个项目</span>
      </div>

      {projectStats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-text">暂无构建记录</div>
          <div className="empty-desc">手动触发构建后，记录会显示在这里</div>
        </div>
      ) : (
        <div className="history-grid">
          {projectStats.map(stats => (
            <div key={stats.projectId} className="history-card card">
              <div className="history-card-header">
                <div 
                  className="project-info"
                  onClick={() => handleProjectClick(stats.projectId)}
                >
                  <span className="project-icon">{getPlatformIcon(stats.ciPlatform || 'gitlab')}</span>
                  <div className="project-meta">
                    <div className="project-name">{stats.projectName}</div>
                    {stats.repoUrl && (
                      <div className="project-repo" title={stats.repoUrl}>{stats.repoUrl}</div>
                    )}
                  </div>
                </div>
                <div className="project-badge">{stats.total} 次</div>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-num success">{stats.success}</div>
                  <div className="stat-label">成功</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num failed">{stats.failed}</div>
                  <div className="stat-label">失败</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num running">{stats.running}</div>
                  <div className="stat-label">运行中</div>
                </div>
                <div className="stat-item">
                  <div className="stat-num pending">{stats.pending}</div>
                  <div className="stat-label">排队中</div>
                </div>
              </div>

              <div className="success-rate-bar">
                <div 
                  className="success-rate-fill"
                  style={{ width: `${successRate(stats)}%` }}
                />
                <span className="success-rate-text">{successRate(stats)}% 成功率</span>
              </div>

              <div 
                className="last-build"
                onClick={() => stats.lastPipelineId && handleLastPipelineClick(stats.lastPipelineId, stats.projectId)}
              >
                <div className="last-build-label">最近一次</div>
                <div className="last-build-info">
                  <span className={`status-dot status-${stats.lastStatus}`} />
                  <span className="last-branch">🌿 {stats.lastBranch}</span>
                  <span className="last-time">{formatTime(stats.lastTriggeredAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
