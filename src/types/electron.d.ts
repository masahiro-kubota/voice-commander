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
  sendMessage: (channel: string, data: any) => void;
  onMessage: (channel: string, func: (...args: any[]) => void) => void;
  
  // ホットキー関連
  onHotkeyToggle: (callback: () => void) => () => void;
  removeHotkeyListener: (callback?: () => void) => void;
  getCurrentHotkey: () => Promise<string>;
  
  // クリップボード
  writeToClipboard: (text: string) => Promise<{ success: boolean; error?: string }>;
}

interface Window {
  electronAPI: ElectronAPI;
}