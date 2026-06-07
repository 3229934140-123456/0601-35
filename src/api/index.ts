import { mockProjects, mockPipelines, mockApprovals, mockNotifications, mockAccounts, mockTriggerRecords, mockBuildLogs } from '../mock'
import type { Project, Pipeline, ApprovalItem, NotificationItem, UserAccount, LocalTriggerRecord, BuildLogLine, BuildStatus } from '../types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const ciApi = {
  async getProjects(): Promise<Project[]> {
    await delay(300)
    return mockProjects
  },

  async getPipelines(projectId: string, branch?: string): Promise<Pipeline[]> {
    await delay(400)
    let pipelines = mockPipelines[projectId] || []
    if (branch) {
      pipelines = pipelines.filter(p => p.branch === branch)
    }
    return [...pipelines].sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
  },

  async getPipeline(pipelineId: string): Promise<Pipeline | null> {
    await delay(200)
    for (const projectId of Object.keys(mockPipelines)) {
      const pipeline = mockPipelines[projectId].find(p => p.id === pipelineId)
      if (pipeline) return pipeline
    }
    return null
  },

  async triggerBuild(projectId: string, branch: string): Promise<Pipeline> {
    await delay(500)
    const now = Date.now()
    const newPipeline: Pipeline = {
      id: `pipe-manual-${now}`,
      projectId,
      projectName: mockProjects.find(p => p.id === projectId)?.name || '',
      branch,
      status: 'pending',
      type: 'ci',
      commit: {
        sha: `manual-${now.toString(36)}`,
        message: '手动触发构建',
        author: '当前用户',
        timestamp: now
      },
      stages: [
        { id: 's1', slug: 'build', name: '构建', status: 'pending', jobs: [{ id: 'j1', slug: 'build', name: 'build', status: 'pending' }] },
        { id: 's2', slug: 'test', name: '测试', status: 'pending', jobs: [{ id: 'j2', slug: 'test', name: 'test', status: 'pending' }] },
        { id: 's3', slug: 'deploy', name: '部署', status: 'pending', jobs: [{ id: 'j3', slug: 'deploy', name: 'deploy', status: 'pending' }] }
      ],
      startedAt: now,
      triggeredBy: '当前用户',
      triggerType: 'manual'
    }
    if (!mockPipelines[projectId]) {
      mockPipelines[projectId] = []
    }
    mockPipelines[projectId].unshift(newPipeline)
    return newPipeline
  },

  async cancelPipeline(pipelineId: string): Promise<boolean> {
    await delay(300)
    for (const projectId of Object.keys(mockPipelines)) {
      const pipeline = mockPipelines[projectId].find(p => p.id === pipelineId)
      if (pipeline) {
        pipeline.status = 'canceled'
        pipeline.stages.forEach(s => {
          if (s.status === 'running' || s.status === 'pending') s.status = 'canceled'
          s.jobs.forEach(j => {
            if (j.status === 'running' || j.status === 'pending') j.status = 'canceled'
          })
        })
        pipeline.finishedAt = Date.now()
        return true
      }
    }
    return false
  },

  async getBuildLogs(pipelineId: string, jobId?: string): Promise<BuildLogLine[]> {
    await delay(500)
    return mockBuildLogs.map((log, idx) => ({
      ...log,
      level: log.level as BuildLogLine['level'],
      timestamp: Date.now() - (mockBuildLogs.length - idx) * 5000
    }))
  },

  async getApprovals(): Promise<ApprovalItem[]> {
    await delay(300)
    return mockApprovals
  },

  async approvePipeline(approvalId: string): Promise<boolean> {
    await delay(400)
    const approval = mockApprovals.find(a => a.id === approvalId)
    if (approval) {
      approval.status = 'approved'
      approval.approvedBy = [...(approval.approvedBy || []), '当前用户']
      return true
    }
    return false
  },

  async rejectPipeline(approvalId: string, reason: string): Promise<boolean> {
    await delay(400)
    const approval = mockApprovals.find(a => a.id === approvalId)
    if (approval) {
      approval.status = 'rejected'
      approval.rejectedBy = '当前用户'
      return true
    }
    return false
  },

  async getNotifications(): Promise<NotificationItem[]> {
    await delay(200)
    return mockNotifications
  },

  async markNotificationRead(notificationId: string): Promise<boolean> {
    await delay(100)
    const notif = mockNotifications.find(n => n.id === notificationId)
    if (notif) {
      notif.read = true
      return true
    }
    return false
  },

  async markAllNotificationsRead(): Promise<boolean> {
    await delay(100)
    mockNotifications.forEach(n => n.read = true)
    return true
  },

  async getAccounts(): Promise<UserAccount[]> {
    await delay(200)
    return mockAccounts
  },

  async switchAccount(accountId: string): Promise<boolean> {
    await delay(300)
    mockAccounts.forEach(acc => {
      acc.isActive = acc.id === accountId
    })
    return true
  },

  async addAccount(account: Omit<UserAccount, 'id' | 'isActive'>): Promise<UserAccount> {
    await delay(400)
    const newAccount: UserAccount = {
      ...account,
      id: `acc-${Date.now()}`,
      isActive: false
    }
    mockAccounts.push(newAccount)
    return newAccount
  },

  async getLocalTriggerRecords(): Promise<LocalTriggerRecord[]> {
    await delay(200)
    return mockTriggerRecords
  },

  async toggleFavorite(projectId: string): Promise<boolean> {
    await delay(150)
    const project = mockProjects.find(p => p.id === projectId)
    if (project) {
      project.isFavorite = !project.isFavorite
      return true
    }
    return false
  },

  async downloadArtifact(artifactId: string): Promise<boolean> {
    await delay(500)
    return true
  },

  async searchLogs(pipelineId: string, keyword: string): Promise<BuildLogLine[]> {
    await delay(200)
    const logs = await this.getBuildLogs(pipelineId)
    if (!keyword) return logs
    return logs.filter(log => 
      log.message.toLowerCase().includes(keyword.toLowerCase())
    )
  }
}
