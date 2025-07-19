import React, { useState } from 'react';
import { Box, Container, Typography, Snackbar } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import RecordButton from './components/RecordButton';
import TranscriptDisplay from './components/TranscriptDisplay';
import CopyButton from './components/CopyButton';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(
    'これは音声認識のテストテキストです。実際の音声認識が実装されると、ここに認識結果が表示されます。'
  );
  const [isCopied, setIsCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript);
    setIsCopied(true);
    setSnackbarOpen(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

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
          <Typography variant="h4" component="h1" gutterBottom>
            Voice Transcriber
          </Typography>

          <Box sx={{ my: 4 }}>
            <RecordButton
              isRecording={isRecording}
              onToggleRecording={handleToggleRecording}
            />
          </Box>

          {transcript && (
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
    </ThemeProvider>
  );
}

export default App;