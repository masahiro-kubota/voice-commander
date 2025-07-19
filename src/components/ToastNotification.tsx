import React, { useEffect } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const ToastContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  minWidth: 300,
  maxWidth: 400,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  borderRadius: 8,
  padding: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  zIndex: 9999,
}));

const SuccessHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  color: '#4caf50',
}));

const TranscriptText = styled(Typography)(({ theme }) => ({
  color: 'white',
  fontSize: '14px',
  wordBreak: 'break-word',
}));

interface ToastNotificationProps {
  open: boolean;
  transcript: string;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ open, transcript, onClose }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  return (
    <Fade in={open} timeout={300}>
      <ToastContainer>
        <SuccessHeader>
          <CheckIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            コピーしました
          </Typography>
        </SuccessHeader>
        <TranscriptText variant="body2">
          {transcript}
        </TranscriptText>
      </ToastContainer>
    </Fade>
  );
};

export default ToastNotification;