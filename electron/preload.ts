import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  showNotification: (title: string, body: string) => 
    ipcRenderer.send('show-notification', { title, body }),
  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  copyToClipboard: (text: string) => ipcRenderer.send('copy-to-clipboard', text),
  onNavigate: (callback: (route: string) => void) =>
    ipcRenderer.on('navigate', (_event, route) => callback(route))
})

export type ElectronAPI = {
  minimize: () => void
  maximize: () => void
  close: () => void
  showNotification: (title: string, body: string) => void
  openExternal: (url: string) => void
  copyToClipboard: (text: string) => void
  onNavigate: (callback: (route: string) => void) => void
}
