import {
    Autocomplete,
    Box,
    Button,
    Collapse,
    Container,
    TextField,
    Typography
} from "@mui/material";

import React, { useState } from "react";
import { useComments } from "../context/CommentsContext";
import stories from "./Stories";

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
            subjectType: !subjectType,
            selectedStory: subjectType === "story" ? !selectedStory : false,
            customSubject: subjectType === "other" ? !customSubject.trim() : false,
            text: !text.trim(),
        };

        setErrors(newErrors);
        if (Object.values(newErrors).some(Boolean)) return;

        let storyId =
            subjectType === "story"
                ? selectedStory.id
                : null;

        let subject =
            subjectType === "story"
                ? selectedStory.label
                : customSubject.trim();
                
        await addComment(
            name,
            storyId,
            subject,
            text.trim(),
            email.trim(),
            false,
            null,
            session?.user?.id || null
        );

        resetForm();
        setSuccessMessage("התגובה נשלחה וממתינה לאישור מנהל");
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const approvedMainComments = comments.filter(
        (c) =>
            c.status === "approved" &&
            c.parent_id === null
    );

    return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>

            <Typography variant="h4" gutterBottom align="right">
                תגובות
            </Typography>

            {approvedMainComments.map((c) => {
                const adminReplies = comments.filter(
                    (reply) =>
                        reply.parent_id === c.id &&
                        reply.status === "approved"
                );

                return (
                    <Box
                        key={c.id}
                        dir="rtl"
                        sx={{
                            mt: 2,
                            p: 2,
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            backgroundColor: "#fafafa",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {new Date(c.created_at).toLocaleString("he-IL")}
                            </Typography>

                            <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                            >
                                {c.name}
                            </Typography>
                        </Box>

                        <Typography sx={{ mt: 1 }}>
                            {c.comment}
                        </Typography>

                        {/* תגובות מנהל */}
                        {adminReplies.map((reply) => (
                            <Box
                                key={reply.id}
                                sx={{
                                    mt: 2,
                                    ml: 4,
                                    p: 2,
                                    borderRadius: 2,
                                    backgroundColor: "#fff3e0",
                                    border: "1px solid #ffcc80",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {new Date(reply.created_at).toLocaleString("he-IL")}
                                    </Typography>

                                    <Box
                                        sx={{
                                            backgroundColor: "#e65100",
                                            color: "white",
                                            px: 1,
                                            py: 0.3,
                                            borderRadius: 1,
                                            fontSize: "0.75rem",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {reply.name} | מנהל
                                    </Box>
                                </Box>

                                <Typography sx={{ mt: 1 }}>
                                    {reply.comment}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                );
            })}

            {/* כפתור פתיחת טופס */}
            <Box sx={{ mt: 5, textAlign: "center" }}>
                <Button
                    variant="contained"
                    onClick={() => setShowForm((prev) => !prev)}
                >
                    {showForm
                        ? "סגור טופס תגובה"
                        : "הוספת תגובה משלך"}
                </Button>
            </Box>

            {/* טופס */}
            <Collapse in={showForm}>
                <Box sx={{ mt: 4 }}>

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

                                    setErrors((prev) => ({
                                        ...prev,
                                        name: !value.trim(),
                                    }));
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

                                    const emailRegex =
                                        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

                                    setErrors((prev) => ({
                                        ...prev,
                                        email: !emailRegex.test(value.trim()),
                                    }));
                                }}
                                error={errors.email}
                                helperText={
                                    errors.email
                                        ? "אנא הזן כתובת מייל תקינה"
                                        : ""
                                }
                            />
                        </>
                    )}

                    <Autocomplete
                        options={subjectOptions}
                        getOptionLabel={(option) => option.label}
                        value={
                            subjectOptions.find(
                                (opt) => opt.value === subjectType
                            ) || null
                        }
                        inputValue={subjectInput}
                        onInputChange={(e, value) => setSubjectInput(value)}
                        onChange={(e, value) => {
                            setSubjectType(value ? value.value : null);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="סוג נושא *"
                                sx={{ mt: 2 }}
                            />
                        )}
                    />

                    {subjectType === "story" && (
                        <Autocomplete
                            options={stories.map((s) => ({
                                label: s.title,
                                id: s.id
                            }))}
                            getOptionLabel={(option) =>
                                typeof option === "string"
                                    ? option
                                    : option.label
                            }
                            value={selectedStory}
                            inputValue={inputValue}
                            onInputChange={(e, value) => setInputValue(value)}
                            onChange={(e, value) => setSelectedStory(value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="בחר סיפור *"
                                    sx={{ mt: 2 }}
                                />
                            )}
                        />
                    )}

                    {subjectType === "other" && (
                        <TextField
                            label="נושא מותאם *"
                            value={customSubject}
                            onChange={(e) =>
                                setCustomSubject(e.target.value)
                            }
                            fullWidth
                            sx={{ mt: 2 }}
                        />
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
                        <Typography
                            variant="body1"
                            color="success.main"
                            align="center"
                            sx={{ mt: 2 }}
                        >
                            {successMessage}
                        </Typography>
                    )}

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            mt: 2
                        }}
                    >
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                        >
                            שלח תגובה
                        </Button>
                    </Box>
                </Box>
            </Collapse>
        </Container>
    );
};

export default CommentPage;