import { useState, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatTime, formatFileSize } from '../utils'
import './DownloadsPage.css'

export default function DownloadsPage() {
  const { downloadRecords, retryDownload, projects, openPipelineDetail } = useAppStore()

  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

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

  const handleRecordClick = (record: typeof downloadRecords[0]) => {
    openPipelineDetail(record.pipelineId, record.projectId)
  }

  const projectOptions = useMemo(() => {
    const projectSet = new Set(downloadRecords.map(r => r.projectId))
    return projects.filter(p => projectSet.has(p.id))
  }, [downloadRecords, projects])

  const filteredRecords = useMemo(() => {
    let records = [...downloadRecords]
    
    if (filterProject !== 'all') {
      records = records.filter(r => r.projectId === filterProject)
    }
    
    if (filterStatus !== 'all') {
      records = records.filter(r => r.status === filterStatus)
    }
    
    records.sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.downloadedAt - a.downloadedAt 
        : a.downloadedAt - b.downloadedAt
    })
    
    return records
  }, [downloadRecords, filterProject, filterStatus, sortOrder])

  return (
    <div className="downloads-page">
      <div className="page-header">
        <h2>下载记录</h2>
        <span className="record-count">共 {filteredRecords.length} 条记录</span>
      </div>

      {downloadRecords.length > 0 && (
        <div className="filter-bar">
          <div className="filter-group">
            <label className="filter-label">项目</label>
            <select 
              className="select filter-select" 
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
            >
              <option value="all">全部项目</option>
              {projectOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">状态</label>
            <select 
              className="select filter-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">全部状态</option>
              <option value="downloading">下载中</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">排序</label>
            <select 
              className="select filter-select"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'desc' | 'asc')}
            >
              <option value="desc">时间倒序</option>
              <option value="asc">时间正序</option>
            </select>
          </div>
        </div>
      )}

      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📥</div>
          <div className="empty-text">暂无下载记录</div>
          <div className="empty-desc">
            {downloadRecords.length > 0 ? '当前筛选条件下没有记录' : '从流水线详情页下载产物后，记录会显示在这里'}
          </div>
        </div>
      ) : (
        <div className="downloads-list">
          {filteredRecords.map(record => {
            const project = getProjectInfo(record.projectId)
            return (
              <div 
                key={record.id} 
                className={`download-item download-${record.status}`}
                onClick={() => handleRecordClick(record)}
              >
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
                <div className="download-actions" onClick={e => e.stopPropagation()}>
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
