// Electron API の型定義
interface ElectronAPI {
  // API キー管理
  getApiKey: () => Promise<string>;
  setApiKey: (apiKey: string) => Promise<boolean>;
  testApiKey: (apiKey: string) => Promise<boolean>;
  
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
}

interface Window {
  electronAPI: ElectronAPI;
}