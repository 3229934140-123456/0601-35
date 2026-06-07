import type { Project, Pipeline, ApprovalItem, UserAccount, NotificationItem, LocalTriggerRecord } from '../types'

export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'frontend-web-app',
    description: '前端 Web 应用主项目',
    repoUrl: 'https://gitlab.example.com/team/frontend-web-app',
    branches: ['main', 'develop', 'feature/auth', 'feature/payment', 'hotfix/v1.2.1'],
    defaultBranch: 'main',
    isFavorite: true,
    ciPlatform: 'gitlab'
  },
  {
    id: 'proj-002',
    name: 'backend-api-service',
    description: '后端 API 服务',
    repoUrl: 'https://gitlab.example.com/team/backend-api-service',
    branches: ['main', 'develop', 'feature/user-module', 'release/v2.0'],
    defaultBranch: 'main',
    isFavorite: true,
    ciPlatform: 'gitlab'
  },
  {
    id: 'proj-003',
    name: 'mobile-app',
    description: '移动端应用',
    repoUrl: 'https://github.com/team/mobile-app',
    branches: ['main', 'develop', 'feature/dark-mode', 'feature/push-notification'],
    defaultBranch: 'main',
    isFavorite: false,
    ciPlatform: 'github'
  },
  {
    id: 'proj-004',
    name: 'data-pipeline',
    description: '数据处理流水线',
    repoUrl: 'https://jenkins.example.com/job/data-pipeline',
    branches: ['main', 'feature/ml-model', 'develop'],
    defaultBranch: 'main',
    isFavorite: false,
    ciPlatform: 'jenkins'
  },
  {
    id: 'proj-005',
    name: 'admin-console',
    description: '管理后台控制台',
    repoUrl: 'https://gitlab.example.com/team/admin-console',
    branches: ['main', 'develop', 'feature/permission', 'release/v1.5'],
    defaultBranch: 'main',
    isFavorite: true,
    ciPlatform: 'gitlab'
  }
]

const now = Date.now()

