"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => electron.ipcRenderer.send("window-minimize"),
  maximize: () => electron.ipcRenderer.send("window-maximize"),
  close: () => electron.ipcRenderer.send("window-close"),
  showNotification: (title, body) => electron.ipcRenderer.send("show-notification", { title, body }),
  openExternal: (url) => electron.ipcRenderer.send("open-external", url),
  copyToClipboard: (text) => electron.ipcRenderer.send("copy-to-clipboard", text),
  onNavigate: (callback) => electron.ipcRenderer.on("navigate", (_event, route) => callback(route))
});
