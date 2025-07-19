import React from 'react';
import { Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

interface TranscriptDisplayProps {
  transcript: string;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: theme.palette.background.paper,
  '& .MuiTypography-root': {
    userSelect: 'text',
    fontSize: '18px',
    lineHeight: 1.6,
    color: theme.palette.text.primary,
  },
}));

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ transcript }) => {
  return (
    <StyledPaper elevation={3}>
      <Typography variant="body1">
        {transcript}
      </Typography>
    </StyledPaper>
  );
};

export default TranscriptDisplay;