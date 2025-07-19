const { contextBridge, ipcRenderer } = require('electron');

// APIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('electronAPI', {
  // 必要に応じてIPCメソッドを追加
  sendMessage: (channel, data) => {
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  onMessage: (channel, func) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});