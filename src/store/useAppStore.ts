import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Pipeline, ApprovalItem, NotificationItem, UserAccount, AppSettings, LocalTriggerRecord, BuildLogLine, DownloadRecord, Artifact } from '../types'
import { ciApi } from '../api'

interface AppState {
  projects: Project[]
  selectedProjectId: string | null
  selectedBranch: string
  selectedPipelineId: string | null
  pipelines: Pipeline[]
  latestPipelines: Record<string, Pipeline>
  approvals: ApprovalItem[]
  notifications: NotificationItem[]
  accounts: UserAccount[]
  triggerRecords: LocalTriggerRecord[]
  downloadRecords: DownloadRecord[]
  settings: AppSettings
  currentView: 'projects' | 'pipeline-detail' | 'approvals' | 'notifications' | 'settings'
  isLoading: boolean
  error: string | null
  buildLogs: BuildLogLine[]
  logSearchKeyword: string

  setSelectedProject: (projectId: string) => void
  setSelectedBranch: (branch: string) => void
  setSelectedPipeline: (pipelineId: string | null) => void
  openPipelineDetail: (pipelineId: string, projectId: string) => void
  setCurrentView: (view: AppState['currentView']) => void
  setLogSearchKeyword: (keyword: string) => void

  fetchProjects: () => Promise<void>
  fetchLatestPipelines: () => Promise<void>
  fetchPipelines: (projectId: string, branch?: string) => Promise<void>
  fetchPipelineDetail: (pipelineId: string) => Promise<void>
  addProject: (project: Omit<Project, 'id' | 'isFavorite' | 'branches'> & { branches?: string[] }) => void
  triggerBuild: (projectId: string, branch: string) => Promise<Pipeline | null>
  cancelBuild: (pipelineId: string) => Promise<boolean>
  fetchApprovals: () => Promise<void>
  approveApproval: (approvalId: string) => Promise<boolean>
  rejectApproval: (approvalId: string, reason: string) => Promise<boolean>
  fetchNotifications: () => Promise<void>
  markNotificationRead: (notificationId: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  fetchAccounts: () => Promise<void>
  switchAccount: (accountId: string) => Promise<void>
  addAccount: (account: Omit<UserAccount, 'id' | 'isActive'>) => Promise<void>
  fetchTriggerRecords: () => Promise<void>
  toggleFavorite: (projectId: string) => Promise<void>
  fetchBuildLogs: (pipelineId: string, jobId?: string) => Promise<void>
  searchBuildLogs: (pipelineId: string, keyword: string) => Promise<void>
  downloadArtifact: (artifactId: string) => Promise<boolean>
  startDownload: (artifact: Artifact, pipeline: Pipeline) => Promise<boolean>
  retryDownload: (recordId: string) => Promise<boolean>
  updateDownloadRecord: (recordId: string, updates: Partial<DownloadRecord>) => void

  updateSettings: (settings: Partial<AppSettings>) => void
  copyBuildLink: (pipelineId: string) => void
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  refreshInterval: 30,
  showSuccessNotification: true,
  showFailureNotification: true,
  failureSound: true,
  successSound: false,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  },
  autoStart: true,
  minimizeToTray: true,
  defaultBranchFilter: 'all',
  showOnlyFavorites: false
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      selectedProjectId: null,
      selectedBranch: 'all',
      selectedPipelineId: null,
      pipelines: [],
      latestPipelines: {},
      approvals: [],
      notifications: [],
      accounts: [],
      triggerRecords: [],
      downloadRecords: [],
      settings: defaultSettings,
      currentView: 'projects',
      isLoading: false,
      error: null,
      buildLogs: [],
      logSearchKeyword: '',

      setSelectedProject: (projectId) => {
        set({ selectedProjectId: projectId, selectedBranch: 'all' })
        if (projectId) {
          get().fetchPipelines(projectId)
        }
      },

      setSelectedBranch: (branch) => {
        set({ selectedBranch: branch })
        const { selectedProjectId } = get()
        if (selectedProjectId) {
          get().fetchPipelines(selectedProjectId, branch === 'all' ? undefined : branch)
        }
      },

      setSelectedPipeline: (pipelineId) => {
        set({ selectedPipelineId: pipelineId })
        if (pipelineId) {
          get().fetchPipelineDetail(pipelineId)
        }
      },

