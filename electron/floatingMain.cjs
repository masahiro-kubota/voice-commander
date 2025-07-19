const { app, BrowserWindow, ipcMain, clipboard, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const OpenAIService = require('./openai-service.cjs');
const HotkeyManager = require('./hotkeyManager.cjs');

let mainWindow = null;
let floatingWindow = null;
let toastWindow = null;
let apiKeyWindow = null;
let apiKeyBlurTimeout = null; // グローバルスコープに移動
let tray = null;
let openAIService = null;
let hotkeyManager = null;

// ウィンドウサイズ定数
const WINDOW_SIZES = {
  FLOATING: { width: 80, height: 80 },
  TOAST: { width: 400, height: 120 },
  MAIN: { width: 1000, height: 700 },
  APIKEY: { width: 350, height: 80 }
};

// 間隔・位置定数
const SPACING = {
  EDGE_MARGIN: 120,
  BOTTOM_MARGIN: 140,
  TOAST_OFFSET: 10,
  TOAST_RIGHT_MARGIN: 420,
  TOAST_CENTER_OFFSET: 160,
  TOAST_TOP_OFFSET: 130
};

// タイマー定数
const TIMERS = {
  TOAST_DURATION: 3000,
  COPY_NOTIFICATION: 1500,
  COPY_RESET: 2000
};

// フローティングウィンドウを作成
function createFloatingWindow() {
  const display = screen.getPrimaryDisplay();
  const width = display.bounds.width;
  const height = display.bounds.height;

  floatingWindow = new BrowserWindow({
    width: WINDOW_SIZES.FLOATING.width,
    height: WINDOW_SIZES.FLOATING.height,
    x: width - SPACING.EDGE_MARGIN,
    y: height - SPACING.BOTTOM_MARGIN,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: '#00000000', // 完全に透明
    hasShadow: false,
    movable: true,  // ウィンドウの移動を有効にする
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });
  
  // ウィンドウレベルを設定（macOSとWindowsで異なる）
  if (process.platform === 'darwin') {
    floatingWindow.setAlwaysOnTop(true, 'floating');
  } else {
    floatingWindow.setAlwaysOnTop(true, 'screen-saver');
  }

  // 開発環境の場合
  if (process.env.NODE_ENV === 'development') {
    floatingWindow.loadURL('http://localhost:5173/floating.html');
    // デバッグフラグが設定されている場合のみ開発者ツールを開く
    if (process.env.FLOATING_DEBUG === 'true') {
      floatingWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    floatingWindow.loadFile(path.join(__dirname, '../dist/floating.html'));
  }

  floatingWindow.on('closed', () => {
    floatingWindow = null;
  });
}

// トースト通知ウィンドウを作成
function createToastWindow(text) {
  // テキストの長さに基づいて高さを計算
  const CHARS_PER_LINE = 40;
  const LINE_HEIGHT = 22;
  const MIN_CONTENT_HEIGHT = 60;
  const MAX_CONTENT_HEIGHT = 200; // 最大高さを制限
  const HEADER_PADDING = 80;
  
  const lines = Math.ceil(text.length / CHARS_PER_LINE);
  const contentHeight = Math.min(MAX_CONTENT_HEIGHT, Math.max(MIN_CONTENT_HEIGHT, lines * LINE_HEIGHT));
  const windowHeight = contentHeight + HEADER_PADDING;
  
  // フローティングウィンドウの現在位置を取得
  let toastX, toastY;
  let display;
  
  if (floatingWindow) {
    const [floatingX, floatingY] = floatingWindow.getPosition();
    const floatingBounds = floatingWindow.getBounds();
    
    // フローティングウィンドウがあるディスプレイを特定
    display = screen.getDisplayNearestPoint({ x: floatingX, y: floatingY });
    
    // フローティングボタンの右側に表示を試す
    toastX = floatingX + floatingBounds.width + SPACING.TOAST_OFFSET;
    toastY = floatingY;
    
    // 右側に入らない場合は左側に表示
    if (toastX + WINDOW_SIZES.TOAST.width > display.bounds.x + display.bounds.width) {
      toastX = floatingX - WINDOW_SIZES.TOAST.width - SPACING.TOAST_OFFSET;
    }
    
    // 左側にも入らない場合は上側に表示
    if (toastX < display.bounds.x + SPACING.TOAST_OFFSET) {
      toastX = floatingX - SPACING.TOAST_CENTER_OFFSET;
      toastY = floatingY - SPACING.TOAST_TOP_OFFSET;
      
      // 上側にも入らない場合は下側に表示
      if (toastY < display.bounds.y + SPACING.TOAST_OFFSET) {
        toastY = floatingY + floatingBounds.height + SPACING.TOAST_OFFSET;
      }
    }
    
    // そのディスプレイの境界内に収まるように調整
    toastX = Math.max(display.bounds.x + SPACING.TOAST_OFFSET, 
                     Math.min(toastX, display.bounds.x + display.bounds.width - WINDOW_SIZES.TOAST.width - SPACING.TOAST_OFFSET));
    toastY = Math.max(display.bounds.y + SPACING.TOAST_OFFSET, 
                     Math.min(toastY, display.bounds.y + display.bounds.height - windowHeight - SPACING.TOAST_OFFSET));
    
  } else {
    // フローティングウィンドウがない場合はプライマリディスプレイの従来位置
    display = screen.getPrimaryDisplay();
    toastX = display.bounds.x + display.bounds.width - SPACING.TOAST_RIGHT_MARGIN;
    toastY = display.bounds.y + display.bounds.height - SPACING.BOTTOM_MARGIN;
  }

  toastWindow = new BrowserWindow({
    width: WINDOW_SIZES.TOAST.width,
    height: windowHeight,
    x: toastX,
    y: toastY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // トースト用のHTMLを動的に生成
  const toastHTML = `
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: transparent;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .toast {
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: fadeIn 0.3s ease-out;
            min-width: 200px;
            max-width: 380px;
          }
          .success-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            color: #4caf50;
            font-weight: 500;
          }
          .transcript {
            color: white;
            font-size: 14px;
            word-break: break-word;
            line-height: 1.5;
            max-height: 200px;
            overflow-y: auto;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
      </head>
      <body>
        <div class="toast">
          <div class="success-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            <span>コピーしました</span>
          </div>
          <div class="transcript">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
        <script>
          setTimeout(() => {
            window.close();
          }, ${TIMERS.TOAST_DURATION});
        </script>
      </body>
    </html>
  `;

  toastWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(toastHTML)}`);

  toastWindow.on('closed', () => {
    toastWindow = null;
  });
}

// APIキー入力ウィンドウを作成
function createApiKeyWindow() {
  // 既存のタイマーをクリア
  if (apiKeyBlurTimeout) {
    clearTimeout(apiKeyBlurTimeout);
    apiKeyBlurTimeout = null;
  }
  
  if (apiKeyWindow) {
    apiKeyWindow.focus();
    return;
  }

  // フローティングウィンドウの位置を取得
  const [floatingX, floatingY] = floatingWindow.getPosition();
  const floatingBounds = floatingWindow.getBounds();
  
  // 現在のディスプレイを取得
  const display = screen.getDisplayNearestPoint({ x: floatingX, y: floatingY });
  
  // フローティングボタンの右側に表示
  let x = floatingX + floatingBounds.width + SPACING.TOAST_OFFSET;
  let y = floatingY + (floatingBounds.height - WINDOW_SIZES.APIKEY.height) / 2;
  
  // 右側に入らない場合は左側に表示
  if (x + WINDOW_SIZES.APIKEY.width > display.bounds.x + display.bounds.width) {
    x = floatingX - WINDOW_SIZES.APIKEY.width - SPACING.TOAST_OFFSET;
  }
  
  // 上下の境界チェック
  if (y < display.bounds.y) {
    y = display.bounds.y + SPACING.TOAST_OFFSET;
  } else if (y + WINDOW_SIZES.APIKEY.height > display.bounds.y + display.bounds.height) {
    y = display.bounds.y + display.bounds.height - WINDOW_SIZES.APIKEY.height - SPACING.TOAST_OFFSET;
  }

  apiKeyWindow = new BrowserWindow({
    width: WINDOW_SIZES.APIKEY.width,
    height: WINDOW_SIZES.APIKEY.height,
    x: x,
    y: y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 開発環境の場合
  if (process.env.NODE_ENV === 'development') {
    apiKeyWindow.loadURL('http://localhost:5173/apikey.html');
  } else {
    apiKeyWindow.loadFile(path.join(__dirname, '../dist/apikey.html'));
  }

  apiKeyWindow.on('closed', () => {
    apiKeyWindow = null;
    // ウィンドウが閉じられた時にタイマーもクリア
    if (apiKeyBlurTimeout) {
      clearTimeout(apiKeyBlurTimeout);
      apiKeyBlurTimeout = null;
    }
  });

  // フォーカスが外れたら遅延して閉じる
  apiKeyWindow.on('blur', () => {
    // 遅延を設けることで、ウィンドウ内の要素間のフォーカス移動で閉じないようにする
    apiKeyBlurTimeout = setTimeout(() => {
      if (apiKeyWindow && !apiKeyWindow.isDestroyed()) {
        apiKeyWindow.close();
      }
    }, 100);
  });
  
  apiKeyWindow.on('focus', () => {
    // フォーカスが戻った場合はタイマーをクリア
    if (apiKeyBlurTimeout) {
      clearTimeout(apiKeyBlurTimeout);
      apiKeyBlurTimeout = null;
    }
  });
}

// メインウィンドウを作成
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_SIZES.MAIN.width,
    height: WINDOW_SIZES.MAIN.height,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 開発環境の場合
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// システムトレイを作成
function createTray() {
  // トレイアイコンを作成
  let iconPath;
  if (process.env.NODE_ENV === 'development') {
    iconPath = path.join(__dirname, '../build/icon.png');
  } else {
    // AppImageの場合、アプリケーションのリソースから読み込む
    iconPath = path.join(process.resourcesPath, 'app/build/icon.png');
  }
  
  // アイコンファイルが存在するか確認
  const fs = require('fs');
  if (fs.existsSync(iconPath)) {
    const icon = nativeImage.createFromPath(iconPath);
    // トレイ用に小さくリサイズ（16x16 または 22x22）
    const trayIcon = icon.resize({ width: 22, height: 22 });
    tray = new Tray(trayIcon);
  } else {
    // フォールバック: データURLを使用
    const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHJSURBVDiNpZO9S1VRHMc/5773vvdeX3zJl0zT1FQUESQhCBoaWqKhpSGIoKE/oKGhoaWlpSGipSGipaEhCMKmhiAicsEXUEvT6733nnPObwhtQj1Sz+mczznf7/fLOd/vgf8VWmt2794Nra2tpz3PG1JKlQBkMplomqZ3tNYP4/H4OwDZLmFzczNdXV2DQggxNTUVTU5ORpIkQQgBgFIKz/NobGwUHR0d4sCBA/2u694bGRmxAGIrg87OztPZbPZWPB4vTE9PR/Pz82RrNRobGykvL8d1XZRS+L6P1pq6ujqxZ8+eYMn8UmvdAiBWGXR0dLTm8/kXQRBYCwsLaHYgBPl8nvn5eYQQaK0BqKmpwXEcXV1dLa1du3YjgFxhYBhGr2EYN8fHx6OlLyzLyvvAMAw2bNhAPp/n169fCCEAmJmZoVAo8OzZs+Dz58+DH+5+z2G1kjEAY2Nj0TZF0zRZXFzk48ePxHGMlBKAmpoaqqqqGB4ejr59+3ZutSGAWCGklHrQ19d3ORaLHfZ9/5OU8kyWZRmGYaCUQghBEAT4vo/jOJSUlLC8vCytdevqBQD19fX09PRMbtu2Lfr9+zdxHBPHMVprHMfB933Gx8fjr1+/juzu7m7+q9Bf6g9l7K1xDd3k1AAAAABJRU5ErkJggg==');
    tray = new Tray(icon);
  }

  updateTrayMenu();

  tray.setToolTip('Voice Commander');
}

// トレイメニューを更新
function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'メインウィンドウを表示',
      click: () => {
        if (!mainWindow) {
          createMainWindow();
        }
        mainWindow.show();
      },
    },
    {
      label: 'API キー設定',
      click: () => {
        if (!mainWindow) {
          createMainWindow();
        }
        mainWindow.show();
        mainWindow.webContents.send('open-settings');
      },
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

// IPC ハンドラーの設定
function setupIPCHandlers() {
  // 既存のハンドラー
  ipcMain.handle('get-api-key', async () => {
    return openAIService.getApiKey();
  });
  
  ipcMain.handle('set-api-key', async (_, apiKey) => {
    return openAIService.setApiKey(apiKey);
  });
  
  ipcMain.handle('test-api-key', async (_, apiKey) => {
    return openAIService.testApiKey(apiKey);
  });
  
  ipcMain.handle('transcribe-audio', async (_, audioBuffer, options) => {
    try {
      const result = await openAIService.transcribeAudio(audioBuffer, options);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('write-to-clipboard', async (_, text) => {
    try {
      clipboard.writeText(text);
      // トースト通知を表示
      createToastWindow(text);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('get-current-hotkey', async () => {
    return hotkeyManager.getCurrentHotkey();
  });

  // フローティングウィンドウ用の新しいハンドラー
  ipcMain.on('toggle-recording', () => {
    if (floatingWindow) {
      floatingWindow.webContents.send('toggle-recording-request');
    }
  });

  ipcMain.on('update-recording-state', (_, isRecording) => {
    // フローティングウィンドウのUIを更新
    if (floatingWindow) {
      floatingWindow.webContents.send('recording-state-changed', isRecording);
    }
  });

  // メインウィンドウを表示
  ipcMain.on('show-main-window', () => {
    if (!mainWindow) {
      createMainWindow();
    }
    mainWindow.show();
  });

  // ウィンドウ移動
  ipcMain.on('move-window', (_, deltaX, deltaY) => {
    if (floatingWindow) {
      const currentPos = floatingWindow.getPosition();
      floatingWindow.setPosition(currentPos[0] + deltaX, currentPos[1] + deltaY);
    }
  });
  
  // コンテキストメニューを表示
  ipcMain.on('show-context-menu', () => {
    createApiKeyWindow();
  });
}

app.whenReady().then(() => {
  // OpenAIサービスを初期化
  openAIService = new OpenAIService();
  
  // ホットキーマネージャーを初期化
  hotkeyManager = new HotkeyManager();
  
  // IPC ハンドラーを設定
  setupIPCHandlers();
  
  // フローティングウィンドウとトレイを作成
  createFloatingWindow();
  createTray();
  
  // ホットキーマネージャーにフローティングウィンドウを設定
  hotkeyManager.setMainWindow(floatingWindow);
  hotkeyManager.initialize();

  app.on('activate', () => {
    if (!floatingWindow) {
      createFloatingWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // アプリを終了しない（トレイで動作を継続）
});

// アプリ終了時の処理
app.on('will-quit', () => {
  if (hotkeyManager) {
    hotkeyManager.unregisterAll();
  }
  if (tray) {
    tray.destroy();
  }
});