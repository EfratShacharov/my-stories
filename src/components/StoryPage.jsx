import { Box, Button, Container, TextField, Typography } from '@mui/material';
import mammoth from "mammoth";
import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useComments } from '../context/CommentsContext';
import stories from './Stories';

const StoryPage = () => {
  const { id } = useParams();
  const story = stories.find(s => s.id === parseInt(id, 10));

  const { addComment } = useComments();
  const [newComment, setNewComment] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrollHeight, setScrollHeight] = useState(0);

  const contentRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      setScrollHeight(contentRef.current.scrollHeight);
    }
  }, [content, loading]);

  useEffect(() => {
    if (story?.docx) {
      fetch(story.docx)
        .then(res => res.arrayBuffer())
        .then(buffer => mammoth.extractRawText({ arrayBuffer: buffer }))
        .then(result => {
          const lines = result.value.split("\n");
          let filtered = lines.filter(line => !line.includes(")") && !/[A-Za-z]/.test(line));
          filtered = filtered.filter(line => line.trim() !== "");
          setContent(filtered.join("\n"));
          setError(null);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [story]);

  const syncScroll = (sourceRef, targetRefs) => {
    if (!sourceRef.current || isSyncing.current) return;
    isSyncing.current = true;

    const scrollTop = sourceRef.current.scrollTop;
    targetRefs.forEach(ref => {
      if (ref.current) ref.current.scrollTop = scrollTop;
    });

    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  if (!story) {
    return (
      <Container sx={{ textAlign: 'center' }}>
        <Typography variant="h5">סיפור לא נמצא</Typography>
        <Button component={Link} to="/" variant="contained" sx={{ mt: 2 }}>
          חזור לדף הבית
        </Button>
      </Container>
    );
  }

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addComment(story.id, story.title, newComment);
    setNewComment("");
  };

  return (
    <Container
      sx={{
        p: 2,
        maxWidth: 'lg',
        height: "calc(100vh - 64px)",
        display: 'flex',
        flexDirection: 'column',
        overflow: "hidden",
        pt: "70px",
      }}
    >
      {!loading && !error && (
        <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0 }}>
          {/* גולל שמאלי */}
          <Box
            ref={leftRef}
            sx={{
              width: "20px",
              overflowY: "auto",
              height: "100%",
              cursor: "pointer",
            }}
            onScroll={() => syncScroll(leftRef, [contentRef, rightRef])}
          >
            <Box sx={{ height: scrollHeight }} />
          </Box>

          {/* טקסט מרכזי */}
          <Box
            ref={contentRef}
            sx={{
              flex: 1,
              p: 2,
              mt: 2,
              height: "100%",
              overflowY: "auto",
              position: "relative",
              "&::-webkit-scrollbar": { width: "10px" },
            }}
            onScroll={() => syncScroll(contentRef, [leftRef, rightRef])}
          >
            <Typography
              variant="body1"
              align='right'
              sx={{
                fontSize: "1rem",
                lineHeight: 1.9,
                direction: "rtl",
                whiteSpace: "pre-wrap",
                unicodeBidi: "plaintext",
              }}
            >
              {content}
            </Typography>
          </Box>

          {/* גולל ימני */}
          <Box
            ref={rightRef}
            sx={{
              width: "20px",
              overflowY: "auto",
              height: "100%",
              cursor: "pointer"
            }}
            onScroll={() => syncScroll(rightRef, [contentRef, leftRef])}
          >
            <Box sx={{ height: scrollHeight }} />
          </Box>

          {/* טופס הוספת תגובה */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" align="right">
              תנו את תגובתכם על הסיפור
            </Typography>
            <TextField
              label="תוכן התגובה"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              multiline
              rows={4}
              fullWidth
              sx={{ mt: 2 }}
              InputProps={{ style: { textAlign: "right" } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button variant="contained" color="primary" onClick={handleSubmit}>
                שלח תגובה
              </Button>
            </Box>
          </Box>
        </Box>
      )}
      {!loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3 }}>
          <Button component={Link} to="/" variant="contained">
            חזור לדף הבית
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default StoryPage;
