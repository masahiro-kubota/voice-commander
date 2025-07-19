const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const OpenAIService = require('./openai-service.cjs');

let mainWindow = null;
let openAIService = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 開発環境の場合
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // プロダクション環境の場合
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC ハンドラーの設定
function setupIPCHandlers() {
  // APIキーを取得
  ipcMain.handle('get-api-key', async () => {
    return openAIService.getApiKey();
  });
  
  // APIキーを設定
  ipcMain.handle('set-api-key', async (event, apiKey) => {
    return openAIService.setApiKey(apiKey);
  });
  
  // APIキーをテスト
  ipcMain.handle('test-api-key', async (event, apiKey) => {
    return openAIService.testApiKey(apiKey);
  });
  
  // 音声を文字起こし
  ipcMain.handle('transcribe-audio', async (event, audioBuffer, options) => {
    try {
      const result = await openAIService.transcribeAudio(audioBuffer, options);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

app.whenReady().then(() => {
  // OpenAIサービスを初期化
  openAIService = new OpenAIService();
  
  // IPC ハンドラーを設定
  setupIPCHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});