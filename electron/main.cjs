// フローティングモードかどうかをチェック
const isFloatingMode = process.env.FLOATING_MODE === 'true';

// フローティングモードの場合は、floatingMain.cjsを実行
if (isFloatingMode) {
  require('./floatingMain.cjs');
} else {
  // 通常モード
  const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
  const path = require('path');
  const OpenAIService = require('./openai-service.cjs');
  const HotkeyManager = require('./hotkeyManager.cjs');

  let mainWindow = null;
  let openAIService = null;
  let hotkeyManager = null;

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
    
    // クリップボードに書き込み
    ipcMain.handle('write-to-clipboard', async (event, text) => {
      try {
        clipboard.writeText(text);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    // 現在のホットキーを取得
    ipcMain.handle('get-current-hotkey', async () => {
      return hotkeyManager.getCurrentHotkey();
    });
  }

  app.whenReady().then(() => {
    // OpenAIサービスを初期化
    openAIService = new OpenAIService();
    
    // ホットキーマネージャーを初期化
    hotkeyManager = new HotkeyManager();
    
    // IPC ハンドラーを設定
    setupIPCHandlers();
    
    createWindow();
    
    // メインウィンドウの参照を設定してホットキーを初期化
    hotkeyManager.setMainWindow(mainWindow);
    hotkeyManager.initialize();

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

  // アプリ終了時にホットキーを解除
  app.on('will-quit', () => {
    if (hotkeyManager) {
      hotkeyManager.unregisterAll();
    }
  });
}