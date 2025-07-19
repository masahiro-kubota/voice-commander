import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Container, Typography, Snackbar, CircularProgress, Alert, IconButton, Chip } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import RecordButton from './components/RecordButton';
import TranscriptDisplay from './components/TranscriptDisplay';
import CopyButton from './components/CopyButton';
import SettingsDialog from './components/SettingsDialog';

// 定数
const TIMERS = {
  COPY_RESET: 2000
};

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [platformHotkey, setPlatformHotkey] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);


  const handleToggleRecording = async () => {
    if (isRecording) {
      // 録音停止
      stopRecording();
    } else {
      // 録音開始
      await startRecording();
    }
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
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
      
    } catch (err: unknown) {
      console.error('録音開始エラー:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('マイクへのアクセスが拒否されました。');
      }
    }
  }, []);
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const processAudio = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    
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
        setTranscript(transcribedText);
        
        // 自動的にクリップボードにコピー（Electron経由）
        if (transcribedText) {
          const clipboardResult = await window.electronAPI.writeToClipboard(transcribedText);
          if (clipboardResult.success) {
            setIsCopied(true);
            setSnackbarOpen(true);
            setTimeout(() => setIsCopied(false), TIMERS.COPY_RESET);
          }
        }
      } else {
        throw new Error(result.error || '文字起こしに失敗しました');
      }
    } catch (err: unknown) {
      console.error('文字起こしエラー:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('文字起こし中にエラーが発生しました。');
      }
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript);
    setIsCopied(true);
    setSnackbarOpen(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // プラットフォームに応じたホットキーを設定
  useEffect(() => {
    // Electronから現在のプラットフォームのホットキーを取得
    window.electronAPI.getCurrentHotkey().then((hotkey: string) => {
      setPlatformHotkey(hotkey);
    });
  }, []);

  // ホットキートグルのハンドラー
  const handleHotkeyToggle = useCallback(() => {
    console.log('ホットキー押下を検出');
    // isRecordingの最新の値を使用するため、直接状態を更新
    setIsRecording(prev => {
      if (prev) {
        // 録音停止
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        return false;
      } else {
        // 録音開始
        startRecording();
        return true;
      }
    });
  }, [startRecording]);

  // ホットキーイベントのリスナーを設定
  useEffect(() => {
    const removeCallback = window.electronAPI.onHotkeyToggle(handleHotkeyToggle);

    return () => {
      window.electronAPI.removeHotkeyListener(removeCallback);
    };
  }, [handleHotkeyToggle]);
  
  // 設定ダイアログを開くイベントを受信
  useEffect(() => {
    const handleOpenSettings = () => {
      setSettingsOpen(true);
    };
    
    window.electronAPI.onMessage('open-settings', handleOpenSettings);
    
    return () => {
      // クリーンアップ処理（必要に応じて）
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Voice Commander
            </Typography>
            <IconButton 
              onClick={() => setSettingsOpen(true)}
              color="primary"
              sx={{ mb: 1 }}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
          
          <Chip 
            label={`ホットキー: ${platformHotkey || 'Ctrl+Shift+G'}`} 
            size="small" 
            sx={{ mb: 2 }}
          />

          <Box sx={{ my: 4 }}>
            <RecordButton
              isRecording={isRecording}
              onToggleRecording={handleToggleRecording}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: '100%', maxWidth: '600px' }}>
              {error}
            </Alert>
          )}
          
          {isProcessing && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>文字起こし中...</Typography>
            </Box>
          )}
          
          {transcript && !isProcessing && (
            <>
              <TranscriptDisplay transcript={transcript} />
              
              <Box sx={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'flex-end' }}>
                <CopyButton
                  text={transcript}
                  isCopied={isCopied}
                  onCopy={handleCopy}
                />
              </Box>
            </>
          )}
        </Box>
      </Container>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        message="コピーしました"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </ThemeProvider>
  );
}

export default App;