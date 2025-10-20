import { Box, Button, Container, TextField, Typography } from '@mui/material';
import mammoth from "mammoth";
import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useComments } from '../context/CommentsContext';
import stories from './Stories';
import DownloadIcon from '@mui/icons-material/Download';

const StoryPage = () => {
  const { id } = useParams();
  const story = stories.find(s => s.id === parseInt(id, 10));

  const { addComment } = useComments();
  const [form, setForm] = useState({
    name: "",
    email: "",
    comment: ""
  });
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    comment: false
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const contentRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const isSyncing = useRef(false);
  const [scrollHeight, setScrollHeight] = useState(0);

  // ============================
  // Effects
  // ============================
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  useEffect(() => {
    if (contentRef.current) { setScrollHeight(contentRef.current.scrollHeight); }
  }, [content, loading]);

  useEffect(() => {
    if (!story?.docx) return;

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
  }, [story]);

  // ============================
  // פונקציות
  // ============================
  const handleInputChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async () => {
    let tempErrors = { ...errors };
    let hasError = false;

    if (!form.name.trim()) {
      tempErrors.name = true;
      hasError = true;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      tempErrors.email = true;
      hasError = true;
    }
    if (!form.comment.trim()) {
      tempErrors.comment = true;
      hasError = true;
    }

    if (hasError) {
      setErrors(tempErrors);
      return;
    }

    await addComment(form.name, story.id, story.title, form.comment, form.email);

    // איפוס השדות לאחר שליחה
    setForm({ name: "", email: "", comment: "" });
    setErrors({ name: false, email: false, comment: false });

    setSuccessMessage("!!!התגובה שלך נחתה בבטחה במערכת! תודה רבה")
    setTimeout(() => setSuccessMessage(""), 3000);
  };

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

  const handleDownloadPDF = () => {
    if (story?.pdf) {
      const link = document.createElement('a');
      link.href = story.pdf;
      link.download = story.title + ".pdf";
      link.click();
    }
  }

  const isAllowedLine = (line) => {
    const noSpace = line.replace(/\s/g, '');
    if (noSpace === '') return true;
    return /^[\u05D0-\u05EA\u05F3\u05F4!?"'.,()-]+$/u.test(noSpace);
  }

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

  // ============================
  // תצוגת הרכיב
  // ============================
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
            {content.split("\n").map((line, idx) => {
              const trimmed = line.trim();

              if (trimmed === "") {
                return <Box key={idx} sx={{ height: "0.6em" }} />;
              }
              if (isAllowedLine(line)) {
                return (
                  <Typography
                    key={idx}
                    variant='body1'
                    align='right'
                    sx={{
                      fontSize: "1rem",
                      lineHeight: 1.9,
                      direction: "rtl",
                      whiteSpace: "pre-wrap",
                      unicodeBidi: "plaintext",
                      mb: 0.5,
                    }}
                  >
                    {line}
                  </Typography>
                );
              }
              else {
                return (
                  <Box key={idx} sx={{ textAlign: "center", my: 2 }}>
                    <Typography
                      variant='body1'
                      sx={{
                        fontSize: "1rem",
                        lineHeight: 1.9,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {line}
                    </Typography>
                  </Box>
                );
              }
            })}
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
              label={
                <span>
                  שם<span style={{ color: "red" }}>*</span>
                </span>
              }
              value={form.name}
              onChange={handleInputChange("name")}
              fullWidth
              sx={{ mt: 2 }}
              InputProps={{ style: { textAlign: "right" } }}
              error={errors.name}
              helperText={errors.name ? "אנא הזן שם" : ""}
            />
            <TextField
              label={
                <span>
                  <span style={{ color: "red" }}>*</span>מייל
                </span>
              }
              value={form.email}
              // onChange={handleInputChange("email")}
              fullWidth
              dir="rtl"
              sx={{ mt: 2 }}
              InputProps={{ style: { textAlign: "right" } }}
              onChange={(e) => {
                const value = e.target.value;
                setForm((prev) => ({ ...prev, email: value }));

                // בדיקת תקינות בזמן אמת
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                const isValid = emailRegex.test(value.trim());

                // עדכון השגיאה דינמית כמו ב־CommentPage
                setErrors((prev) => ({ ...prev, email: !isValid }));
              }}
              error={errors.email}
              helperText={errors.email ? "אנא הזן כתובת מייל תקינה" : ""}
            />
            <TextField
              label={
                <span>
                  תוכן התגובה<span style={{ color: "red" }}>*</span>
                </span>
              }
              value={form.comment}
              onChange={handleInputChange("comment")}
              multiline
              rows={4}
              fullWidth
              sx={{ mt: 2 }}
              InputProps={{ style: { textAlign: "right" } }}
              error={errors.comment}
              helperText={errors.comment ? "אנא הזן תוכן תגובה" : ""}
            />
            {successMessage && (
              <Typography color="success.main" sx={{ mt: 2, mb: 1 }}>
                {successMessage}
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button variant="contained" color="primary" onClick={handleSubmit}>
                שלח תגובה
              </Button>
            </Box>
          </Box>
        </Box>
      )
      }
      {
        !loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3 }}>
            <Button
              variant='contained'
              color='secondary'
              startIcon={< DownloadIcon />}
              onClick={handleDownloadPDF}
            >
            </Button>
            <Button component={Link} to="/" variant="contained">
              חזור לדף הבית
            </Button>
          </Box>
        )
      }
    </Container >
  );
};

export default StoryPage;