      openPipelineDetail: async (pipelineId, projectId) => {
        set({ selectedProjectId: projectId, selectedBranch: 'all' })
        await get().fetchPipelines(projectId)
        set({ selectedPipelineId: pipelineId, currentView: 'pipeline-detail' })
        await get().fetchPipelineDetail(pipelineId)
        await get().fetchBuildLogs(pipelineId)
      },

      setCurrentView: (view) => set({ currentView: view }),
      setLogSearchKeyword: (keyword) => set({ logSearchKeyword: keyword }),

      fetchProjects: async () => {
        set({ isLoading: true, error: null })
        try {
          const { projects: existingProjects } = get()
          if (existingProjects.length > 0) {
            set({ isLoading: false })
            if (!get().selectedProjectId && existingProjects.length > 0) {
              get().setSelectedProject(existingProjects[0].id)
            }
            get().fetchLatestPipelines()
            return
          }
          const projects = await ciApi.getProjects()
          set({ projects, isLoading: false })
          if (!get().selectedProjectId && projects.length > 0) {
            get().setSelectedProject(projects[0].id)
          }
          get().fetchLatestPipelines()
        } catch (error) {
          set({ error: '加载项目失败', isLoading: false })
        }
      },

      addProject: (projectData) => {
        const { projects } = get()
        const newProject: Project = {
          id: `proj-${Date.now()}`,
          name: projectData.name,
          description: projectData.description || '',
          repoUrl: projectData.repoUrl,
          ciPlatform: projectData.ciPlatform,
          defaultBranch: projectData.defaultBranch,
          branches: projectData.branches || [projectData.defaultBranch],
          isFavorite: false
        }
        const updatedProjects = [...projects, newProject]
        set({ projects: updatedProjects })
        if (updatedProjects.length === 1) {
          get().setSelectedProject(newProject.id)
        }
      },

      fetchLatestPipelines: async () => {
        try {
          const { projects } = get()
          const latestMap: Record<string, Pipeline> = {}
          for (const project of projects) {
            const pipelines = await ciApi.getPipelines(project.id)
            if (pipelines.length > 0) {
              latestMap[project.id] = pipelines[0]
            }
          }
          set({ latestPipelines: latestMap })
        } catch (error) {
          // 静默失败，不影响主流程
        }
      },

      fetchPipelines: async (projectId, branch) => {
        set({ isLoading: true, error: null })
        try {
          const pipelines = await ciApi.getPipelines(projectId, branch === 'all' ? undefined : branch)
          set({ pipelines, isLoading: false })
        } catch (error) {
          set({ error: '加载流水线失败', isLoading: false })
        }
      },

      fetchPipelineDetail: async (pipelineId) => {
        set({ isLoading: true, error: null })
        try {
          const pipeline = await ciApi.getPipeline(pipelineId)
          if (pipeline) {
            const { pipelines } = get()
            const updatedPipelines = pipelines.map(p => 
              p.id === pipelineId ? pipeline : p
            )
            set({ pipelines: updatedPipelines, isLoading: false })
          }
        } catch (error) {
          set({ error: '加载流水线详情失败', isLoading: false })
        }
      },

      triggerBuild: async (projectId, branch) => {
        try {
          const pipeline = await ciApi.triggerBuild(projectId, branch)
          const { pipelines, triggerRecords, projects, notifications } = get()
          
          const project = projects.find(p => p.id === projectId)
          const pipelineWithProjectName = project 
            ? { ...pipeline, projectName: project.name }
            : pipeline
          
          set({ pipelines: [pipelineWithProjectName, ...pipelines] })
          
          const newRecord: LocalTriggerRecord = {
            id: `trig-${Date.now()}`,
            projectId,
            projectName: project?.name || pipeline.projectName,
            branch,
            triggeredAt: Date.now(),
            status: 'pending',
            pipelineId: pipeline.id
          }
          set({ triggerRecords: [newRecord, ...triggerRecords] })
          
          if (project) {
            const newNotif = {
              id: `notif-${Date.now()}`,
              type: 'build_success' as const,
              title: `构建已触发 - ${project.name}`,
              message: `${branch} 分支手动触发构建`,
              projectId,
              projectName: project.name,
              pipelineId: pipeline.id,
              timestamp: Date.now(),
              read: false,
              sound: false
            }
            set({ notifications: [newNotif, ...notifications] })
          }
          
          return pipelineWithProjectName
        } catch (error) {
          set({ error: '触发构建失败' })
          return null
        }
      },

