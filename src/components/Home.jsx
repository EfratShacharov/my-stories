import { Box, Button, Card, CardContent, Container, Typography } from '@mui/material';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import * as mammoth from 'mammoth';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

async function extractTextFromDocx(url, maxLines = 5, wordsPerLine = 17) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    let text = result.value;
    text = text.replace(/[^א-ת\s.,!?:;"]/g, " ").replace(/\s+/g, " ").trim();

    const words = text.split(" ").filter(Boolean);
    let indexOfMarker = -1;
    const regex = /תש.\\"?/;
    for (let i = 0; i < words.length; i++) {
        if (regex.test(words[i])) { indexOfMarker = i; break; }
    }
    const filteredWords = indexOfMarker !== -1 ? words.slice(indexOfMarker + 1) : words;

    const lines = [];
    for (let i = 0; i < maxLines; i++) {
        const start = i * wordsPerLine;
        const lineWords = filteredWords.slice(start, start + wordsPerLine);
        if (lineWords.length === 0) break;
        lines.push(lineWords.join(" "));
    }

    let summaryText = lines.join(" ");
    let lastDotIndex = -1;
    for (let i = summaryText.length - 1; i >= 0; i--) {
        if (summaryText[i] === "." && (i === summaryText.length - 1 || summaryText[i + 1] === " ")) {
            lastDotIndex = i; break;
        }
    }
    if (lastDotIndex !== -1) summaryText = summaryText.slice(0, lastDotIndex + 1);
    return summaryText;
}

const Home = () => {
    const [stories, setStories] = useState([]);
    const [summaries, setSummaries] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStories() {
            const { data, error } = await supabase
                .from("stories")
                .select("id, title, docx_url, pdf_url")
                .order("id");
            if (error) {
                console.error("שגיאה בטעינה:", error);
            } else {
                setStories(data || []);
            }
            setLoading(false);
        }
        loadStories();
    }, []);

    useEffect(() => {
        if (stories.length === 0) return;
        async function loadSummaries() {
            const results = {};
            for (const story of stories) {
                try {
                    const text = await extractTextFromDocx(story.docx_url, 5, 17);
                    results[story.id] = text;
                } catch (e) {
                    results[story.id] = "תקציר לא זמין";
                }
            }
            setSummaries(results);
        }
        loadSummaries();
    }, [stories]);

    if (loading) return null;
    return (
        <Container sx={{ pt: { xs: 9, sm: 10 }, pb: 4, px: { xs: 2, sm: 3 } }}>
            <Typography variant="h4" style={{ marginBottom: 20, textAlign: 'right' }}>
                רשימת סיפורים
            </Typography>
            {stories.map(story => (
                <Card key={story.id} style={{ marginBottom: 10, textAlign: 'right' }}>
                    <CardContent>
                        <Typography variant="h5">{story.title}</Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 10,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "normal",
                                direction: "rtl",
                                unicodeBidi: "plaintext",
                            }}
                        >
                            {summaries[story.id] || "טוען תקציר..."}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                component={Link}
                                to={`/story/${story.id}`}
                            >
                                קרא עוד
                            </Button>
                            <Button
                                variant="outlined"
                                component={Link}
                                to={`/behind/${story.id}`}
                                startIcon={<TheaterComedyIcon />}
                                sx={{ borderColor: '#f0a500', color: '#b07800', '&:hover': { bgcolor: 'rgba(240,165,0,0.08)', borderColor: '#f0a500' } }}
                            >
                                מאחורי הקלעים
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Container>
    );
};

export default Home;