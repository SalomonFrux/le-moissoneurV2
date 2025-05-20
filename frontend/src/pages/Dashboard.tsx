import React, { useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { ScraperStatus } from '@/components/scraper/ScraperStatus';

export const Dashboard: React.FC = () => {
  const [scraperId, setScraperId] = useState<string | null>(null);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        {scraperId && <ScraperStatus scraperId={scraperId} />}
      </Box>
    </Container>
  );
}; 