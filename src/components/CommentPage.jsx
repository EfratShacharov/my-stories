import { Autocomplete, Box, Button, Container, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { useComments } from "../context/CommentsContext";
import stories from "./Stories";
const CommentPage = () => {
    const { comments, addComment } = useComments();
    const [text, setText] = useState("");
    const [selectedStory, setSelectedStory] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [subjectType, setSubjectType] = useState("");
    const [customSubject, setCustomSubject] = useState("");

    const handleSubmit = () => {
        // if (!inputValue.trim() || !text.trim()) return;

        // const storyId = selectedStory ? selectedStory.id : null;

        // addComment(storyId, inputValue.trim(), text.trim());

        // setSelectedStory(null);
        // setInputValue("");
        // setText("");

        if (!text.trim() || !subjectType) return;

        let storyId = null;
        let subject = "";

        if (subjectType === "story") {
            if (!selectedStory) return;
            storyId = selectedStory.id;
            subject = selectedStory.label;
        }
        else if (subjectType === "other") {
            if (!customSubject.trim()) return;
            subject = customSubject.trim();
        }

        addComment(storyId, subject, text.trim());

        setSelectedStory(null);
        setInputValue("");
        setCustomSubject("");
        setSubjectType("");
        setText("");
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
                    select
                    label="סוג הנושא"
                    value={subjectType}
                    onChange={(e) => setSubjectType(e.target.value)}
                    fullWidth
                    sx={{ mt: 2 }}
                    dir='rtl'
                    SelectProps={{ native: true }}
                >
                    <option value=""></option>
                    <option value="story">תגובה על סיפור</option>
                    <option value="other">אחר</option>
                </TextField>
                {subjectType === "story" && (
                    <Autocomplete
                        freeSolo
                        options={stories.map((s) => ({ label: s.title, id: s.id }))}
                        getOptionLabel={(option) => typeof option === "string" ? option : option.label}
                        value={selectedStory}
                        onChange={(e, newValue) => setSelectedStory(newValue)}
                        inputValue={inputValue}
                        onInputChange={(e, newInputValue) => setInputValue(newInputValue)}
                        renderInput={(params) => (<TextField {...params}
                            label="בחר סיפור"
                            fullWidth sx={{ mt: 2 }}
                            dir="rtl"
                            InputProps={{ ...params.InputProps, style: { textAlign: "right" } }}
                        />
                        )}
                    />
                )}
                {/* תוכן התגובה */}
                {subjectType === "other" && (
                    <TextField
                        label="נושא מותאם"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        fullWidth
                        sx={{ mt: 2 }}
                        InputProps={{ style: { textAlign: "right" } }}
                    />
                )}
                <TextField
                    label="תוכן התגובה"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                    sx={{ mt: 2 }}
                    InputProps={{ style: { textAlign: "right" } }}
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