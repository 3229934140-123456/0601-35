"use strict";
const electron = require("electron");
const path = require("path");
let mainWindow = null;
let tray = null;
let isQuiting = false;
let projectList = [];
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 640,
    minWidth: 768,
    minHeight: 520,
    frame: false,
    transparent: false,
    backgroundColor: "#1a1a2e",
    icon: path.join(__dirname, "../public/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("close", (e) => {
    if (!isQuiting) {
      e.preventDefault();
      mainWindow == null ? void 0 : mainWindow.hide();
    }
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow == null ? void 0 : mainWindow.show();
  });
}
function updateTrayMenu() {
  if (!tray) return;
  const quickBuildItems = projectList.slice(0, 5).map((project) => ({
    label: `${project.name} - ${project.defaultBranch}`,
    click: () => {
      mainWindow == null ? void 0 : mainWindow.show();
      mainWindow == null ? void 0 : mainWindow.focus();
      mainWindow == null ? void 0 : mainWindow.webContents.send("quick-build", {
        projectId: project.id,
        branch: project.defaultBranch
      });
    }
  }));
  const contextMenu = electron.Menu.buildFromTemplate([
    {
      label: "打开面板",
      click: () => {
        mainWindow == null ? void 0 : mainWindow.show();
        mainWindow == null ? void 0 : mainWindow.focus();
      }
    },
    { type: "separator" },
    {
      label: "快速构建",
      submenu: quickBuildItems.length > 0 ? quickBuildItems : [{ label: "暂无项目", enabled: false }]
    },
    { type: "separator" },
    {
      label: "通知设置",
      click: () => {
        mainWindow == null ? void 0 : mainWindow.show();
        mainWindow == null ? void 0 : mainWindow.focus();
        mainWindow == null ? void 0 : mainWindow.webContents.send("navigate", "settings");
      }
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        isQuiting = true;
        electron.app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
}
function createTray() {
  const iconPath = path.join(__dirname, "../public/tray-icon.svg");
  const trayIcon = electron.nativeImage.createFromPath(iconPath);
  tray = new electron.Tray(trayIcon.resize({ width: 16, height: 16 }));
  tray.setToolTip("CI Tray Tool - 持续集成监控");
  updateTrayMenu();
  tray.on("click", () => {
    if (mainWindow == null ? void 0 : mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow == null ? void 0 : mainWindow.show();
      mainWindow == null ? void 0 : mainWindow.focus();
    }
  });
}
electron.app.whenReady().then(() => {
  createWindow();
  createTray();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.ipcMain.on("window-minimize", () => {
  mainWindow == null ? void 0 : mainWindow.minimize();
});
electron.ipcMain.on("window-maximize", () => {
  if (mainWindow == null ? void 0 : mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow == null ? void 0 : mainWindow.maximize();
  }
});
electron.ipcMain.on("window-close", () => {
  mainWindow == null ? void 0 : mainWindow.hide();
});
electron.ipcMain.on("show-notification", (_event, payload) => {
  const notification = new electron.Notification({
    title: payload.title,
    body: payload.body,
    icon: path.join(__dirname, "../public/icon.png")
  });
  notification.show();
});
electron.ipcMain.on("open-external", (_event, url) => {
  electron.shell.openExternal(url);
});
electron.ipcMain.on("copy-to-clipboard", (_event, text) => {
  const { clipboard } = require("electron");
  clipboard.writeText(text);
});
electron.ipcMain.on("update-tray-projects", (_event, projects) => {
  projectList = projects;
  updateTrayMenu();
});
electron.ipcMain.on("download-file", (_event, url, filename) => {
  electron.shell.openExternal(url);
});
