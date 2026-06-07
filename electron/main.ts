import { app, BrowserWindow, Tray, Menu, ipcMain, Notification, nativeImage, shell } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuiting = false
let projectList: Array<{ id: string; name: string; defaultBranch: string }> = []

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 640,
    minWidth: 768,
    minHeight: 520,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1a2e',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('close', (e) => {
    if (!isQuiting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })
}

function updateTrayMenu() {
  if (!tray) return

  const quickBuildItems = projectList.slice(0, 5).map(project => ({
    label: `${project.name} - ${project.defaultBranch}`,
    click: () => {
      mainWindow?.show()
      mainWindow?.focus()
      mainWindow?.webContents.send('quick-build', {
        projectId: project.id,
        branch: project.defaultBranch
      })
    }
  }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开面板',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' as const },
    {
      label: '快速构建',
      submenu: quickBuildItems.length > 0 ? quickBuildItems : [{ label: '暂无项目', enabled: false }]
    },
    { type: 'separator' as const },
    {
      label: '通知设置',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
        mainWindow?.webContents.send('navigate', 'settings')
      }
    },
    { type: 'separator' as const },
    {
      label: '退出',
      click: () => {
        isQuiting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/tray-icon.svg')
  const trayIcon = nativeImage.createFromPath(iconPath)
  
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
  tray.setToolTip('CI Tray Tool - 持续集成监控')

  updateTrayMenu()

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
}

app.whenReady().then(() => {
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window-close', () => {
  mainWindow?.hide()
})

ipcMain.on('show-notification', (_event, payload) => {
  const notification = new Notification({
    title: payload.title,
    body: payload.body,
    icon: path.join(__dirname, '../public/icon.png')
  })
  notification.show()
})

ipcMain.on('open-external', (_event, url) => {
  shell.openExternal(url)
})

ipcMain.on('copy-to-clipboard', (_event, text) => {
  const { clipboard } = require('electron')
  clipboard.writeText(text)
})

ipcMain.on('update-tray-projects', (_event, projects) => {
  projectList = projects
  updateTrayMenu()
})

ipcMain.on('download-file', (_event, url, filename) => {
  shell.openExternal(url)
})
