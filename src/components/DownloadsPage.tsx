import { useAppStore } from '../store/useAppStore'
import { formatTime, formatFileSize, getPlatformIcon } from '../utils'
import './DownloadsPage.css'

export default function DownloadsPage() {
  const { downloadRecords, retryDownload, startDownload, projects } = useAppStore()

  const getProjectInfo = (projectId: string) => {
    return projects.find(p => p.id === projectId)
  }

  const handleRetry = (recordId: string) => {
    retryDownload(recordId)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'downloading': return '下载中'
      case 'success': return '下载成功'
      case 'failed': return '下载失败'
      default: return status
    }
  }

  const sortedRecords = [...downloadRecords].sort((a, b) => b.downloadedAt - a.downloadedAt)

  return (
    <div className="downloads-page">
      <div className="page-header">
        <h2>下载记录</h2>
        <span className="record-count">共 {sortedRecords.length} 条记录</span>
      </div>

      {sortedRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📥</div>
          <div className="empty-text">暂无下载记录</div>
          <div className="empty-desc">从流水线详情页下载产物后，记录会显示在这里</div>
        </div>
      ) : (
        <div className="downloads-list">
          {sortedRecords.map(record => {
            const project = getProjectInfo(record.projectId)
            return (
              <div key={record.id} className={`download-item download-${record.status}`}>
                <div className="download-icon">
                  {record.status === 'downloading' && '⏳'}
                  {record.status === 'success' && '✅'}
                  {record.status === 'failed' && '❌'}
                </div>
                <div className="download-info">
                  <div className="download-name">{record.artifactName}</div>
                  <div className="download-meta">
                    <span className="download-project">
                      {project?.name || record.projectName}
                    </span>
                    <span className="meta-sep">·</span>
                    <span className="download-size">{formatFileSize(record.size)}</span>
                    <span className="meta-sep">·</span>
                    <span className="download-time">{formatTime(record.downloadedAt)}</span>
                  </div>
                  <div className="download-pipeline">
                    <span className="pipeline-label">流水线:</span>
                    <span className="pipeline-id">{record.pipelineId}</span>
                  </div>
                  {record.errorMessage && (
                    <div className="download-error">{record.errorMessage}</div>
                  )}
                </div>
                <div className="download-actions">
                  <span className={`status-badge badge-${record.status}`}>
                    {getStatusText(record.status)}
                  </span>
                  {record.status === 'failed' && (
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleRetry(record.id)}
                    >
                      ↻ 重试
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