export const mockPipelines: Record<string, Pipeline[]> = {
  'proj-001': [
    {
      id: 'pipe-001',
      projectId: 'proj-001',
      projectName: 'frontend-web-app',
      branch: 'main',
      status: 'success',
      type: 'ci',
      commit: {
        sha: 'a1b2c3d4e5f6',
        message: 'fix: 修复登录页面样式问题\n更新依赖包版本',
        author: '张三',
        timestamp: now - 3600000
      },
      stages: [
        {
          id: 'stage-1',
          name: '构建',
          status: 'success',
          startedAt: now - 3600000,
          finishedAt: now - 3300000,
          duration: 300,
          jobs: [
            { id: 'job-1', name: 'install-deps', status: 'success', duration: 120 },
            { id: 'job-2', name: 'type-check', status: 'success', duration: 60 },
            { id: 'job-3', name: 'build', status: 'success', duration: 120 }
          ]
        },
        {
          id: 'stage-2',
          name: '测试',
          status: 'success',
          startedAt: now - 3300000,
          finishedAt: now - 2900000,
          duration: 400,
          jobs: [
            { id: 'job-4', name: 'unit-test', status: 'success', duration: 180 },
            { id: 'job-5', name: 'e2e-test', status: 'success', duration: 220 }
          ]
        },
        {
          id: 'stage-3',
          name: '部署',
          status: 'success',
          startedAt: now - 2900000,
          finishedAt: now - 2600000,
          duration: 300,
          jobs: [
            { id: 'job-6', name: 'deploy-staging', status: 'success', duration: 300 }
          ]
        }
      ],
      startedAt: now - 3600000,
      finishedAt: now - 2600000,
      duration: 1000,
      triggeredBy: '张三',
      triggerType: 'push',
      artifacts: [
        { id: 'art-1', name: 'dist-bundle.zip', size: 15728640, downloadUrl: '#', createdAt: now - 2600000 },
        { id: 'art-2', name: 'sourcemap.tar.gz', size: 5242880, downloadUrl: '#', createdAt: now - 2590000 }
      ]
    },
    {
      id: 'pipe-002',
      projectId: 'proj-001',
      projectName: 'frontend-web-app',
      branch: 'feature/auth',
      status: 'running',
      type: 'ci',
      commit: {
        sha: 'b2c3d4e5f6a7',
        message: 'feat: 添加 OAuth2 登录功能',
        author: '李四',
        timestamp: now - 900000
      },
      stages: [
        {
          id: 'stage-1',
          name: '构建',
          status: 'success',
          startedAt: now - 900000,
          finishedAt: now - 600000,
          duration: 300,
          jobs: [
            { id: 'job-1', name: 'install-deps', status: 'success', duration: 130 },
            { id: 'job-2', name: 'type-check', status: 'success', duration: 70 },
            { id: 'job-3', name: 'build', status: 'success', duration: 100 }
          ]
        },
        {
          id: 'stage-2',
          name: '测试',
          status: 'running',
          startedAt: now - 600000,
          duration: 0,
          jobs: [
            { id: 'job-4', name: 'unit-test', status: 'running', duration: 0 },
            { id: 'job-5', name: 'e2e-test', status: 'pending' }
          ]
        },
        {
          id: 'stage-3',
          name: '部署',
          status: 'pending',
          jobs: [
            { id: 'job-6', name: 'deploy-staging', status: 'pending' }
          ]
        }
      ],
      startedAt: now - 900000,
      duration: 0,
      triggeredBy: '李四',
      triggerType: 'push'
    },
    {
      id: 'pipe-003',
      projectId: 'proj-001',
      projectName: 'frontend-web-app',
      branch: 'develop',
      status: 'failed',
      type: 'ci',
      commit: {
        sha: 'c3d4e5f6a7b8',
        message: 'feat: 优化首页加载性能',
        author: '王五',
        timestamp: now - 7200000
      },
      stages: [
        {
          id: 'stage-1',
          name: '构建',
          status: 'success',
          duration: 280,
          jobs: [
            { id: 'job-1', name: 'install-deps', status: 'success', duration: 120 },
            { id: 'job-2', name: 'type-check', status: 'success', duration: 60 },
            { id: 'job-3', name: 'build', status: 'success', duration: 100 }
          ]
        },
        {
          id: 'stage-2',
          name: '测试',
          status: 'failed',
          duration: 150,
          jobs: [
            { id: 'job-4', name: 'unit-test', status: 'failed', duration: 150 },
            { id: 'job-5', name: 'e2e-test', status: 'skipped' }
          ]
        },
        {
          id: 'stage-3',
          name: '部署',
          status: 'skipped',
          jobs: [
            { id: 'job-6', name: 'deploy-staging', status: 'skipped' }
          ]
        }
      ],
      startedAt: now - 7200000,
      finishedAt: now - 6500000,
      duration: 700,
      triggeredBy: '王五',
      triggerType: 'push'
    },
    {
      id: 'pipe-004',
      projectId: 'proj-001',
      projectName: 'frontend-web-app',
      branch: 'main',
      status: 'pending',
      type: 'release',
      commit: {
        sha: 'd4e5f6a7b8c9',
        message: 'release: v2.1.0 版本发布',
        author: '张三',
        timestamp: now - 1800000
      },
      stages: [
        {
          id: 'stage-1',
          name: '构建生产包',
          status: 'pending',
          jobs: [
            { id: 'job-1', name: 'prod-build', status: 'pending' }
          ]
        },
        {
          id: 'stage-2',
          name: '审批',
          status: 'pending',
          jobs: [
            { id: 'job-2', name: 'release-approval', status: 'pending' }
          ]
        },
        {
          id: 'stage-3',
          name: '生产部署',
          status: 'pending',
          jobs: [
            { id: 'job-3', name: 'deploy-prod', status: 'pending' }
          ]
        }
      ],
      triggeredBy: '张三',
      triggerType: 'manual',
      hasApproval: true,
      approvalStatus: 'pending'
    }
  ],
  'proj-002': [
    {
      id: 'pipe-201',
      projectId: 'proj-002',
      projectName: 'backend-api-service',
      branch: 'main',
      status: 'success',
      type: 'ci',
      commit: {
        sha: 'e5f6a7b8c9d0',
        message: 'feat: 新增用户批量导入接口',
        author: '赵六',
        timestamp: now - 5400000
      },
      stages: [
        {
          id: 'stage-1', name: '编译', status: 'success', duration: 200,
          jobs: [{ id: 'j1', name: 'compile', status: 'success', duration: 200 }]
        },
        {
          id: 'stage-2', name: '单元测试', status: 'success', duration: 350,
          jobs: [{ id: 'j2', name: 'unit-tests', status: 'success', duration: 350 }]
        },
        {
          id: 'stage-3', name: '集成测试', status: 'success', duration: 420,
          jobs: [{ id: 'j3', name: 'integration-tests', status: 'success', duration: 420 }]
        },
        {
          id: 'stage-4', name: '镜像构建', status: 'success', duration: 180,
          jobs: [{ id: 'j4', name: 'docker-build', status: 'success', duration: 180 }]
        }
      ],
      startedAt: now - 5400000,
      finishedAt: now - 3900000,
      duration: 1500,
      triggeredBy: '赵六',
      triggerType: 'push',
      artifacts: [
        { id: 'art-201', name: 'app-image.tar', size: 209715200, downloadUrl: '#', createdAt: now - 3900000 }
      ]
    },
    {
      id: 'pipe-202',
      projectId: 'proj-002',
      projectName: 'backend-api-service',
      branch: 'feature/user-module',
      status: 'running',
      type: 'ci',
      commit: {
        sha: 'f6a7b8c9d0e1',
        message: 'wip: 用户模块重构',
        author: '孙七',
        timestamp: now - 1200000
      },
      stages: [
        { id: 'stage-1', name: '编译', status: 'success', duration: 190, jobs: [{ id: 'j1', name: 'compile', status: 'success', duration: 190 }] },
        { id: 'stage-2', name: '单元测试', status: 'running', jobs: [{ id: 'j2', name: 'unit-tests', status: 'running' }] },
        { id: 'stage-3', name: '集成测试', status: 'pending', jobs: [{ id: 'j3', name: 'integration-tests', status: 'pending' }] },
        { id: 'stage-4', name: '镜像构建', status: 'pending', jobs: [{ id: 'j4', name: 'docker-build', status: 'pending' }] }
      ],
      startedAt: now - 1200000,
      triggeredBy: '孙七',
      triggerType: 'push'
    }
  ],
  'proj-003': [
    {
      id: 'pipe-301',
      projectId: 'proj-003',
      projectName: 'mobile-app',
      branch: 'main',
      status: 'success',
      type: 'ci',
      commit: {
        sha: 'a7b8c9d0e1f2',
        message: 'fix: 修复iOS端闪退问题',
        author: '周八',
        timestamp: now - 10800000
      },
      stages: [
        { id: 's1', name: '依赖安装', status: 'success', duration: 300, jobs: [{ id: 'j1', name: 'pod-install', status: 'success', duration: 300 }] },
        { id: 's2', name: '编译', status: 'success', duration: 600, jobs: [{ id: 'j2', name: 'build-ios', status: 'success', duration: 400 }, { id: 'j3', name: 'build-android', status: 'success', duration: 600 }] },
        { id: 's3', name: '测试', status: 'success', duration: 240, jobs: [{ id: 'j4', name: 'test', status: 'success', duration: 240 }] }
      ],
      startedAt: now - 10800000,
      finishedAt: now - 9000000,
      duration: 1800,
      triggeredBy: '周八',
      triggerType: 'push',
      artifacts: [
        { id: 'art-301', name: 'app-debug.apk', size: 52428800, downloadUrl: '#', createdAt: now - 9000000 },
        { id: 'art-302', name: 'app.ipa', size: 62914560, downloadUrl: '#', createdAt: now - 8900000 }
      ]
    }
  ],
  'proj-004': [
    {
      id: 'pipe-401',
      projectId: 'proj-004',
      projectName: 'data-pipeline',
      branch: 'main',
      status: 'running',
      type: 'ci',
      commit: {
        sha: 'b8c9d0e1f2a3',
        message: 'feat: 新增推荐算法模型',
        author: '吴九',
        timestamp: now - 1800000
      },
      stages: [
        { id: 's1', name: '数据校验', status: 'success', duration: 120, jobs: [{ id: 'j1', name: 'validate', status: 'success', duration: 120 }] },
        { id: 's2', name: '模型训练', status: 'running', jobs: [{ id: 'j2', name: 'train-model', status: 'running' }] },
        { id: 's3', name: '模型评估', status: 'pending', jobs: [{ id: 'j3', name: 'evaluate', status: 'pending' }] }
      ],
      startedAt: now - 1800000,
      triggeredBy: '吴九',
      triggerType: 'schedule'
    }
  ],
  'proj-005': [
    {
      id: 'pipe-501',
      projectId: 'proj-005',
      projectName: 'admin-console',
      branch: 'main',
      status: 'success',
      type: 'ci',
      commit: {
        sha: 'c9d0e1f2a3b4',
        message: 'feat: 新增权限管理模块',
        author: '郑十',
        timestamp: now - 14400000
      },
      stages: [
        { id: 's1', name: '构建', status: 'success', duration: 250, jobs: [{ id: 'j1', name: 'build', status: 'success', duration: 250 }] },
        { id: 's2', name: '测试', status: 'success', duration: 180, jobs: [{ id: 'j2', name: 'test', status: 'success', duration: 180 }] },
        { id: 's3', name: '部署', status: 'success', duration: 120, jobs: [{ id: 'j3', name: 'deploy', status: 'success', duration: 120 }] }
      ],
      startedAt: now - 14400000,
      finishedAt: now - 13000000,
      duration: 1400,
      triggeredBy: '郑十',
      triggerType: 'push',
      artifacts: [
        { id: 'art-501', name: 'admin-dist.zip', size: 8388608, downloadUrl: '#', createdAt: now - 13000000 }
      ]
    }
  ]
}

