const { contextBridge, ipcRenderer } = require('electron');

// APIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('electronAPI', {
  // OpenAI API関連
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (apiKey) => ipcRenderer.invoke('set-api-key', apiKey),
  testApiKey: (apiKey) => ipcRenderer.invoke('test-api-key', apiKey),
  transcribeAudio: (audioBuffer, options) => ipcRenderer.invoke('transcribe-audio', audioBuffer, options),
  
  // 既存のメソッド
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