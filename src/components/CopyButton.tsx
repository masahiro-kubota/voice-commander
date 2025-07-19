import React from 'react';
import { Button } from '@mui/material';
import { ContentCopy as ContentCopyIcon, Check as CheckIcon } from '@mui/icons-material';

interface CopyButtonProps {
  text: string;
  isCopied: boolean;
  onCopy: () => void;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, isCopied, onCopy }) => {
  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      startIcon={isCopied ? <CheckIcon /> : <ContentCopyIcon />}
      onClick={onCopy}
      disabled={!text}
      sx={{
        minWidth: '140px',
        fontSize: '16px',
        padding: '10px 24px',
      }}
    >
      {isCopied ? 'コピー済み' : 'コピー'}
    </Button>
  );
};

export default CopyButton;