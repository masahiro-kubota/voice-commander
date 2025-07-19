import React from 'react';
import { Fab } from '@mui/material';
import { Mic as MicIcon, Stop as StopIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface RecordButtonProps {
  isRecording: boolean;
  onToggleRecording: () => void;
}

const PulsingFab = styled(Fab, {
  shouldForwardProp: (prop) => prop !== 'isRecording',
})<{ isRecording: boolean }>(({ theme, isRecording }) => ({
  ...(isRecording && {
    animation: 'pulse 1.5s ease-in-out infinite',
    backgroundColor: theme.palette.error.main,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
  }),
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
      boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.7)',
    },
    '70%': {
      transform: 'scale(1.05)',
      boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)',
    },
    '100%': {
      transform: 'scale(1)',
      boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)',
    },
  },
}));

const RecordButton: React.FC<RecordButtonProps> = ({ isRecording, onToggleRecording }) => {
  return (
    <PulsingFab
      color={isRecording ? 'error' : 'primary'}
      size="large"
      onClick={onToggleRecording}
      isRecording={isRecording}
    >
      {isRecording ? <StopIcon /> : <MicIcon />}
    </PulsingFab>
  );
};

export default RecordButton;