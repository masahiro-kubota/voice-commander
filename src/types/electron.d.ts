// Electron API の型定義
interface ElectronAPI {
  // API キー管理
  getApiKey: () => Promise<string>; // 保存されているAPIキーを取得
  setApiKey: (apiKey: string) => Promise<boolean>; // APIキーを保存（成功時true）
  testApiKey: (apiKey: string) => Promise<boolean>; // APIキーの有効性を検証（有効ならtrue）
  
  // 音声文字起こし
  transcribeAudio: (
    audioBuffer: Uint8Array,
    options: {
      language?: string;
      responseFormat?: string;
    }
  ) => Promise<{
    success: boolean;
    data?: {
      text: string;
      language?: string;
    };
    error?: string;
  }>;
  
  // 既存のメッセージング
  sendMessage: (channel: string, data: unknown) => void;
  onMessage: (channel: string, func: (...args: unknown[]) => void) => void;
  
  // ホットキー関連
  onHotkeyToggle: (callback: () => void) => () => void;
  removeHotkeyListener: (callback?: () => void) => void;
  getCurrentHotkey: () => Promise<string>;
  
  // クリップボード
  writeToClipboard: (text: string) => Promise<{ success: boolean; error?: string }>;
  
  // フローティングウィンドウ用
  toggleRecording: () => void;
  updateRecordingState: (isRecording: boolean) => void;
  onToggleRecording: (callback: () => void) => void;
  removeToggleListener: () => void;
  onRecordingStateChange: (callback: (state: boolean) => void) => void;
  showMainWindow: () => void;
  
  // ウィンドウ移動
  moveWindow: (deltaX: number, deltaY: number) => void;
  
  // コンテキストメニューを表示
  showContextMenu: () => void;
  
  // エラートーストを表示
  showErrorToast: (message: string) => void;
}

interface Window {
  electronAPI: ElectronAPI;
}