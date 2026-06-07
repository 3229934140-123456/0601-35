import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Pipeline, ApprovalItem, NotificationItem, UserAccount, AppSettings, LocalTriggerRecord, BuildLogLine } from '../types'
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
  settings: AppSettings
  currentView: 'projects' | 'pipeline-detail' | 'approvals' | 'notifications' | 'settings'
  isLoading: boolean
  error: string | null
  buildLogs: BuildLogLine[]
  logSearchKeyword: string

  setSelectedProject: (projectId: string) => void
  setSelectedBranch: (branch: string) => void
  setSelectedPipeline: (pipelineId: string | null) => void
  setCurrentView: (view: AppState['currentView']) => void
  setLogSearchKeyword: (keyword: string) => void

  fetchProjects: () => Promise<void>
  fetchLatestPipelines: () => Promise<void>
  fetchPipelines: (projectId: string, branch?: string) => Promise<void>
  fetchPipelineDetail: (pipelineId: string) => Promise<void>
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

      setCurrentView: (view) => set({ currentView: view }),
      setLogSearchKeyword: (keyword) => set({ logSearchKeyword: keyword }),

      fetchProjects: async () => {
        set({ isLoading: true, error: null })
        try {
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
          const { pipelines, triggerRecords } = get()
          set({ pipelines: [pipeline, ...pipelines] })
          
          const newRecord: LocalTriggerRecord = {
            id: `trig-${Date.now()}`,
            projectId,
            projectName: pipeline.projectName,
            branch,
            triggeredAt: Date.now(),
            status: 'pending',
            pipelineId: pipeline.id
          }
          set({ triggerRecords: [newRecord, ...triggerRecords] })
          return pipeline
        } catch (error) {
          set({ error: '触发构建失败' })
          return null
        }
      },

      cancelBuild: async (pipelineId) => {
        try {
          const result = await ciApi.cancelPipeline(pipelineId)
          if (result) {
            const { pipelines } = get()
            const updatedPipelines = pipelines.map(p => {
              if (p.id === pipelineId) {
                return { ...p, status: 'canceled' as const }
              }
              return p
            })
            set({ pipelines: updatedPipelines })
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
          await ciApi.toggleFavorite(projectId)
          const { projects } = get()
          const updated = projects.map(p => 
            p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p
          )
          set({ projects: updated })
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
        settings: state.settings,
        accounts: state.accounts,
        triggerRecords: state.triggerRecords
      })
    }
  )
)