      cancelBuild: async (pipelineId) => {
        try {
          const result = await ciApi.cancelPipeline(pipelineId)
          if (result) {
            const { pipelines, triggerRecords } = get()
            const updatedPipelines = pipelines.map(p => {
              if (p.id === pipelineId) {
                return { ...p, status: 'canceled' as const }
              }
              return p
            })
            const updatedTriggerRecords = triggerRecords.map(r => {
              if (r.pipelineId === pipelineId) {
                return { ...r, status: 'canceled' as const }
              }
              return r
            })
            set({ pipelines: updatedPipelines, triggerRecords: updatedTriggerRecords })
          }
          return result
        } catch (error) {
          set({ error: '取消构建失败' })
          return false
        }
      },

      fetchApprovals: async () => {
        set({ isLoading: true, error: null })
        try {
          const approvals = await ciApi.getApprovals()
          set({ approvals, isLoading: false })
        } catch (error) {
          set({ error: '加载审批失败', isLoading: false })
        }
      },

      approveApproval: async (approvalId) => {
        try {
          const result = await ciApi.approvePipeline(approvalId)
          if (result) {
            const { approvals } = get()
            const updatedApprovals = approvals.map(a => 
              a.id === approvalId ? { ...a, status: 'approved' as const } : a
            )
            set({ approvals: updatedApprovals })
          }
          return result
        } catch (error) {
          set({ error: '审批失败' })
          return false
        }
      },

      rejectApproval: async (approvalId, reason) => {
        try {
          const result = await ciApi.rejectPipeline(approvalId, reason)
          if (result) {
            const { approvals } = get()
            const updatedApprovals = approvals.map(a => 
              a.id === approvalId ? { ...a, status: 'rejected' as const } : a
            )
            set({ approvals: updatedApprovals })
          }
          return result
        } catch (error) {
          set({ error: '驳回失败' })
          return false
        }
      },

      fetchNotifications: async () => {
        set({ isLoading: true, error: null })
        try {
          const notifications = await ciApi.getNotifications()
          set({ notifications, isLoading: false })
        } catch (error) {
          set({ error: '加载通知失败', isLoading: false })
        }
      },

      markNotificationRead: async (notificationId) => {
        try {
          await ciApi.markNotificationRead(notificationId)
          const { notifications } = get()
          const updated = notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
          set({ notifications: updated })
        } catch (error) {
          // ignore
        }
      },

      markAllNotificationsRead: async () => {
        try {
          await ciApi.markAllNotificationsRead()
          const { notifications } = get()
          const updated = notifications.map(n => ({ ...n, read: true }))
          set({ notifications: updated })
        } catch (error) {
          // ignore
        }
      },

      fetchAccounts: async () => {
        try {
          const accounts = await ciApi.getAccounts()
          set({ accounts })
        } catch (error) {
          set({ error: '加载账号失败' })
        }
      },

      switchAccount: async (accountId) => {
        try {
          await ciApi.switchAccount(accountId)
          const { accounts } = get()
          const updated = accounts.map(a => ({
            ...a,
            isActive: a.id === accountId
          }))
          set({ accounts: updated })
        } catch (error) {
          set({ error: '切换账号失败' })
        }
      },

      addAccount: async (account) => {
        try {
          const newAccount = await ciApi.addAccount(account)
          const { accounts } = get()
          set({ accounts: [...accounts, newAccount] })
        } catch (error) {
          set({ error: '添加账号失败' })
        }
      },

      fetchTriggerRecords: async () => {
        try {
          const records = await ciApi.getLocalTriggerRecords()
          set({ triggerRecords: records })
        } catch (error) {
          set({ error: '加载触发记录失败' })
        }
      },

      toggleFavorite: async (projectId) => {
        try {
          const { projects } = get()
          const updated = projects.map(p => 
            p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p
          )
          set({ projects: updated })
          await ciApi.toggleFavorite(projectId)
        } catch (error) {
          set({ error: '操作失败' })
        }
      },

      fetchBuildLogs: async (pipelineId, jobId) => {
        set({ isLoading: true, error: null })
        try {
          const logs = await ciApi.getBuildLogs(pipelineId, jobId)
          set({ buildLogs: logs, isLoading: false })
        } catch (error) {
          set({ error: '加载日志失败', isLoading: false })
        }
      },

