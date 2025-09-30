import { Autocomplete, Box, Button, Container, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { useComments } from "../context/CommentsContext";
import stories from "./Stories";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";


const CommentPage = () => {
    const { comments, addComment } = useComments();
    const [text, setText] = useState("");
    const [selectedStory, setSelectedStory] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [subjectType, setSubjectType] = useState(null);
    const [customSubject, setCustomSubject] = useState("");
    const [subjectInput, setSubjectInput] = useState("");
    const subjectOptions = [
        { label: "תגובה על סיפור", value: "story" },
        { label: "אחר", value: "other" }
    ];
    const [errors, setErrors] = useState({
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
        setErrors({
            subjectType: false,
            selectedStory: false,
            customSubject: false,
            text: false,
        });
    };

    const handleSubmit = async () => {
        const newErrors = {
            subjectType: !subjectType,
            selectedStory: subjectType === "story" ? !selectedStory : false,
            customSubject: subjectType === "other" ? !customSubject.trim() : false,
            text: !text.trim(),
        };

        setErrors(newErrors);
        if (Object.values(newErrors).some(Boolean)) return;

        let storyId = subjectType === "story" ? selectedStory.id : null;
        let subject = subjectType === "story" ? selectedStory.label : customSubject.trim();

        await addComment(storyId, subject, text.trim());

        resetForm();
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
                            label="סוג הנושא"
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
                                label="בחר סיפור"
                                fullWidth sx={{ mt: 2 }}
                                dir="rtl"
                                InputProps={{ ...params.InputProps, style: { textAlign: "right" } }}
                                error={errors.selectedStory}
                                helperText={errors.selectedStory ? "אנא בחר סיפור" : ""}
                            />
                        )}
                    />
                )}
                {/* תוכן התגובה */}
                {subjectType === "other" && (
                    <TextField
                        label="נושא מותאם"
                        value={customSubject}
                        onChange={(e) => {
                            setCustomSubject(e.target.value);
                            if (errors.customSubject) setErrors(prev => ({ ...prev, customSubject: false }));
                        }}
                        fullWidth
                        sx={{ mt: 2 }}
                        InputProps={{ style: { textAlign: "right" } }}
                        error={errors.customSubject}
                        helperText={errors.customSubject ? "אנא הזן נושא מותאם" : ""}
                    />
                )}
                <TextField
                    label="תוכן התגובה"
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value)
                        if (errors.text)
                            setErrors(prev => ({ ...prev, text: false }));
                    }}
                    multiline
                    rows={4}
                    fullWidth
                    sx={{ mt: 2 }}
                    InputProps={{ style: { textAlign: "right" } }}
                    error={errors.text}
                    helperText={errors.text ? "אנא הזן תוכן תגובה" : ""}
                />
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
