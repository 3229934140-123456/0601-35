import { useState, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatTime, formatDuration, getStatusColor, getPlatformIcon, truncateText } from '../utils'
import PipelineCard from './PipelineCard'
import './ProjectList.css'

export default function ProjectList() {
  const { 
    projects, 
    pipelines, 
    latestPipelines,
    selectedProjectId, 
    selectedBranch,
    setSelectedProject, 
    setSelectedBranch,
    toggleFavorite,
    triggerBuild,
    addProject,
    isLoading,
    settings
  } = useAppStore()

  const [showBranchFilter, setShowBranchFilter] = useState(false)
  const [triggerModalOpen, setTriggerModalOpen] = useState(false)
  const [triggerBranch, setTriggerBranch] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    repoUrl: '',
    ciPlatform: 'gitlab' as 'gitlab' | 'github' | 'jenkins' | 'coding',
    defaultBranch: 'main',
    description: ''
  })

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  
  const filteredProjects = useMemo(() => {
    if (settings.showOnlyFavorites) {
      return projects.filter(p => p.isFavorite)
    }
    return projects
  }, [projects, settings.showOnlyFavorites])

  const getLatestPipeline = (projectId: string) => {
    return latestPipelines[projectId]
  }

  const handleTriggerBuild = () => {
    if (selectedProjectId && triggerBranch) {
      triggerBuild(selectedProjectId, triggerBranch)
      setTriggerModalOpen(false)
      setTriggerBranch('')
    }
  }

  const openTriggerModal = () => {
    if (selectedProject) {
      setTriggerBranch(selectedProject.defaultBranch)
      setTriggerModalOpen(true)
    }
  }

  const handleAddProject = () => {
    if (newProject.name.trim() && newProject.repoUrl.trim() && newProject.defaultBranch.trim()) {
      addProject({
        name: newProject.name.trim(),
        repoUrl: newProject.repoUrl.trim(),
        ciPlatform: newProject.ciPlatform,
        defaultBranch: newProject.defaultBranch.trim(),
        description: newProject.description.trim()
      })
      setAddModalOpen(false)
      setNewProject({
        name: '',
        repoUrl: '',
        ciPlatform: 'gitlab',
        defaultBranch: 'main',
        description: ''
      })
    }
  }

  const canAddProject = newProject.name.trim() && newProject.repoUrl.trim() && newProject.defaultBranch.trim()

  return (
    <div className="project-list-page">
      <div className="projects-sidebar">
        <div className="projects-header">
          <h3 className="projects-title">项目列表</h3>
          <button className="btn btn-ghost btn-sm" title="添加项目" onClick={() => setAddModalOpen(true)}>
            ＋
          </button>
        </div>
        <div className="projects-list">
          {filteredProjects.map(project => {
            const latest = getLatestPipeline(project.id)
            const isSelected = project.id === selectedProjectId
            return (
              <div
                key={project.id}
                className={`project-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedProject(project.id)}
              >
                <div className="project-icon" style={{ background: getStatusColor(latest?.status || 'pending') + '20' }}>
                  <span style={{ color: getStatusColor(latest?.status || 'pending') }}>
                    {getPlatformIcon(project.ciPlatform)}
                  </span>
                </div>
                <div className="project-info">
                  <div className="project-name-row">
                    <span className="project-name" title={project.name}>
                      {truncateText(project.name, 18)}
                    </span>
                    <button
                      className={`favorite-btn ${project.isFavorite ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(project.id)
                      }}
                      title={project.isFavorite ? '取消关注' : '标记关注'}
                    >
                      {project.isFavorite ? '⭐' : '☆'}
                    </button>
                  </div>
                  <div className="project-status">
                    {latest ? (
                      <>
                        <span className="status-dot" style={{ background: getStatusColor(latest.status) }} />
                        <span className="status-text">{formatTime(latest.startedAt)}</span>
                      </>
                    ) : (
                      <span className="text-muted">暂无构建</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pipelines-content">
        <div className="pipelines-header">
          <div className="pipelines-header-left">
            <h2 className="page-title">
              {selectedProject ? selectedProject.name : '选择项目'}
            </h2>
            {selectedProject && (
              <div className="branch-filter">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowBranchFilter(!showBranchFilter)}
                >
                  🌿 {selectedBranch === 'all' ? '全部分支' : selectedBranch}
                  <span style={{ marginLeft: '4px' }}>▼</span>
                </button>
                {showBranchFilter && selectedProject && (
                  <div className="branch-dropdown">
                    <div 
                      className={`branch-option ${selectedBranch === 'all' ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedBranch('all')
                        setShowBranchFilter(false)
                      }}
                    >
                      全部分支
                    </div>
                    {selectedProject.branches.map(branch => (
                      <div
                        key={branch}
                        className={`branch-option ${selectedBranch === branch ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedBranch(branch)
                          setShowBranchFilter(false)
                        }}
                      >
                        🌿 {branch}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="pipelines-header-actions">
            <button 
              className="btn btn-primary btn-sm"
              onClick={openTriggerModal}
              disabled={!selectedProject}
            >
              ▶ 触发构建
            </button>
          </div>
        </div>

        <div className="pipelines-list">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <span>加载中...</span>
            </div>
          ) : pipelines.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">暂无流水线记录</div>
            </div>
          ) : (
            pipelines.map(pipeline => (
              <PipelineCard key={pipeline.id} pipeline={pipeline} />
            ))
          )}
        </div>
      </div>

      {triggerModalOpen && selectedProject && (
        <div className="modal-overlay" onClick={() => setTriggerModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>手动触发构建</h3>
              <button className="modal-close" onClick={() => setTriggerModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>项目</label>
                <div className="form-value">{selectedProject.name}</div>
              </div>
              <div className="form-group">
                <label>选择分支</label>
                <select 
                  className="select" 
                  value={triggerBranch}
                  onChange={e => setTriggerBranch(e.target.value)}
                >
                  {selectedProject.branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setTriggerModalOpen(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleTriggerBuild} disabled={!triggerBranch}>
                触发构建
              </button>
            </div>
          </div>
        </div>
      )}

      {addModalOpen && (
        <div className="modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>绑定新项目</h3>
              <button className="modal-close" onClick={() => setAddModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>项目名称 <span className="required">*</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入项目名称"
                  value={newProject.name}
                  onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>仓库地址 <span className="required">*</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="https://gitlab.example.com/team/project"
                  value={newProject.repoUrl}
                  onChange={e => setNewProject({ ...newProject, repoUrl: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>CI 平台 <span className="required">*</span></label>
                  <select 
                    className="select"
                    value={newProject.ciPlatform}
                    onChange={e => setNewProject({ ...newProject, ciPlatform: e.target.value as any })}
                  >
                    <option value="gitlab">🦊 GitLab</option>
                    <option value="github">🐙 GitHub</option>
                    <option value="jenkins">👷 Jenkins</option>
                    <option value="coding">💻 Coding</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>默认分支 <span className="required">*</span></label>
                  <input
                    type="text"
                    className="input"
                    placeholder="main"
                    value={newProject.defaultBranch}
                    onChange={e => setNewProject({ ...newProject, defaultBranch: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>项目描述</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="项目描述（可选）"
                  value={newProject.description}
                  onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAddModalOpen(false)}>取消</button>
              <button 
                className="btn btn-primary" 
                onClick={handleAddProject} 
                disabled={!canAddProject}
              >
                绑定项目
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
