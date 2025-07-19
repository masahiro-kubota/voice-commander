const { globalShortcut } = require('electron');

class HotkeyManager {
  constructor() {
    this.hotkey = process.platform === 'darwin' ? 'Cmd+Shift+G' : 'Ctrl+Shift+G';
    this.mainWindow = null;
  }

  // メインウィンドウの参照を設定
  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  // 録音トグル機能を初期化
  initialize() {
    const toggleRecording = () => {
      // レンダラープロセスに録音トグルを通知
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('toggle-recording-hotkey');
        console.log('録音トグルリクエストを送信');
      }
    };

    // ホットキーを登録
    try {
      const success = globalShortcut.register(this.hotkey, toggleRecording);
      
      if (success) {
        console.log(`ホットキー登録成功: ${this.hotkey}`);
        return true;
      } else {
        console.error(`ホットキー登録失敗: ${this.hotkey} - 他のアプリケーションで既に使用されている可能性があります`);
        return false;
      }
    } catch (error) {
      console.error('ホットキー登録エラー:', error);
      return false;
    }
  }

  // ホットキーを解除
  unregister() {
    globalShortcut.unregister(this.hotkey);
    console.log(`ホットキー解除: ${this.hotkey}`);
  }

  // すべてのホットキーを解除
  unregisterAll() {
    globalShortcut.unregisterAll();
  }

  // 現在のホットキーを取得
  getCurrentHotkey() {
    return this.hotkey;
  }
}

module.exports = HotkeyManager;