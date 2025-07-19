import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { 
  Box, 
  TextField, 
  IconButton, 
  InputAdornment,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Check as CheckIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import theme from './theme';

// 定数
const TIMERS = {
  FOCUS_DELAY: 100,
  CLOSE_DELAY: 1000
};

const SIZES = {
  ICON_SMALL: 20,
  PADDING: 12,
  FONT_SIZE: 14,
  ERROR_FONT_SIZE: 12
};

const COLORS = {
  BACKGROUND: 'rgba(0, 0, 0, 0.9)',
  INPUT_BACKGROUND: 'rgba(255, 255, 255, 0.05)',
  INPUT_BORDER: 'rgba(255, 255, 255, 0.2)',
  INPUT_BORDER_HOVER: 'rgba(255, 255, 255, 0.3)',
  INPUT_BORDER_FOCUS: '#2196F3',
  PLACEHOLDER: 'rgba(255, 255, 255, 0.5)',
  ICON: 'rgba(255, 255, 255, 0.7)',
  ERROR: '#f44336',
  SUCCESS: '#4caf50',
  PRIMARY: '#2196F3',
  DISABLED: 'rgba(255, 255, 255, 0.3)'
};

function ApiKeyInput() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 初期表示時にAPIキーを取得
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const key = await window.electronAPI.getApiKey();
        if (key) {
          setApiKey(key);
        }
      } catch (err) {
        console.error('APIキーの読み込みエラー:', err);
      }
    };
    loadApiKey();
    
    // フォーカスを設定
    setTimeout(() => {
      inputRef.current?.focus();
    }, TIMERS.FOCUS_DELAY);
  }, []);

  const handleSave = async () => {
    if (!apiKey || loading || validating) return;
    
    setError(null);
    setValidating(true);
    
    try {
      // APIキーを検証
      const isValid = await window.electronAPI.testApiKey(apiKey);
      
      if (!isValid) {
        setError('無効なAPIキーです');
        setValidating(false);
        return;
      }
      
      // APIキーを保存
      setLoading(true);
      const result = await window.electronAPI.setApiKey(apiKey);
      if (result) {
        setSaved(true);
        setTimeout(() => {
          try {
            try {
        window.close();
      } catch (e) {
        console.error('ウィンドウを閉じる際にエラーが発生しました:', e);
      }
          } catch (e) {
            console.error('ウィンドウを閉じる際にエラーが発生しました:', e);
          }
        }, TIMERS.CLOSE_DELAY);
      } else {
        setError('保存に失敗しました');
      }
    } catch (err) {
      console.error('APIキーの保存エラー:', err);
      setError('エラーが発生しました');
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      try {
        window.close();
      } catch (e) {
        console.error('ウィンドウを閉じる際にエラーが発生しました:', e);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: COLORS.BACKGROUND,
          borderRadius: '8px',
          padding: `${SIZES.PADDING}px`,
          boxSizing: 'border-box',
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          type={showApiKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="OpenAI API Key (sk-...)"
          disabled={loading || saved}
          autoComplete="off"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: COLORS.INPUT_BACKGROUND,
              color: 'white',
              '& fieldset': {
                borderColor: COLORS.INPUT_BORDER,
              },
              '&:hover fieldset': {
                borderColor: COLORS.INPUT_BORDER_HOVER,
              },
              '&.Mui-focused fieldset': {
                borderColor: COLORS.INPUT_BORDER_FOCUS,
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
              fontSize: `${SIZES.FONT_SIZE}px`,
              '&::placeholder': {
                color: COLORS.PLACEHOLDER,
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={loading || saved}
                  sx={{ color: COLORS.ICON }}
                >
                  {showApiKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
                {loading || validating ? (
                  <CircularProgress size={SIZES.ICON_SMALL} sx={{ ml: 1 }} />
                ) : saved ? (
                  <CheckIcon sx={{ color: COLORS.SUCCESS, ml: 1 }} />
                ) : (
                  <Tooltip title="保存 (Enter)">
                    <IconButton
                      size="small"
                      onClick={handleSave}
                      sx={{ 
                        color: apiKey ? COLORS.PRIMARY : COLORS.DISABLED,
                        ml: 1
                      }}
                      disabled={!apiKey}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="キャンセル (Esc)">
                  <IconButton
                    size="small"
                    onClick={() => window.close()}
                    sx={{ color: COLORS.ICON, ml: 0.5 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
        {error && (
          <Box
            sx={{
              mt: 1,
              color: COLORS.ERROR,
              fontSize: `${SIZES.ERROR_FONT_SIZE}px`,
              textAlign: 'center',
            }}
          >
            {error}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default ApiKeyInput;