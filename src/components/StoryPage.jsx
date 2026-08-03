import { Box, Button, Checkbox, CircularProgress, Divider, FormControlLabel, IconButton, TextField, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
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
      const { data, error } = await supabase.from("stories").select("id, title, docx_url, pdf_url")
        .eq("id", parseInt(id, 10)).single();
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
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const contentRef = useRef(null);
  const progressBarRef = useRef(null);

  const getUserIdentifier = () => {
    if (session?.user?.id) return session.user.id;
    let uid = localStorage.getItem('anon_uid');
    if (!uid) { uid = crypto.randomUUID(); localStorage.setItem('anon_uid', uid); }
    return uid;
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!id) return;
    const storyId = parseInt(id, 10);
    const uid = getUserIdentifier();

    supabase.from('story_likes').select('id', { count: 'exact' }).eq('story_id', storyId)
      .then(({ count }) => setLikesCount(count || 0));
    supabase.from('story_likes').select('id').eq('story_id', storyId).eq('user_identifier', uid).maybeSingle()
      .then(({ data }) => setLiked(!!data));

    const channel = supabase.channel(`likes-${storyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'story_likes', filter: `story_id=eq.${storyId}` },
        () => {
          supabase.from('story_likes').select('id', { count: 'exact' }).eq('story_id', storyId)
            .then(({ count }) => setLikesCount(count || 0));
        })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id]); // eslint-disable-line

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const storyId = parseInt(id, 10);
    const uid = getUserIdentifier();
    if (liked) {
      setLiked(false);
      setLikesCount(c => Math.max(0, c - 1));
      await supabase.from('story_likes').delete().eq('story_id', storyId).eq('user_identifier', uid);
    } else {
      setLiked(true);
      setLikesCount(c => c + 1);
      await supabase.from('story_likes').insert({ story_id: storyId, user_identifier: uid });
    }
    setLikeLoading(false);
  };

  useEffect(() => {
    if (!story?.docx_url) return;
    fetch(story.docx_url)
      .then(res => res.arrayBuffer())
      .then(buffer => mammoth.extractRawText({ arrayBuffer: buffer }))
      .then(result => {
        const lines = result.value.split("\n");
        let filtered = lines.filter(line => !line.includes(")") && !/[A-Za-z]/.test(line));
        filtered = filtered.filter(line => line.trim() !== "");
        setContent(filtered.join("\n")); setError(null); setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [story]);

  const handleScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    setScrollProgress(Math.min(100, Math.round(el.scrollTop / (el.scrollHeight - el.clientHeight) * 100)));
  };

  const handleProgressBarClick = (e) => {
    const bar = progressBarRef.current; const el = contentRef.current;
    if (!bar || !el) return;
    const rect = bar.getBoundingClientRect();
    const fraction = 1 - ((e.clientX - rect.left) / rect.width);
    el.scrollTo({ top: fraction * (el.scrollHeight - el.clientHeight), behavior: "smooth" });
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
    const insertedCommentId = await addComment(form.name, story.id, story.title, form.comment, form.email, false, null, session?.user?.id || null, emailUpdates);
    if (insertedCommentId) await notifyReply(insertedCommentId);
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
      link.href = url; link.download = story.title + ".pdf"; link.click();
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
      <Typography variant="h5" color="#3b2008">סיפור לא נמצא</Typography>
      <Button component={Link} to="/" variant="contained"
        sx={{ mt: 2, background: 'linear-gradient(135deg,#c8860a,#e8a830)', boxShadow: 'none' }}>
        חזור לדף הבית
      </Button>
    </Box>
  );

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", pt: "64px", bgcolor: "#f5ede3" }}>

      <Box sx={{
        px: { xs: 2, md: 4 }, py: 1.5,
        bgcolor: "#fffaf5",
        boxShadow: "0 1px 4px rgba(200,134,10,0.12)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: '1px solid rgba(200,134,10,0.15)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="הורד PDF">
            <IconButton onClick={handleDownloadPDF} size="small" sx={{ color: '#c8860a' }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={liked ? 'הסר לייק' : 'אהבתי'}>
            <IconButton onClick={handleLike} size="small" disabled={likeLoading}
              sx={{ color: liked ? '#c8860a' : '#bfa07a', transition: 'color 0.2s, transform 0.15s',
                '&:hover': { transform: 'scale(1.2)' } }}>
              {liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ color: '#7a5c3a', minWidth: 16 }}>{likesCount}</Typography>
        </Box>
        <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, textAlign: "center", color: '#3b2008' }}>
          {story.title}
        </Typography>
        <Tooltip title="חזור לדף הבית">
          <IconButton component={Link} to="/" size="small" sx={{ color: '#7a5c3a' }}>
            <ArrowForwardIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress sx={{ color: '#c8860a' }} /></Box>}
      {!loading && error && <Box sx={{ textAlign: "center", mt: 4 }}><Typography color="error">שגיאה בטעינת הסיפור</Typography></Box>}

      {!loading && !error && (
        <Box sx={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 0, overflow: "hidden" }}>

          {/* טופס תגובה */}
          <Box sx={{
            width: isMobile ? "100%" : 320, flexShrink: 0,
            height: isMobile ? "auto" : "100%",
            overflowY: isMobile ? "visible" : "auto",
            px: 3, py: 3, bgcolor: "#fffaf5",
            boxShadow: isMobile ? "0 -2px 8px rgba(200,134,10,0.08)" : "none",
            borderLeft: isMobile ? 'none' : '1px solid rgba(200,134,10,0.15)',
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(200,134,10,0.3)", borderRadius: 2 },
          }} dir="rtl">
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="#3b2008">
              תגובה על הסיפור
            </Typography>
            <Divider sx={{ mb: 2, borderColor: 'rgba(200,134,10,0.2)' }} />

            {!session && !isAdmin && (
              <>
                <TextField label="שם *" fullWidth size="small" sx={{ mb: 2 }} value={form.name}
                  onChange={handleInputChange("name")} error={errors.name}
                  helperText={errors.name ? "אנא הזן שם" : ""}
                  inputProps={{ style: { textAlign: 'right' } }} />
                <TextField label="מייל *" fullWidth size="small" sx={{ mb: 2 }} value={form.email}
                  onChange={(e) => {
                    const v = e.target.value; setForm(prev => ({ ...prev, email: v }));
                    setErrors(prev => ({ ...prev, email: !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v.trim()) }));
                  }}
                  error={errors.email} helperText={errors.email ? "אנא הזן כתובת מייל תקינה" : ""}
                  inputProps={{ style: { direction: 'ltr', textAlign: 'left' } }} />
              </>
            )}

            <TextField label="תוכן התגובה *" multiline rows={isMobile ? 3 : 5} fullWidth size="small" sx={{ mb: 2 }}
              value={form.comment} onChange={handleInputChange("comment")} error={errors.comment}
              helperText={errors.comment ? "אנא הזן תוכן תגובה" : ""}
              inputProps={{ style: { textAlign: 'right', direction: 'rtl' } }} />

            <FormControlLabel sx={{ mb: 2, width: '100%', mr: 0 }}
              control={<Checkbox checked={emailUpdates} onChange={(e) => setEmailUpdates(e.target.checked)}
                size="small" sx={{ color: '#c8860a', '&.Mui-checked': { color: '#c8860a' } }} />}
              label={<Typography variant="caption" color="#7a5c3a">שלחו לי עדכון במייל כאשר ישיבו לתגובה שלי</Typography>} />

            {successMessage && (
              <Typography color="success.main" variant="body2" sx={{ mb: 1, textAlign: "center", fontWeight: 600 }}>
                ✓ {successMessage}
              </Typography>
            )}

            <Button variant="contained" fullWidth onClick={handleSubmit} disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : null}
              sx={{ background: 'linear-gradient(135deg,#c8860a,#e8a830)', boxShadow: 'none',
                '&:hover': { boxShadow: '0 4px 14px rgba(200,134,10,0.35)' },
                '&.Mui-disabled': { background: 'rgba(200,134,10,0.4)', color: '#fff' } }}>
              {submitting ? 'שולח...' : 'שלח תגובה'}
            </Button>
          </Box>

          {!isMobile && <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(200,134,10,0.15)' }} />}

          {/* טקסט הסיפור */}
          <Box sx={{ flex: isMobile ? "none" : 1, height: isMobile ? "calc(55vh - 16px)" : "100%",
            pb: isMobile ? 4 : 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Box ref={progressBarRef} onClick={handleProgressBarClick}
              style={{ height: 4, backgroundColor: "rgba(200,134,10,0.15)", position: "relative", cursor: "pointer", flexShrink: 0, direction: "ltr" }}>
              <Box style={{
                height: "100%", width: "100%", backgroundColor: "#c8860a",
                transition: "transform 0.15s", position: "absolute", top: 0, right: 0, left: "auto",
                transformOrigin: "100% 50%", transform: `scaleX(${scrollProgress / 100})`,
              }} />
            </Box>

            <Box ref={contentRef} onScroll={handleScroll} sx={{
              flex: 1, overflowY: "auto", px: { xs: 2.5, md: 6 }, py: 4,
              "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none",
            }}>
              {content.split("\n").map((line, idx) => {
                const trimmed = line.trim();
                if (trimmed === "") return <Box key={idx} sx={{ height: "0.6em" }} />;
                if (isAllowedLine(line)) {
                  return (
                    <Typography key={idx} variant="body1" align="right" sx={{
                      fontSize: { xs: "1rem", md: "1.05rem" }, lineHeight: 2,
                      direction: "rtl", whiteSpace: "pre-wrap", unicodeBidi: "plaintext",
                      mb: 0.3, color: "#3b2008",
                    }}>{line}</Typography>
                  );
                }
                return (
                  <Box key={idx} sx={{ textAlign: "center", my: 2 }}>
                    <Typography variant="body1" sx={{ fontSize: "1rem", lineHeight: 1.9, whiteSpace: "pre-wrap", color: "#3b2008" }}>
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
