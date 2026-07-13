import { Box, Button, Checkbox, CircularProgress, Divider, FormControlLabel, IconButton, TextField, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import mammoth from "mammoth";
import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useComments } from '../context/CommentsContext';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { supabase } from '../supabase';

const StoryPage = ({ session, isAdmin }) => {
  const { id } = useParams();
  const [story, setStory] = useState(null);

  useEffect(() => {
    async function loadStory() {
      const { data, error } = await supabase
        .from("stories")
        .select("id, title, docx_url, pdf_url")
        .eq("id", parseInt(id, 10))
        .single();
      if (!error && data) setStory(data);
    }
    loadStory();
  }, [id]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { addComment, notifyReply } = useComments();
  const [form, setForm] = useState({ name: "", email: "", comment: "" });
  const [errors, setErrors] = useState({ name: false, email: false, comment: false });
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const contentRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!story?.docx_url) return;
    fetch(story.docx_url)
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
      .catch(err => { setError(err.message); setLoading(false); });
  }, [story]);

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
    setScrollProgress(Math.min(100, Math.round(progress * 100)));
  };

  const handleProgressBarClick = (e) => {
    const bar = progressBarRef.current;
    const el = contentRef.current;
    if (!bar || !el) return;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = 1 - (clickX / rect.width);
    const target = fraction * (el.scrollHeight - el.clientHeight);
    el.scrollTo({ top: target, behavior: "smooth" });
  };

  const handleInputChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = async () => {
    const isLoggedIn = !!session;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const newErrors = {
      name: !isLoggedIn && !isAdmin ? !form.name.trim() : false,
      email: !isLoggedIn && !isAdmin ? (!form.email.trim() || !emailRegex.test(form.email.trim())) : false,
      comment: !form.comment.trim(),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSubmitting(true);
    const insertedCommentId = await addComment(
      form.name, story.id, story.title, form.comment, form.email,
      false, null, session?.user?.id || null, emailUpdates
    );

    if (insertedCommentId) {
      await notifyReply(insertedCommentId);
    }

    setSubmitting(false);
    setForm({ name: "", email: "", comment: "" });
    setEmailUpdates(false);
    setErrors({ name: false, email: false, comment: false });
    setSuccessMessage("התגובה שלך נשלחה וממתינה לאישור!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleDownloadPDF = async () => {
    if (story?.pdf_url) {
      const response = await fetch(story.pdf_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = story.title + ".pdf";
      link.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const isAllowedLine = (line) => {
    const noSpace = line.replace(/\s/g, '');
    if (noSpace === '') return true;
    return /^[\u05D0-\u05EA\u05F3\u05F40-9!?"'.,()-]+$/u.test(noSpace);
  };

  if (!story) return (
    <Box sx={{ textAlign: 'center', mt: 10 }}>
      <Typography variant="h5">סיפור לא נמצא</Typography>
      <Button component={Link} to="/" variant="contained" sx={{ mt: 2 }}>חזור לדף הבית</Button>
    </Box>
  );

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", pt: "64px", bgcolor: "#f8f9fa" }}>

      {/* כותרת */}
      <Box sx={{
        px: { xs: 2, md: 4 }, py: 1.5,
        bgcolor: "white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Tooltip title="הורד PDF">
          <IconButton onClick={handleDownloadPDF} size="small" color="primary">
            <DownloadIcon />
          </IconButton>
        </Tooltip>

        <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, textAlign: "center" }}>
          {story.title}
        </Typography>

        <Tooltip title="חזור לדף הבית">
          <IconButton component={Link} to="/" size="small">
            <ArrowForwardIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography color="error">שגיאה בטעינת הסיפור</Typography>
        </Box>
      )}

      {!loading && !error && (
        <Box sx={{
          flex: 1,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 0,
          overflow: "hidden",
        }}>

          {/* טופס תגובה */}
          <Box sx={{
            width: isMobile ? "100%" : 320,
            flexShrink: 0,
            height: isMobile ? "auto" : "100%",
            overflowY: isMobile ? "visible" : "auto",
            px: 3,
            py: 3,
            bgcolor: "white",
            boxShadow: isMobile ? "0 -2px 8px rgba(0,0,0,0.06)" : "none",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "#ddd", borderRadius: 2 },
          }} dir="rtl">
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              תגובה על הסיפור
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {!session && !isAdmin && (
              <>
                <TextField
                  label="שם *" fullWidth size="small" sx={{ mb: 2 }}
                  value={form.name}
                  onChange={handleInputChange("name")}
                  error={errors.name}
                  helperText={errors.name ? "אנא הזן שם" : ""}
                  inputProps={{ style: { textAlign: 'right' } }}
                />
                <TextField
                  label="מייל *" fullWidth size="small" sx={{ mb: 2 }}
                  value={form.email}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm(prev => ({ ...prev, email: v }));
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    setErrors(prev => ({ ...prev, email: !emailRegex.test(v.trim()) }));
                  }}
                  error={errors.email}
                  helperText={errors.email ? "אנא הזן כתובת מייל תקינה" : ""}
                  inputProps={{ style: { direction: 'ltr', textAlign: 'left' } }}
                />
              </>
            )}

            <TextField
              label="תוכן התגובה *" multiline rows={isMobile ? 3 : 5} fullWidth size="small" sx={{ mb: 2 }}
              value={form.comment}
              onChange={handleInputChange("comment")}
              error={errors.comment}
              helperText={errors.comment ? "אנא הזן תוכן תגובה" : ""}
              inputProps={{ style: { textAlign: 'right', direction: 'rtl' } }}
            />

            <FormControlLabel
              sx={{ mb: 2, width: '100%', mr: 0 }}
              control={
                <Checkbox
                  checked={emailUpdates}
                  onChange={(e) => setEmailUpdates(e.target.checked)}
                  size="small"
                  sx={{ color: '#6c63ff', '&.Mui-checked': { color: '#6c63ff' } }}
                />
              }
              label={<Typography variant="caption" color="text.secondary">שלחו לי עדכון במייל כאשר ישיבו לתגובה שלי</Typography>}
            />

            {successMessage && (
              <Typography color="success.main" variant="body2" sx={{ mb: 1, textAlign: "center", fontWeight: 600 }}>
                ✓ {successMessage}
              </Typography>
            )}

            <Button
              variant="contained" fullWidth onClick={handleSubmit} disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : null}
              sx={{
                background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', boxShadow: 'none',
                '&:hover': { boxShadow: '0 4px 14px rgba(108,99,255,0.35)' },
                '&.Mui-disabled': { background: 'rgba(108,99,255,0.4)', color: '#fff' }
              }}
            >
              {submitting ? 'שולח...' : 'שלח תגובה'}
            </Button>
          </Box>

          {/* מפריד אנכי (desktop בלבד) */}
          {!isMobile && <Divider orientation="vertical" flexItem />}

          {/* טקסט הסיפור */}
          <Box sx={{
            flex: isMobile ? "none" : 1,
            height: isMobile ? "calc(55vh - 16px)" : "100%",
            pb: isMobile ? 4 : 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            <Box
              ref={progressBarRef}
              onClick={handleProgressBarClick}
              style={{
                height: 4,
                backgroundColor: "#e0e0e0",
                position: "relative",
                cursor: "pointer",
                flexShrink: 0,
                direction: "ltr",
              }}
            >
              <Box
                style={{
                  height: "100%",
                  width: "100%",
                  backgroundColor: "#1976d2",
                  transition: "transform 0.15s",
                  position: "absolute",
                  top: 0,
                  right: 0,
                  left: "auto",
                  transformOrigin: "100% 50%",
                  transform: `scaleX(${scrollProgress / 100})`,
                }}
              />
            </Box>

            <Box
              ref={contentRef}
              onScroll={handleScroll}
              sx={{
                flex: 1,
                overflowY: "auto",
                px: { xs: 2.5, md: 6 },
                py: 4,
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
              }}
            >
              {content.split("\n").map((line, idx) => {
                const trimmed = line.trim();
                if (trimmed === "") return <Box key={idx} sx={{ height: "0.6em" }} />;
                if (isAllowedLine(line)) {
                  return (
                    <Typography key={idx} variant="body1" align="right" sx={{
                      fontSize: { xs: "1rem", md: "1.05rem" },
                      lineHeight: 2,
                      direction: "rtl",
                      whiteSpace: "pre-wrap",
                      unicodeBidi: "plaintext",
                      mb: 0.3,
                      color: "#222",
                    }}>
                      {line}
                    </Typography>
                  );
                }
                return (
                  <Box key={idx} sx={{ textAlign: "center", my: 2 }}>
                    <Typography variant="body1" sx={{ fontSize: "1rem", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                      {line}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default StoryPage;
