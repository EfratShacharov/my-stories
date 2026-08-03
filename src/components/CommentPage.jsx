import React, { useEffect, useRef, useState } from "react";
import {
    Autocomplete, Box, Button, Checkbox, CircularProgress,
    Collapse, Container, FormControlLabel, TextField, Typography
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "../context/CommentsContext";
import { supabase } from "../supabase";

const DRAFT_KEY = "comment_draft";
const MAX_CHARS = 500;

const toDate = (dt) => new Date(dt.endsWith("Z") || dt.includes("+") ? dt : dt + "Z");
const fmtDate = (dt) => toDate(dt).toLocaleDateString("en-GB", { timeZone: "Asia/Jerusalem" }).replace(/\//g, ".");
const fmtTime = (dt) => toDate(dt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });

const CommentPage = ({ isAdmin, session }) => {
    const { comments, addComment, notifyReply } = useComments();

    const [showForm, setShowForm] = useState(false);
    const [text, setText] = useState("");
    const [selectedStory, setSelectedStory] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [subjectType, setSubjectType] = useState(null);
    const [customSubject, setCustomSubject] = useState("");
    const [subjectInput, setSubjectInput] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [emailUpdates, setEmailUpdates] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [expandedReplies, setExpandedReplies] = useState({});
    const [replyTo, setReplyTo] = useState(null);
    const [storiesList, setStoriesList] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [optimisticComments, setOptimisticComments] = useState([]);
    const formRef = useRef(null);

    const [errors, setErrors] = useState({
        name: false, email: false, subjectType: false,
        selectedStory: false, customSubject: false, text: false,
    });

    useEffect(() => {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
            try {
                const { text: t, name: n, email: e } = JSON.parse(draft);
                if (t) setText(t);
                if (n) setName(n);
                if (e) setEmail(e);
            } catch {}
        }
    }, []);

    useEffect(() => {
        if (text || name || email)
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ text, name, email }));
    }, [text, name, email]);

    useEffect(() => {
        supabase.from("stories").select("id, title").order("id")
            .then(({ data }) => { if (data) setStoriesList(data); });
    }, []);

    const toggleReplies = (id) =>
        setExpandedReplies((prev) => ({ ...prev, [id]: !prev[id] }));

    const handleReplyClick = (comment) => {
        setReplyTo(comment);
        setShowForm(true);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    };

    const subjectOptions = [
        { label: "תגובה על סיפור", value: "story" },
        { label: "אחר", value: "other" }
    ];

    const canReply = (c) => {
        if (!c.story_id) return true;
        return session && session.user.email === c.email;
    };

    const resetForm = () => {
        setSubjectType(null); setSubjectInput(""); setSelectedStory(null);
        setInputValue(""); setCustomSubject(""); setText("");
        setName(""); setEmail(""); setEmailUpdates(false);
        setErrors({ subjectType: false, selectedStory: false, customSubject: false, text: false, name: false, email: false });
        localStorage.removeItem(DRAFT_KEY);
    };

    const handleSubmit = async () => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const isLoggedIn = !!session;
        const newErrors = {
            name: !isLoggedIn && !isAdmin ? !name.trim() : false,
            email: !isLoggedIn && !isAdmin ? (!email.trim() || !emailRegex.test(email.trim())) : false,
            subjectType: !replyTo && !subjectType,
            selectedStory: !replyTo && subjectType === "story" ? !selectedStory : false,
            customSubject: !replyTo && subjectType === "other" ? !customSubject.trim() : false,
            text: !text.trim(),
        };
        setErrors(newErrors);
        if (Object.values(newErrors).some(Boolean)) return;

        const storyId = replyTo ? replyTo.story_id : (subjectType === "story" ? selectedStory.id : null);
        const subject = replyTo ? replyTo.story_title : (subjectType === "story" ? selectedStory.label : customSubject.trim());

        const tempId = `temp_${Date.now()}`;
        setOptimisticComments((prev) => [{
            id: tempId, name: name || session?.user?.email || "אתה",
            story_title: subject, comment: text.trim(),
            created_at: new Date().toISOString(),
            parent_id: replyTo ? replyTo.id : null,
            is_admin: false, status: "pending", _optimistic: true,
        }, ...prev]);

        setSubmitting(true);
        const insertedCommentId = await addComment(
            name, storyId, subject, text.trim(), email.trim(),
            false, replyTo ? replyTo.id : null, session?.user?.id || null, emailUpdates
        );
        if (replyTo && insertedCommentId) await notifyReply(insertedCommentId);
        setSubmitting(false);
        setTimeout(() => setOptimisticComments((prev) => prev.filter((c) => c.id !== tempId)), 3000);
        resetForm();
        setReplyTo(null);
        setSuccessMessage("התגובה תפורסם לאחר אישור מנהל האתר");
        setTimeout(() => setSuccessMessage(""), 4000);
    };

    const approvedMainComments = comments.filter((c) => c.status === "approved" && c.parent_id === null);
    const optimisticMain = optimisticComments.filter((c) => !c.parent_id);

    const ReplyItem = ({ reply, depth = 0 }) => {
        const children = comments
            .filter((r) => r.parent_id === reply.id && r.status === "approved")
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const optimisticChildren = optimisticComments.filter((r) => r.parent_id === reply.id);

        return (
            <>
                <Box dir="rtl" sx={{
                    mt: 2, mr: depth > 0 ? 2 : 4, p: 2, borderRadius: 2,
                    bgcolor: reply.is_admin ? '#fffbf0' : '#fffaf5',
                    border: `1px solid ${reply.is_admin ? 'rgba(200,134,10,0.18)' : 'rgba(200,134,10,0.08)'}`,
                }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <Box sx={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: reply.is_admin ? 'linear-gradient(135deg,#c8860a,#e8a830)' : 'linear-gradient(135deg,#c8860a,#e8a830)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            {reply.is_admin ? <AutoStoriesIcon sx={{ color: '#fff', fontSize: 18 }} /> : <CreateIcon sx={{ color: '#fff', fontSize: 18 }} />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {reply.is_admin ? (
                                    <Typography variant="caption" sx={{
                                        background: 'linear-gradient(135deg,#f0a500,#fbbf24)',
                                        color: '#fff', px: 1, py: 0.2, borderRadius: 1,
                                        fontWeight: 700, fontSize: '0.7rem',
                                    }}>
                                        {reply.name} | מנהלת
                                    </Typography>
                                ) : (
                                    <Typography variant="subtitle2" fontWeight="bold">{reply.name}</Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">({fmtDate(reply.created_at)}, {fmtTime(reply.created_at)})</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 0.5, color: "#444", lineHeight: 1.8 }}>{reply.comment}</Typography>
                        </Box>
                    </Box>
                    {canReply(reply) && (
                        <Box sx={{ mt: 1, mr: 6 }}>
                            <Button size="small" variant="text"
                                onClick={() => handleReplyClick(reply)}
                                sx={{ fontSize: '0.75rem', color: '#c8860a', p: 0, fontWeight: 600 }}>
                                השיבו
                            </Button>
                        </Box>
                    )}
                </Box>
                {optimisticChildren.map((child) => (
                    <Box key={child.id} dir="rtl" sx={{
                        mt: 2, mr: depth > 0 ? 2 : 4, p: 2, borderRadius: 2,
                        bgcolor: '#fffaf5', border: '1px dashed rgba(200,134,10,0.25)', opacity: 0.55,
                    }}>
                        <Typography variant="subtitle2" fontWeight="bold">{child.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#c8860a', fontStyle: 'italic', fontSize: '0.7rem' }}>ממתין לאישור</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, color: "#444", lineHeight: 1.8 }}>{child.comment}</Typography>
                    </Box>
                ))}
                {children.map((child) => <ReplyItem key={child.id} reply={child} depth={depth + 1} />)}
            </>
        );
    };

    return (
        <Box sx={{ bgcolor: '#f5ede3', minHeight: '100vh', pt: { xs: 9, sm: 10 }, pb: 6 }}>
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>

            <Box sx={{ mb: 3, textAlign: 'right' }}>
                <Typography variant="h4" sx={{ color: '#3b2008', fontWeight: 800 }}>תגובות</Typography>
                <Box sx={{ width: 48, height: 3, bgcolor: '#c8860a', borderRadius: 2, mt: 1 }} style={{ marginRight: 0, marginLeft: 'auto' }} />
            </Box>

            <Box sx={{ position: 'sticky', top: { xs: 64, sm: 72 }, zIndex: 10, bgcolor: '#f5ede3', pb: 1, pt: 0.5 }}>
                <Button variant="contained" fullWidth
                    onClick={() => { setShowForm((prev) => !prev); setReplyTo(null); }}
                    sx={{ background: 'linear-gradient(135deg,#c8860a,#e8a830)', boxShadow: 'none',
                        '&:hover': { boxShadow: '0 4px 14px rgba(200,134,10,0.35)' } }}
                >
                    {showForm ? 'סגור טופס תגובה' : 'הוספת תגובה משלך'}
                </Button>
            </Box>

            <Collapse in={showForm}>
                <Box ref={formRef} dir="rtl" sx={{ mt: 2, mb: 3, p: 3, borderRadius: 3, bgcolor: '#fffaf5', border: '1px solid rgba(200,134,10,0.12)', boxShadow: '0 2px 12px rgba(200,134,10,0.08)' }}>

                    {replyTo && (
                        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(200,134,10,0.05)', border: '1px solid rgba(200,134,10,0.15)', textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">
                                משיב/ה לתגובה של <strong>{replyTo.name}</strong>
                                <Button size="small" sx={{ mr: 1, fontSize: '0.7rem', color: '#c8860a' }} onClick={() => setReplyTo(null)}>ביטול</Button>
                            </Typography>
                        </Box>
                    )}

                    {!isAdmin && !session && (
                        <>
                            <TextField label="שם *" fullWidth sx={{ mt: 1 }} value={name}
                                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: !e.target.value.trim() })); }}
                                error={errors.name} helperText={errors.name ? 'אנא הזן שם' : ''}
                                inputProps={{ style: { textAlign: 'right' } }}
                            />
                            <TextField label="מייל *" fullWidth sx={{ mt: 2 }} value={email}
                                onChange={(e) => {
                                    const v = e.target.value; setEmail(v);
                                    setErrors((p) => ({ ...p, email: !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v.trim()) }));
                                }}
                                error={errors.email}
                                inputProps={{ style: { direction: 'ltr', textAlign: 'left' } }}
                                helperText={errors.email ? 'אנא הזן כתובת מייל תקינה' : <Typography variant="caption" color="text.secondary">המייל לא יוצג באתר</Typography>}
                            />
                        </>
                    )}

                    {!replyTo && (
                        <>
                            <Autocomplete
                                options={subjectOptions}
                                getOptionLabel={(o) => o.label}
                                value={subjectOptions.find((o) => o.value === subjectType) || null}
                                inputValue={subjectInput}
                                onInputChange={(e, v) => setSubjectInput(v)}
                                onChange={(e, v) => setSubjectType(v ? v.value : null)}
                                componentsProps={{ paper: { dir: 'rtl' } }}
                                renderInput={(params) => (
                                    <TextField {...params} label="סוג נושא *" sx={{ mt: 2 }}
                                        error={errors.subjectType} helperText={errors.subjectType ? 'אנא בחר נושא' : ''} />
                                )}
                            />
                            {subjectType === 'story' && (
                                <Autocomplete
                                    options={storiesList.map((s) => ({ label: s.title, id: s.id }))}
                                    getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                                    value={selectedStory} inputValue={inputValue}
                                    onInputChange={(e, v) => setInputValue(v)}
                                    onChange={(e, v) => setSelectedStory(v)}
                                    componentsProps={{ paper: { dir: 'rtl' } }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="בחר סיפור *" sx={{ mt: 2 }}
                                            error={errors.selectedStory} helperText={errors.selectedStory ? 'אנא בחר סיפור' : ''} />
                                    )}
                                />
                            )}
                            {subjectType === 'other' && (
                                <TextField label="נושא מותאם *" value={customSubject}
                                    onChange={(e) => setCustomSubject(e.target.value)}
                                    fullWidth sx={{ mt: 2 }}
                                    error={errors.customSubject} helperText={errors.customSubject ? 'אנא הזן נושא' : ''}
                                    inputProps={{ style: { textAlign: 'right' } }}
                                />
                            )}
                        </>
                    )}

                    <TextField label="תוכן התגובה *" value={text}
                        onChange={(e) => e.target.value.length <= MAX_CHARS && setText(e.target.value)}
                        multiline rows={4} fullWidth sx={{ mt: 2 }}
                        inputProps={{ style: { textAlign: 'right', direction: 'rtl' } }}
                        helperText={
                            <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{errors.text ? 'אנא הזן תוכן' : ''}</span>
                                <span style={{ color: text.length >= MAX_CHARS ? '#d32f2f' : '#999' }}>{text.length}/{MAX_CHARS}</span>
                            </Box>
                        }
                        error={errors.text}
                    />

                    <FormControlLabel sx={{ mt: 1.5, width: '100%', mr: 0 }}
                        control={<Checkbox checked={emailUpdates} onChange={(e) => setEmailUpdates(e.target.checked)}
                            size="small" sx={{ color: '#c8860a', '&.Mui-checked': { color: '#c8860a' } }} />}
                        label={<Typography variant="caption" color="text.secondary">שלחו לי עדכון במייל כאשר ישיבו לתגובה שלי</Typography>}
                    />

                    {successMessage && (
                        <Typography variant="body2" color="success.main" align="center" sx={{ mt: 2, fontWeight: 600 }}>✓ {successMessage}</Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button variant="contained" onClick={handleSubmit} disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : null}
                            sx={{ background: 'linear-gradient(135deg,#c8860a,#e8a830)', boxShadow: 'none', px: 3,
                                '&:hover': { boxShadow: '0 4px 14px rgba(200,134,10,0.35)' },
                                '&.Mui-disabled': { background: 'rgba(200,134,10,0.4)', color: '#fff' } }}
                        >
                            {submitting ? 'שולח...' : 'שלח תגובה'}
                        </Button>
                    </Box>
                </Box>
            </Collapse>

            <AnimatePresence>
            {optimisticMain.map((c) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 0.55, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                    <Box dir="rtl" sx={{ mt: 2, p: 2.5, borderRadius: 3, bgcolor: '#fffaf5', border: '1px dashed rgba(200,134,10,0.3)' }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                            <Box sx={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#c8860a,#e8a830)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <CreateIcon sx={{ color: '#fff', fontSize: 20 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">{c.name}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{c.story_title}</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#c8860a', fontStyle: 'italic', fontSize: '0.7rem' }}>ממתין לאישור</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1.5, mr: 7, color: "#333", lineHeight: 1.8 }}>{c.comment}</Typography>
                    </Box>
                </motion.div>
            ))}
            </AnimatePresence>

            <AnimatePresence>
            {approvedMainComments.map((c) => {
                const directReplies = comments
                    .filter((r) => r.parent_id === c.id && r.status === "approved")
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                const optimisticDirectReplies = optimisticComments.filter((r) => r.parent_id === c.id);
                const totalReplies = directReplies.length + optimisticDirectReplies.length;

                return (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Box dir="rtl" sx={{
                        mt: 2, p: 2.5, borderRadius: 3, bgcolor: '#fffaf5',
                        border: '1px solid rgba(200,134,10,0.10)',
                        boxShadow: '0 2px 12px rgba(200,134,10,0.07)',
                        transition: 'box-shadow 0.2s',
                        '&:hover': { boxShadow: '0 4px 20px rgba(200,134,10,0.14)' },
                    }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                            <Box sx={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#c8860a,#e8a830)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <CreateIcon sx={{ color: '#fff', fontSize: 20 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">{c.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">({fmtDate(c.created_at)}, {fmtTime(c.created_at)})</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{c.story_title}</Typography>
                            </Box>
                        </Box>

                        <Typography variant="body2" sx={{ mt: 1.5, mr: 7, color: "#333", lineHeight: 1.8 }}>{c.comment}</Typography>

                        {totalReplies > 0 && (
                            <Box sx={{ mt: 1.5, mr: 7 }}>
                                <Button size="small" variant="outlined" onClick={() => toggleReplies(c.id)}
                                    sx={{ fontSize: '0.75rem', borderColor: '#f0a500', color: '#b07800', borderRadius: 2, '&:hover': { bgcolor: 'rgba(240,165,0,0.06)' } }}
                                >
                                    {expandedReplies[c.id] ? "הסתר תגובות" : `תגובות (${totalReplies})`}
                                </Button>
                            </Box>
                        )}

                        <Collapse in={!!expandedReplies[c.id]}>
                            {optimisticDirectReplies.map((reply) => (
                                <Box key={reply.id} dir="rtl" sx={{ mt: 2, mr: 4, p: 2, borderRadius: 2, bgcolor: '#fffaf5', border: '1px dashed rgba(200,134,10,0.25)', opacity: 0.55 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">{reply.name}</Typography>
                                    <Typography variant="caption" sx={{ color: '#c8860a', fontStyle: 'italic', fontSize: '0.7rem' }}>ממתין לאישור</Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, color: "#444", lineHeight: 1.8 }}>{reply.comment}</Typography>
                                </Box>
                            ))}
                            {directReplies.map((reply) => <ReplyItem key={reply.id} reply={reply} depth={0} />)}
                        </Collapse>

                        {canReply(c) && (
                            <Box sx={{ mt: 1.5, mr: 7 }}>
                                <Button size="small" variant="text" onClick={() => handleReplyClick(c)}
                                    sx={{ fontSize: '0.75rem', color: '#c8860a', p: 0, fontWeight: 600 }}>
                                    השיבו
                                </Button>
                            </Box>
                        )}
                    </Box>
                    </motion.div>
                );
            })}
            </AnimatePresence>

        </Container>
        </Box>
    );
};

export default CommentPage;