export const mockApprovals: ApprovalItem[] = [
  {
    id: 'appr-001',
    pipelineId: 'pipe-004',
    projectId: 'proj-001',
    projectName: 'frontend-web-app',
    title: 'v2.1.0 版本发布审批',
    description: '包含 OAuth2 登录功能、性能优化等特性',
    branch: 'main',
    version: 'v2.1.0',
    submitter: '张三',
    submittedAt: now - 1800000,
    status: 'pending',
    approvers: ['李四', '王五'],
    approvedBy: []
  },
  {
    id: 'appr-002',
    pipelineId: 'pipe-201',
    projectId: 'proj-002',
    projectName: 'backend-api-service',
    title: '用户批量导入功能上线',
    description: '新增用户批量导入接口，需审批后部署到生产环境',
    branch: 'main',
    submitter: '赵六',
    submittedAt: now - 4800000,
    status: 'approved',
    approvers: ['张三'],
    approvedBy: ['张三']
  }
]

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-001',
    type: 'build_failed',
    title: '构建失败 - frontend-web-app',
    message: 'develop 分支单元测试失败',
    projectId: 'proj-001',
    projectName: 'frontend-web-app',
    pipelineId: 'pipe-003',
    timestamp: now - 6500000,
    read: false,
    sound: true
  },
  {
    id: 'notif-002',
    type: 'approval_required',
    title: '待审批 - frontend-web-app',
    message: 'v2.1.0 版本发布需要您的审批',
    projectId: 'proj-001',
    projectName: 'frontend-web-app',
    pipelineId: 'pipe-004',
    timestamp: now - 1800000,
    read: false,
    sound: true
  },
  {
    id: 'notif-003',
    type: 'build_success',
    title: '构建成功 - backend-api-service',
    message: 'main 分支构建成功，耗时 25 分钟',
    projectId: 'proj-002',
    projectName: 'backend-api-service',
    pipelineId: 'pipe-201',
    timestamp: now - 3900000,
    read: true
  }
]

