import {
    Autocomplete,
    Box,
    Button,
    Collapse,
    Container,
    TextField,
    Typography
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";

import React, { useEffect, useRef, useState } from "react";
import { useComments } from "../context/CommentsContext";
import { supabase } from "../supabase";

const CommentPage = ({ isAdmin, session }) => {
    const { comments, addComment } = useComments();

    const [showForm, setShowForm] = useState(false);
    const [text, setText] = useState("");
    const [selectedStory, setSelectedStory] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [subjectType, setSubjectType] = useState(null);
    const [customSubject, setCustomSubject] = useState("");
    const [subjectInput, setSubjectInput] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [expandedReplies, setExpandedReplies] = useState({});
    const [replyTo, setReplyTo] = useState(null);
    const [storiesList, setStoriesList] = useState([]);
    const formRef = useRef(null);

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

    const [errors, setErrors] = useState({
        name: false,
        email: false,
        subjectType: false,
        selectedStory: false,
        customSubject: false,
        text: false,
    });

    const canReply = (c) => {
        if (!c.story_id) return true; // נושא "אחר" — כולם יכולים
        return session && session.user.email === c.email; // סיפור — רק הכותב
    };

    const resetForm = () => {
        setSubjectType(null);
        setSubjectInput("");
        setSelectedStory(null);
        setInputValue("");
        setCustomSubject("");
        setText("");
        setName("");
        setEmail("");
        setErrors({
            subjectType: false,
            selectedStory: false,
            customSubject: false,
            text: false,
            name: false,
            email: false,
        });
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

        await addComment(
            name,
            storyId,
            subject,
            text.trim(),
            email.trim(),
            false,
            replyTo ? replyTo.id : null,
            session?.user?.id || null
        );

        resetForm();
        setReplyTo(null);
        setSuccessMessage("התגובה נשלחה וממתינה לאישור מנהל");
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const approvedMainComments = comments.filter(
        (c) => c.status === "approved" && c.parent_id === null
    );

    return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>

            <Typography variant="h4" gutterBottom align="right">
                תגובות
            </Typography>

            {approvedMainComments.map((c) => {
                const adminReplies = comments
                    .filter((reply) => reply.parent_id === c.id && reply.status === "approved")
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                return (
                    <Box
                        key={c.id}
                        dir="rtl"
                        sx={{
                            mt: 2,
                            p: 2.5,
                            borderRadius: 3,
                            backgroundColor: "#ffffff",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                            {/* אווטאר משתמש */}
                            <Box sx={{
                                width: 42, height: 42,
                                borderRadius: "50%",
                                backgroundColor: "#e3f2fd",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <CreateIcon sx={{ color: "#1976d2", fontSize: 22 }} />
                            </Box>

                            {/* שם + תאריך + נושא */}
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {c.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        ({new Date(c.created_at).toLocaleDateString("en-GB").replace(/\//g, ".")}, {new Date(c.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })})
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                    {c.story_title}
                                </Typography>
                            </Box>
                        </Box>

                        {/* תוכן */}
                        <Typography variant="body2" sx={{ mt: 1.5, mr: 7, color: "#333", lineHeight: 1.8 }}>
                            {c.comment}
                        </Typography>

                        {adminReplies.length > 0 && (
                            <Box sx={{ mt: 1.5, mr: 7 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => toggleReplies(c.id)}
                                    sx={{ fontSize: "0.75rem", borderColor: "#e65100", color: "#e65100" }}
                                >
                                    {expandedReplies[c.id] ? "הסתר תגובות" : `תגובות (${adminReplies.length})`}
                                </Button>
                            </Box>
                        )}

                        <Collapse in={!!expandedReplies[c.id]}>
                        {adminReplies.map((reply) => (
                            <Box
                                key={reply.id}
                                dir="rtl"
                                sx={{
                                    mt: 2,
                                    mr: 4,
                                    p: 2,
                                    borderRadius: 2,
                                    backgroundColor: reply.is_admin ? "#fff8f0" : "#ffffff",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                    <Box sx={{
                                        width: 36, height: 36,
                                        borderRadius: "50%",
                                        backgroundColor: reply.is_admin ? "#fff3e0" : "#e3f2fd",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        {reply.is_admin
                                            ? <AutoStoriesIcon sx={{ color: "#e65100", fontSize: 20 }} />
                                            : <CreateIcon sx={{ color: "#1976d2", fontSize: 20 }} />
                                        }
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            {reply.is_admin ? (
                                                <Typography variant="caption" sx={{
                                                    backgroundColor: "#e65100", color: "white",
                                                    px: 1, py: 0.2, borderRadius: 1,
                                                    fontWeight: "bold", fontSize: "0.7rem",
                                                }}>
                                                    {reply.name} | מנהלת
                                                </Typography>
                                            ) : (
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {reply.name}
                                                </Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary">
                                                ({new Date(reply.created_at).toLocaleDateString("en-GB").replace(/\//g, ".")}, {new Date(reply.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })})
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ mt: 0.5, color: "#444", lineHeight: 1.8 }}>
                                            {reply.comment}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                        </Collapse>

                        {canReply(c) && (
                            <Box sx={{ mt: 1.5, mr: 7 }}>
                                <Button size="small" variant="text"
                                    onClick={() => handleReplyClick(c)}
                                    sx={{ fontSize: "0.75rem", color: "#1976d2", p: 0 }}
                                >
                                    השיבו
                                </Button>
                            </Box>
                        )}
                    </Box>
                );
            })}

            {/* כפתור פתיחת טופס */}
            <Box sx={{ mt: 5, textAlign: "center" }}>
                <Button
                    variant="contained"
                    onClick={() => { setShowForm((prev) => !prev); setReplyTo(null); }}
                >
                    {showForm ? "סגור טופס תגובה" : "הוספת תגובה משלך"}
                </Button>
            </Box>

            {/* טופס */}
            <Collapse in={showForm}>
                <Box ref={formRef} sx={{ mt: 4 }} dir="rtl">

                    {!isAdmin && !session && (
                        <>
                            <TextField
                                label="שם *"
                                fullWidth
                                sx={{ mt: 2 }}
                                dir="rtl"
                                value={name}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setName(value);
                                    setErrors((prev) => ({ ...prev, name: !value.trim() }));
                                }}
                                error={errors.name}
                                helperText={errors.name ? "אנא הזן שם" : ""}
                            />

                            <TextField
                                label="מייל *"
                                fullWidth
                                sx={{ mt: 2 }}
                                dir="rtl"
                                value={email}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setEmail(value);
                                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                                    setErrors((prev) => ({ ...prev, email: !emailRegex.test(value.trim()) }));
                                }}
                                error={errors.email}
                                helperText={errors.email ? "אנא הזן כתובת מייל תקינה" : ""}
                            />
                        </>
                    )}

                    {replyTo ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "right" }}>
                            משיב/ה לתגובה של <strong>{replyTo.name}</strong>
                            <Button size="small" sx={{ mr: 1, fontSize: "0.7rem" }}
                                onClick={() => setReplyTo(null)}>
                                ביטול
                            </Button>
                        </Typography>
                    ) : (
                        <>
                        <Autocomplete
                            options={subjectOptions}
                            getOptionLabel={(option) => option.label}
                            value={subjectOptions.find((opt) => opt.value === subjectType) || null}
                            inputValue={subjectInput}
                            onInputChange={(e, value) => setSubjectInput(value)}
                            onChange={(e, value) => setSubjectType(value ? value.value : null)}
                            componentsProps={{ paper: { dir: "rtl" } }}
                            renderInput={(params) => (
                                <TextField {...params} label="סוג נושא *" sx={{ mt: 2 }} />
                            )}
                        />

                        {subjectType === "story" && (
                            <Autocomplete
                                options={storiesList.map((s) => ({ label: s.title, id: s.id }))}
                                getOptionLabel={(option) => typeof option === "string" ? option : option.label}
                                value={selectedStory}
                                inputValue={inputValue}
                                onInputChange={(e, value) => setInputValue(value)}
                                onChange={(e, value) => setSelectedStory(value)}
                                componentsProps={{ paper: { dir: "rtl" } }}
                                renderInput={(params) => (
                                    <TextField {...params} label="בחר סיפור *" sx={{ mt: 2 }} />
                                )}
                            />
                        )}

                        {subjectType === "other" && (
                            <TextField
                                label="נושא מותאם *"
                                value={customSubject}
                                onChange={(e) => setCustomSubject(e.target.value)}
                                fullWidth
                                sx={{ mt: 2 }}
                            />
                        )}
                        </>
                    )}

                    <TextField
                        label="תוכן התגובה *"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        multiline
                        rows={4}
                        fullWidth
                        sx={{ mt: 2 }}
                    />

                    {successMessage && (
                        <Typography variant="body1" color="success.main" align="center" sx={{ mt: 2 }}>
                            {successMessage}
                        </Typography>
                    )}

                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Button variant="contained" onClick={handleSubmit}>
                            שלח תגובה
                        </Button>
                    </Box>
                </Box>
            </Collapse>
        </Container>
    );
};

export default CommentPage;
