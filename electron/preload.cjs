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
    const validChannels = ['fromMain', 'toggle-recording-hotkey', 'open-settings'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // ホットキーイベントのリスナー
  onHotkeyToggle: (callback) => {
    const wrappedCallback = () => callback();
    ipcRenderer.on('toggle-recording-hotkey', wrappedCallback);
    // コールバックを返して後で削除できるようにする
    return wrappedCallback;
  },
  
  // リスナーの削除
  removeHotkeyListener: (callback) => {
    if (callback) {
      ipcRenderer.removeListener('toggle-recording-hotkey', callback);
    }
  },
  
  // 現在のホットキーを取得
  getCurrentHotkey: () => ipcRenderer.invoke('get-current-hotkey'),
  
  // クリップボードに書き込み
  writeToClipboard: (text) => ipcRenderer.invoke('write-to-clipboard', text),
  
  // フローティングウィンドウ用
  toggleRecording: () => ipcRenderer.send('toggle-recording'),
  updateRecordingState: (isRecording) => ipcRenderer.send('update-recording-state', isRecording),
  onToggleRecording: (callback) => {
    ipcRenderer.on('toggle-recording-request', callback);
  },
  removeToggleListener: () => {
    ipcRenderer.removeAllListeners('toggle-recording-request');
  },
  onRecordingStateChange: (callback) => {
    ipcRenderer.on('recording-state-changed', (event, state) => callback(state));
  },
  showMainWindow: () => ipcRenderer.send('show-main-window'),
  
  // ウィンドウ移動用
  moveWindow: (deltaX, deltaY) => ipcRenderer.send('move-window', deltaX, deltaY),
  
  // コンテキストメニューを表示
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
});