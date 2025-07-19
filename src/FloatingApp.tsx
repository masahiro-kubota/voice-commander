import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import FloatingButton from './components/FloatingButton';

// 定数
const AUDIO_CONFIG = {
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true
};

const AUDIO_VOLUME = 0.5;

function FloatingApp() {
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // 成功音を再生
  const playSuccessSound = useCallback(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRpQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXAFAACCAHgAeQB4AHgAeQB4AHgAeQB4AHgAeQB4AHgAeQB4AHgAeQB4AHgAeQB4AHgAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAegB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAeQB5AHkAegB5AHkAeQB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgA');
    audio.volume = AUDIO_VOLUME;
    audio.play().catch(e => console.log('音声再生エラー:', e));
  }, []);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    try {
      // Electron経由で文字起こし
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const result = await window.electronAPI.transcribeAudio(
        uint8Array,
        { language: 'ja', responseFormat: 'verbose_json' }
      );
      
      if (result.success && result.data) {
        const transcribedText = result.data.text;
        
        // 自動的にクリップボードにコピー（Electron経由）
        if (transcribedText) {
          const clipboardResult = await window.electronAPI.writeToClipboard(transcribedText);
          if (clipboardResult.success) {
            playSuccessSound();
          }
        }
      } else if (result.error) {
        // エラーメッセージをトーストで表示
        if (result.error.includes('APIキーが設定されていません')) {
          window.electronAPI.showErrorToast('APIキーが設定されていません。右クリックで設定してください。');
        } else {
          window.electronAPI.showErrorToast('文字起こしに失敗しました: ' + result.error);
        }
      }
    } catch (err: unknown) {
      console.error('文字起こしエラー:', err);
      window.electronAPI.showErrorToast('エラーが発生しました: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [playSuccessSound]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: AUDIO_CONFIG 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // 文字起こし処理
        await processAudio(audioBlob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      // Electronに録音状態を通知
      window.electronAPI.updateRecordingState(true);
      
    } catch (err: unknown) {
      console.error('録音開始エラー:', err);
    }
  }, [processAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Electronに録音状態を通知
      window.electronAPI.updateRecordingState(false);
    }
  }, []);

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // 右クリックメニューのハンドラー
  const handleContextMenu = useCallback((_e: React.MouseEvent) => {
    // メインプロセスに右クリックイベントを通知
    window.electronAPI.showContextMenu();
  }, []);

  // ドラッグ処理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // ボタンのクリックエリア以外でドラッグを開始
    if (e.target !== e.currentTarget) return;
    
    setIsDragging(true);
    dragStartRef.current = { x: e.screenX, y: e.screenY };
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.screenX - dragStartRef.current.x;
      const deltaY = e.screenY - dragStartRef.current.y;
      
      // Electronのウィンドウを移動
      if (window.electronAPI && window.electronAPI.moveWindow) {
        window.electronAPI.moveWindow(deltaX, deltaY);
      }
      
      dragStartRef.current = { x: e.screenX, y: e.screenY };
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // ホットキーイベントのリスナーを設定
  useEffect(() => {
    const handleHotkeyToggle = () => {
      console.log('ホットキー押下を検出（FloatingApp）');
      handleToggleRecording();
    };

    const removeCallback = window.electronAPI.onHotkeyToggle(handleHotkeyToggle);

    return () => {
      window.electronAPI.removeHotkeyListener(removeCallback);
    };
  }, [handleToggleRecording]);

  return (
    <ThemeProvider theme={theme}>
      <div 
        style={{ 
          background: 'transparent', 
          width: '80px', 
          height: '80px',
          position: 'relative',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        <FloatingButton 
          isRecording={isRecording} 
          onToggle={handleToggleRecording}
          onContextMenu={handleContextMenu}
        />
      </div>
    </ThemeProvider>
  );
}

export default FloatingApp;