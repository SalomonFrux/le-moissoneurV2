import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Paper, List, ListItem, ListItemText, Alert } from '@mui/material';
import { scraperStatusService } from '@/services/scraperStatusService';
import { ScraperStatus as ScraperStatusType } from './types';

interface ScraperStatusProps {
  scraperId: string;
}

export const ScraperStatus: React.FC<ScraperStatusProps> = ({ scraperId }) => {
  const [status, setStatus] = useState<ScraperStatusType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scraperId) {
      setError('No scraper ID provided');
      return;
    }

    const handleStatusUpdate = (newStatus: ScraperStatusType) => {
      setStatus(newStatus);
      if (newStatus.error) {
        setError(newStatus.error);
      } else {
        setError(null);
      }
    };

    // Connect to SSE
    scraperStatusService.connect(scraperId, handleStatusUpdate);

    // Cleanup on unmount
    return () => {
      scraperStatusService.disconnect();
    };
  }, [scraperId]);

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!status) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
        <CircularProgress />
      </Box>
    );
  }

  const progress = status.totalItems > 0
    ? Math.round((status.currentPage / status.totalItems) * 100)
    : 0;

  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Scraping Status: {status.status}
      </Typography>
      
      <Box sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <CircularProgress
              variant="determinate"
              value={progress}
              sx={{ width: '100%' }}
            />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
              {`${progress}%`}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Page {status.currentPage} of {status.totalItems}
        </Typography>
      </Box>

      {status.messages && status.messages.length > 0 && (
        <List>
          {status.messages.map((message) => (
            <ListItem key={message.id}>
              <ListItemText
                primary={message.text}
                secondary={new Date(message.timestamp).toLocaleString()}
                sx={{
                  color: message.type === 'error' ? 'error.main' : 'text.primary'
                }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}; 