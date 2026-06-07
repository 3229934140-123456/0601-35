export type BuildStatus = 'success' | 'failed' | 'running' | 'pending' | 'canceled' | 'skipped'

export type PipelineType = 'ci' | 'cd' | 'release'

export interface Project {
  id: string
  name: string
  description: string
  repoUrl: string
  avatar?: string
  branches: string[]
  defaultBranch: string
  isFavorite: boolean
  ciPlatform: 'gitlab' | 'github' | 'jenkins' | 'coding'
}

export interface Pipeline {
  id: string
  projectId: string
  projectName: string
  branch: string
  status: BuildStatus
  type: PipelineType
  commit: {
    sha: string
    message: string
    author: string
    authorAvatar?: string
    timestamp: number
  }
  stages: PipelineStage[]
  startedAt?: number
  finishedAt?: number
  duration?: number
  triggeredBy: string
  triggeredByAvatar?: string
  triggerType: 'manual' | 'push' | 'schedule' | 'merge_request'
  artifacts?: Artifact[]
  hasApproval?: boolean
  approvalStatus?: 'pending' | 'approved' | 'rejected'
}

export interface PipelineStage {
  id: string
  slug: string
  name: string
  status: BuildStatus
  startedAt?: number
  finishedAt?: number
  duration?: number
  jobs: PipelineJob[]
}

export interface PipelineJob {
  id: string
  slug: string
  name: string
  status: BuildStatus
  startedAt?: number
  finishedAt?: number
  duration?: number
  runner?: string
}

export interface Artifact {
  id: string
  name: string
  size: number
  downloadUrl: string
  createdAt: number
}

export interface BuildLogLine {
  timestamp?: number
  level: 'info' | 'warn' | 'error' | 'debug'
  stage: string
  message: string
}

export interface ApprovalItem {
  id: string
  pipelineId: string
  projectId: string
  projectName: string
  title: string
  description: string
  branch: string
  version?: string
  submitter: string
  submitterAvatar?: string
  submittedAt: number
  status: 'pending' | 'approved' | 'rejected'
  approvers: string[]
  approvedBy?: string[]
  rejectedBy?: string
}

export interface NotificationItem {
  id: string
  type: 'build_success' | 'build_failed' | 'approval_required' | 'build_canceled'
  title: string
  message: string
  projectId: string
  projectName: string
  pipelineId?: string
  timestamp: number
  read: boolean
  sound?: boolean
}

export interface UserAccount {
  id: string
  username: string
  email: string
  avatar?: string
  platform: 'gitlab' | 'github' | 'jenkins' | 'coding'
  isActive: boolean
  token: string
}

export interface AppSettings {
  theme: 'light' | 'dark'
  refreshInterval: number
  showSuccessNotification: boolean
  showFailureNotification: boolean
  failureSound: boolean
  successSound: boolean
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  autoStart: boolean
  minimizeToTray: boolean
  defaultBranchFilter: string
  showOnlyFavorites: boolean
}

export interface LocalTriggerRecord {
  id: string
  projectId: string
  projectName: string
  branch: string
  triggeredAt: number
  status: BuildStatus
  pipelineId: string
}

export interface DownloadRecord {
  id: string
  artifactId: string
  artifactName: string
  projectId: string
  projectName: string
  pipelineId: string
  downloadUrl: string
  size: number
  status: 'downloading' | 'success' | 'failed'
  downloadedAt: number
  errorMessage?: string
}
