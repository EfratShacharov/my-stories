import { Autocomplete, Box, Button, Container, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { useComments } from "../context/CommentsContext";
import stories from "./Stories";

const CommentPage = () => {
    const { comments, addComment } = useComments();
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

    //איפוס שדות לאחר שליחת הטופס
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

        const newErrors = {
            name: !name.trim(),
            email: !email.trim() || !emailRegex.test(email.trim()),
            subjectType: !subjectType,
            selectedStory: subjectType === "story" ? !selectedStory : false,
            customSubject: subjectType === "other" ? !customSubject.trim() : false,
            text: !text.trim(),
        };

        setErrors(newErrors);

        if (Object.values(newErrors).some(Boolean)) return;

        let storyId = subjectType === "story" ? selectedStory.id : null;
        let subject = subjectType === "story" ? selectedStory.label : customSubject.trim();

        await addComment(name, storyId, subject, text.trim(), email.trim());

        resetForm();

        setSuccessMessage("!!!התגובה שלך נחתה בבטחה במערכת! תודה רבה");
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
            <Typography variant="h4" gutterBottom align="right">
                התגובות שהתקבלו במערכת
            </Typography>

            {comments.map((c) => {
                const story = stories.find((s) => s.id === c.storyId);
                return (
                    <Box
                        key={c.id}
                        dir="rtl"
                        sx={{
                            mt: 2,
                            p: 2,
                            border: '1px solid #ccc',
                            borderRadius: 2,
                            backgroundColor: "#fafafa",
                        }}
                    >
                        <Typography variant="subtitle2">
                            נושא התגובה: {story ? story.title : c.subject}
                        </Typography>
                        <Typography>
                            {c.text}
                        </Typography>
                    </Box>
                );
            })}
            {/* טופס להוספת תגובה */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" align="right">
                    הוסף תגובה משלך
                </Typography>
                <TextField
                    label={
                        <span>
                            <span style={{ color: "red" }}>*</span>שם
                        </span>
                    }
                    fullWidth
                    sx={{ mt: 2 }}
                    dir="rtl"
                    InputProps={{ style: { textAlign: "right" } }}
                    value={name}
                    onChange={(e) => {
                        const value = e.target.value;
                        setName(value);

                        // בדיקה דינמית של השם – חייב להיות לא ריק
                        setErrors((prev) => ({ ...prev, name: !value.trim() }));
                    }}
                    error={errors.name}
                    helperText={errors.name ? "אנא הזן שם" : ""}
                />
                <TextField
                    label={
                        <span>
                            <span style={{ color: "red" }}>*</span>מייל
                        </span>
                    }
                    fullWidth
                    sx={{ mt: 2 }}
                    dir="rtl"
                    InputProps={{ style: { textAlign: "right" } }}
                    value={email}
                    onChange={(e) => {
                        const value = e.target.value;
                        setEmail(value);

                        // בדיקה מלאה של המייל
                        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                        const isValid = emailRegex.test(value.trim());

                        // עדכון שגיאה דינמית בזמן אמת
                        setErrors((prev) => ({ ...prev, email: !isValid }));
                    }}
                    error={errors.email}
                    helperText={errors.email ? "אנא הזן כתובת מייל תקינה" : ""}
                />
                <Autocomplete
                    options={subjectOptions}
                    getOptionLabel={(option) => option.label}
                    value={subjectOptions.find((opt) => opt.value === subjectType) || null}
                    inputValue={subjectInput}
                    onInputChange={(event, newInputValue) => setSubjectInput(newInputValue)}
                    onChange={(event, newValue) => {
                        const value = newValue ? newValue.value : null;
                        setSubjectType(value);
                        if (errors.subjectType) setErrors(prev => ({ ...prev, subjectType: false }));
                    }}

                    renderInput={(params) => (

                        <TextField
                            {...params}
                            label={
                                <span>
                                    <span style={{ color: "red" }}>*</span>סוג הנושא
                                </span>
                            }
                            fullWidth
                            sx={{ mt: 2 }}
                            dir="rtl"
                            InputProps={{ ...params.InputProps, style: { textAlign: "right" } }}
                            error={errors.subjectType}
                            helperText={errors.subjectType ? "אנא בחר סוג נושא" : ""}
                        />
                    )}
                />
                {subjectType === "story" && (
                    <Autocomplete
                        options={stories.map((s) => ({ label: s.title, id: s.id }))}
                        getOptionLabel={(option) => typeof option === "string" ? option : option.label}
                        value={selectedStory}
                        inputValue={inputValue}
                        onInputChange={(e, newInputValue) => setInputValue(newInputValue)}
                        onChange={(e, newValue) => {
                            setSelectedStory(newValue)
                            if (errors.selectedStory) setErrors(prev => ({ ...prev, selectedStory: false }));
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={
                                    <span>
                                        <span style={{ color: "red" }}>*</span>בחר סיפור
                                    </span>
                                }
                                fullWidth sx={{ mt: 2 }}
                                dir="rtl"
                                InputProps={{ ...params.InputProps, style: { textAlign: "right" } }}
                                error={errors.selectedStory}
                                helperText={errors.selectedStory ? "אנא בחר סיפור" : ""}
                            />
                        )}
                    />
                )}

                {subjectType === "other" && (
                    <TextField
                        label={
                            <span>
                                נושא מותאם<span style={{ color: "red" }}>*</span>
                            </span>
                        } value={customSubject}
                        onChange={(e) => {
                            setCustomSubject(e.target.value);
                            if (errors.customSubject) setErrors(prev => ({ ...prev, customSubject: false }));
                        }}
                        fullWidth
                        sx={{ mt: 2 }}
                        dir="rtl"
                        InputProps={{ style: { textAlign: "right" } }}
                        error={errors.customSubject}
                        helperText={errors.customSubject ? "אנא הזן נושא מותאם" : ""}
                    />
                )}
                {/* תוכן התגובה */}
                <TextField
                    label={
                        <span>
                            תוכן התגובה
                            <span style={{ color: "red" }}>*</span>
                        </span>
                    } value={text}
                    onChange={(e) => {
                        setText(e.target.value)
                        if (errors.text)
                            setErrors(prev => ({ ...prev, text: false }));
                    }}
                    multiline
                    rows={4}
                    fullWidth
                    sx={{ mt: 2 }}
                    dir="rtl"
                    InputProps={{ style: { textAlign: "right" } }}
                    error={errors.text}
                    helperText={errors.text ? "אנא הזן תוכן תגובה" : ""}
                />
                {successMessage && (
                    <Typography variant="body1" color="success.main" align="center" sx={{ mt: 2 }}>
                        {successMessage}
                    </Typography>
                )}
                {/* כפתור שליחה */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleSubmit}>
                        שלח תגובה
                    </Button>
                </Box>
            </Box>
        </Container >
    );
};

export default CommentPage;
