import { Button, Container, Typography, CircularProgress, Box } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import stories from '../data/Stories';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// מגדירים ל-pdf.js מאיפה לטעון את ה-worker
pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const StoryPage = () => {
  const { id } = useParams();
  const story = stories.find(s => s.id === parseInt(id, 10));
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageWidth, setPageWidth] = useState(window.innerWidth * 0.9);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newWidth = width * 0.9;
      if (width > 1200) newWidth = 1000;
      else if (width > 900) newWidth = 800;
      else if (width > 600) newWidth = 600;
      else newWidth = width * 0.95;
      setPageWidth(newWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!story) {
    return (
      <Container sx={{ p: { xs: 1, sm: 2, md: 3 }, textAlign: 'center', maxWidth: 'md' }}>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' } }}>
          סיפור לא נמצא
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          sx={{ mt: 2, width: { xs: '100%', sm: 'auto' } }}
        >
          חזור לדף הבית
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ p: { xs: 1, sm: 2, md: 3 }, textAlign: 'center', maxWidth: 'lg' }}>
      <Document
        file={story.pdf}
        loading={
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="60vh"
          >
            <CircularProgress size={80} />
          </Box>
        }
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
          setError(null);
          setLoading(false);
        }}
        onLoadError={(e) => setError(e.message)}
      >
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            שגיאה בטעינת הקובץ: {error}
          </Typography>
        )}

        {!loading && numPages &&
          Array.from({ length: numPages }, (_, i) => (
            <Box
              key={i}
              display="flex"
              justifyContent="center"
              mb={2}
            >
              <Page
                pageNumber={i + 1}
                renderAnnotationLayer={false}
                renderTextLayer
                width={pageWidth}
                scale={0.9}
              />
            </Box>
          ))}
      </Document>

      {!loading && (
        <Button
          component={Link}
          to="/"
          variant="contained"
          sx={{ mt: 3, width: { xs: '100%', sm: 'auto' } }}
        >
          חזור לדף הבית
        </Button>
      )}
    </Container>
  );
};

export default StoryPage;
