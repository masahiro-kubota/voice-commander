import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Visibility,
  VisibilityOff,
  Check as CheckIcon,
} from '@mui/icons-material';

// APIキー検証用の定数
const MIN_API_KEY_LENGTH = 20;

// タイマー定数
const TIMERS = {
  SUCCESS_MESSAGE_DURATION: 1500
};

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // ダイアログが開いたときに現在のAPIキーを読み込む
  useEffect(() => {
    if (open) {
      loadApiKey();
    }
  }, [open]);

  const loadApiKey = async () => {
    try {
      const key = await window.electronAPI.getApiKey();
      setApiKey(key || '');
    } catch (err) {
      console.error('APIキーの読み込みエラー:', err);
    }
  };

  const validateApiKey = (key: string) => {
    if (!key || key.trim() === '') {
      return 'APIキーを入力してください';
    }
    if (!key.startsWith('sk-')) {
      return 'APIキーは "sk-" で始まる必要があります';
    }
    if (key.length < MIN_API_KEY_LENGTH) {
      return 'APIキーが短すぎます';
    }
    return null;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    const validationError = validateApiKey(apiKey);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setIsValidating(true);

    try {
      // APIキーの有効性をテスト
      const isValid = await window.electronAPI.testApiKey(apiKey);
      
      if (!isValid) {
        setError('APIキーが無効です。正しいキーを入力してください。');
        setLoading(false);
        setIsValidating(false);
        return;
      }

      // APIキーを保存
      const saved = await window.electronAPI.setApiKey(apiKey);
      
      if (saved) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, TIMERS.SUCCESS_MESSAGE_DURATION);
      } else {
        setError('APIキーの保存に失敗しました');
      }
    } catch (err) {
      setError((err as Error).message || 'エラーが発生しました');
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon />
          <Typography variant="h6">設定</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            OpenAI APIキーを入力してください。
            APIキーは暗号化されて安全に保存されます。
          </Typography>
          
          <TextField
            fullWidth
            label="OpenAI API キー"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            margin="normal"
            placeholder="sk-..."
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowApiKey(!showApiKey)}
                    edge="end"
                    disabled={loading}
                  >
                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert 
              severity="success" 
              icon={<CheckIcon />}
              sx={{ mt: 2 }}
            >
              APIキーが正常に保存されました
            </Alert>
          )}
          
          {isValidating && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                APIキーを検証中...
              </Typography>
            </Box>
          )}
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            APIキーは <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Dashboard</a> から取得できます。
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading || !apiKey.trim()}
        >
          {loading ? <CircularProgress size={24} /> : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;