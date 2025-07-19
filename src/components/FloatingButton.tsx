import React from 'react';
import { Box, IconButton } from '@mui/material';
import { Mic as MicIcon } from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(244, 67, 54, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
`;

const FloatingButtonContainer = styled(Box)(() => ({
  position: 'relative',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
  WebkitAppRegion: 'no-drag',  // ボタン部分はドラッグを無効にしてクリックを有効にする
  overflow: 'hidden',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const StyledIconButton = styled(IconButton)<{ isRecording: boolean }>(({ isRecording }) => ({
  width: '100%',
  height: '100%',
  backgroundColor: isRecording ? '#f44336' : '#2196F3',
  color: 'white',
  '&:hover': {
    backgroundColor: isRecording ? '#d32f2f' : '#1976D2',
  },
  ...(isRecording && {
    animation: `${pulse} 1.5s infinite`,
  }),
}));

interface FloatingButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ isRecording, onToggle, onContextMenu }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 親のドラッグイベントを停止
    onToggle();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e);
    }
  };

  return (
    <FloatingButtonContainer onContextMenu={handleContextMenu}>
      <StyledIconButton isRecording={isRecording} onClick={handleClick}>
        <MicIcon sx={{ fontSize: 30 }} />
      </StyledIconButton>
    </FloatingButtonContainer>
  );
};

export default FloatingButton;