export const mockAccounts: UserAccount[] = [
  {
    id: 'acc-001',
    username: 'zhangsan',
    email: 'zhangsan@example.com',
    platform: 'gitlab',
    isActive: true,
    token: 'glpat-xxxxxxxxx'
  },
  {
    id: 'acc-002',
    username: 'zhangsan_github',
    email: 'zhangsan@gmail.com',
    platform: 'github',
    isActive: false,
    token: 'ghp_xxxxxxxxx'
  }
]

export const mockTriggerRecords: LocalTriggerRecord[] = [
  {
    id: 'trig-001',
    projectId: 'proj-001',
    projectName: 'frontend-web-app',
    branch: 'feature/auth',
    triggeredAt: now - 900000,
    status: 'running',
    pipelineId: 'pipe-002'
  },
  {
    id: 'trig-002',
    projectId: 'proj-002',
    projectName: 'backend-api-service',
    branch: 'main',
    triggeredAt: now - 7200000,
    status: 'success',
    pipelineId: 'pipe-201'
  },
  {
    id: 'trig-003',
    projectId: 'proj-001',
    projectName: 'frontend-web-app',
    branch: 'main',
    triggeredAt: now - 86400000,
    status: 'failed',
    pipelineId: 'pipe-003'
  }
]

export const mockBuildLogs = [
  { level: 'info', stage: 'prepare', message: 'Running with gitlab-runner 16.0.0' },
  { level: 'info', stage: 'prepare', message: '  on runner-01 abc123def456' },
  { level: 'info', stage: 'prepare', message: 'Preparing the "docker" executor' },
  { level: 'info', stage: 'prepare', message: 'Using Docker image node:18-alpine ...' },
  { level: 'info', stage: 'build', message: '$ npm ci' },
  { level: 'info', stage: 'build', message: 'added 1234 packages in 45s' },
  { level: 'info', stage: 'build', message: '$ npm run type-check' },
  { level: 'info', stage: 'build', message: 'Type checking in progress...' },
  { level: 'info', stage: 'build', message: 'Found 0 type errors' },
  { level: 'info', stage: 'build', message: '$ npm run build' },
  { level: 'info', stage: 'build', message: 'vite v5.0.0 building for production...' },
  { level: 'info', stage: 'build', message: '✓ 342 modules transformed.' },
  { level: 'info', stage: 'build', message: 'dist/index.html                  0.48 kB' },
  { level: 'info', stage: 'build', message: 'dist/assets/index.abc123.js     342.05 kB' },
  { level: 'info', stage: 'build', message: 'dist/assets/index.def456.css     56.23 kB' },
  { level: 'info', stage: 'build', message: '✓ built in 2.34s' },
  { level: 'info', stage: 'test', message: '$ npm run test:unit' },
  { level: 'info', stage: 'test', message: '  PASS  src/components/Button.test.tsx' },
  { level: 'info', stage: 'test', message: '  PASS  src/components/Modal.test.tsx' },
  { level: 'warn', stage: 'test', message: '  PASS  src/pages/Home.test.tsx (5.2s)' },
  { level: 'info', stage: 'test', message: '' },
  { level: 'info', stage: 'test', message: 'Test Suites: 12 passed, 12 total' },
  { level: 'info', stage: 'test', message: 'Tests:       156 passed, 156 total' },
  { level: 'info', stage: 'test', message: 'Snapshots:   23 passed, 23 total' },
  { level: 'info', stage: 'test', message: 'Time:        12.345s' },
  { level: 'info', stage: 'deploy', message: '$ npm run deploy:staging' },
  { level: 'info', stage: 'deploy', message: 'Deploying to staging environment...' },
  { level: 'info', stage: 'deploy', message: 'Uploading artifacts...' },
  { level: 'info', stage: 'deploy', message: 'Deployment successful!' },
  { level: 'info', stage: 'deploy', message: 'URL: https://staging.example.com' },
  { level: 'info', stage: 'deploy', message: 'Job succeeded' }
]
