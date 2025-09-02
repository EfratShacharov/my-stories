import { Button, Container, Typography } from '@mui/material';
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import stories from '../data/Stories';
import { Document, Page, pdfjs } from 'react-pdf';
//טוענות את קבצי ה-CSS של react-pdf כך שהטקסט וההערות ב-PDF יוצגו נכון.
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

//השורה הזו קובעת ל - pdf.js מאיפה לטעון את קובץ ה-worker שמטפל בפיענוח pdf ברקע.
pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const StoryPage = () => {
  const { id } = useParams();
  const story = stories.find(s => s.id === parseInt(id, 10));
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);

  if (!story) {
    return (
      <Container style={{ padding: 20, textAlign: 'right' }}>
        <Typography variant="h5">סיפור לא נמצא</Typography>
        <Button component={Link} to="/" variant="contained" style={{ marginTop: 10 }}>
          חזור לדף הבית
        </Button>
      </Container>
    );
  }

  return (
    <Container style={{ padding: 20, textAlign: 'right' }}>
      <Typography variant="h4" style={{ marginBottom: 20 }}>
        {story.title}
      </Typography>

      <Document
        file={story.pdf}
        onLoadSuccess={({ numPages }) => { setNumPages(numPages); setError(null); }}
        onLoadError={(e) => setError(e.message)}
      >
        {error && (
          <Typography color="error" style={{ marginBottom: 10 }}>
            שגיאה בטעינת הקובץ: {error}
          </Typography>
        )}

        {numPages && Array.from({ length: numPages }, (_, i) => (
          <div key={i} style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
            <Page
              pageNumber={i + 1}
              renderAnnotationLayer={false}
              renderTextLayer={true}
              width={800}
            />
          </div>
        ))}
      </Document>

      <Button component={Link} to="/" variant="contained" style={{ marginTop: 20 }}>
        חזור לדף הבית
      </Button>
    </Container>
  );
};

export default StoryPage;