      searchBuildLogs: async (pipelineId, keyword) => {
        set({ isLoading: true, logSearchKeyword: keyword })
        try {
          const logs = await ciApi.searchLogs(pipelineId, keyword)
          set({ buildLogs: logs, isLoading: false })
        } catch (error) {
          set({ error: '搜索日志失败', isLoading: false })
        }
      },

      downloadArtifact: async (artifactId) => {
        try {
          return await ciApi.downloadArtifact(artifactId)
        } catch (error) {
          set({ error: '下载失败' })
          return false
        }
      },

      startDownload: async (artifact, pipeline) => {
        const { downloadRecords } = get()
        const now = Date.now()
        
        const isValidUrl = artifact.downloadUrl && artifact.downloadUrl !== '#' && artifact.downloadUrl !== ''
        
        const newRecord: DownloadRecord = {
          id: `dl-${now}`,
          artifactId: artifact.id,
          artifactName: artifact.name,
          projectId: pipeline.projectId,
          projectName: pipeline.projectName,
          pipelineId: pipeline.id,
          downloadUrl: artifact.downloadUrl,
          size: artifact.size,
          status: isValidUrl ? 'downloading' : 'failed',
          downloadedAt: now,
          errorMessage: isValidUrl ? undefined : '下载链接不可用'
        }
        
        set({ downloadRecords: [newRecord, ...downloadRecords] })
        
        if (!isValidUrl) {
          return false
        }
        
        if (window.electronAPI && artifact.downloadUrl) {
          window.electronAPI.downloadFile(artifact.downloadUrl, artifact.name)
        }
        
        setTimeout(() => {
          const { downloadRecords: currentRecords } = get()
          const updated = currentRecords.map(r => {
            if (r.id === newRecord.id) {
              const success = Math.random() > 0.2
              return {
                ...r,
                status: success ? 'success' as const : 'failed' as const,
                errorMessage: success ? undefined : '下载失败，请重试'
              }
            }
            return r
          })
          set({ downloadRecords: updated })
        }, 1500)
        
        return true
      },

      retryDownload: async (recordId) => {
        const { downloadRecords } = get()
        const record = downloadRecords.find(r => r.id === recordId)
        if (!record) return false
        
        const isValidUrl = record.downloadUrl && record.downloadUrl !== '#' && record.downloadUrl !== ''
        if (!isValidUrl) {
          const updated = downloadRecords.map(r => 
            r.id === recordId 
              ? { ...r, status: 'failed' as const, errorMessage: '下载链接不可用' } 
              : r
          )
          set({ downloadRecords: updated })
          return false
        }
        
        const updated = downloadRecords.map(r => 
          r.id === recordId 
            ? { ...r, status: 'downloading' as const, errorMessage: undefined, downloadedAt: Date.now() } 
            : r
        )
        set({ downloadRecords: updated })
        
        if (window.electronAPI && record.downloadUrl) {
          window.electronAPI.downloadFile(record.downloadUrl, record.artifactName)
        }
        
        setTimeout(() => {
          const { downloadRecords: currentRecords } = get()
          const finalUpdated = currentRecords.map(r => {
            if (r.id === recordId) {
              const success = Math.random() > 0.2
              return {
                ...r,
                status: success ? 'success' as const : 'failed' as const,
                errorMessage: success ? undefined : '下载失败，请重试'
              }
            }
            return r
          })
          set({ downloadRecords: finalUpdated })
        }, 1500)
        
        return true
      },

      updateDownloadRecord: (recordId, updates) => {
        const { downloadRecords } = get()
        const updated = downloadRecords.map(r => 
          r.id === recordId ? { ...r, ...updates } : r
        )
        set({ downloadRecords: updated })
      },

      updateSettings: (newSettings) => {
        const { settings } = get()
        set({ settings: { ...settings, ...newSettings } })
      },

      copyBuildLink: (pipelineId) => {
        const link = `https://ci.example.com/pipelines/${pipelineId}`
        if ((window as any).electronAPI) {
          (window as any).electronAPI.copyToClipboard(link)
        } else {
          navigator.clipboard.writeText(link)
        }
      }
    }),
    {
      name: 'ci-tray-tool-storage',
      partialize: (state) => ({
        projects: state.projects,
        settings: state.settings,
        accounts: state.accounts,
        triggerRecords: state.triggerRecords,
        downloadRecords: state.downloadRecords
      })
    }
  )
)
