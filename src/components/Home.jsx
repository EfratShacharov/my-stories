import { Box, Button, Container, Typography } from '@mui/material';
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
        <Box sx={{ bgcolor: '#f7f6fb', minHeight: '100vh', pt: { xs: 9, sm: 10 }, pb: 6 }}>
            <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>

                {/* כותרת עמוד */}
                <Box sx={{ mb: 4, textAlign: 'right' }}>
                    <Typography variant="h4" sx={{ color: '#1a1a2e', fontWeight: 800 }}>
                        הסיפורים
                    </Typography>
                    <Box sx={{ width: 48, height: 3, bgcolor: '#6c63ff', borderRadius: 2, mt: 1, mr: 'auto', ml: 0 }}
                        style={{ marginRight: 0, marginLeft: 'auto' }} />
                </Box>

                {stories.map((story, idx) => (
                    <Box key={story.id} sx={{
                        mb: 3,
                        borderRadius: 4,
                        bgcolor: '#fff',
                        boxShadow: '0 2px 20px rgba(108,99,255,0.07)',
                        border: '1px solid rgba(108,99,255,0.08)',
                        overflow: 'hidden',
                        transition: 'box-shadow 0.25s, transform 0.25s',
                        '&:hover': { boxShadow: '0 8px 32px rgba(108,99,255,0.15)', transform: 'translateY(-2px)' },
                    }}>
                        {/* פס צבע עליון */}
                        <Box sx={{ height: 4, background: idx % 2 === 0
                            ? 'linear-gradient(90deg, #6c63ff, #a78bfa)'
                            : 'linear-gradient(90deg, #f0a500, #fbbf24)' }} />

                        <Box sx={{ p: { xs: 2.5, sm: 3 }, textAlign: 'right', direction: 'rtl' }}>
                            {/* מספר + כותרת */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, justifyContent: 'flex-end' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                                    {story.title}
                                </Typography>
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                    background: idx % 2 === 0 ? 'linear-gradient(135deg,#6c63ff,#a78bfa)' : 'linear-gradient(135deg,#f0a500,#fbbf24)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{idx + 1}</Typography>
                                </Box>
                            </Box>

                            {/* תקציר */}
                            <Typography variant="body2" sx={{
                                color: '#6b7280', lineHeight: 1.9,
                                display: '-webkit-box', WebkitLineClamp: 4,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                direction: 'rtl', unicodeBidi: 'plaintext', mb: 2,
                            }} style={{ textAlign: 'right' }}>
                                {summaries[story.id] || 'טוען תקציר...'}
                            </Typography>

                            {/* כפתורים */}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <Button variant="outlined" component={Link} to={`/behind/${story.id}`}
                                    startIcon={<TheaterComedyIcon sx={{ fontSize: 16 }} />}
                                    size="small"
                                    sx={{ borderColor: '#f0a500', color: '#b07800', fontSize: 13,
                                        '&:hover': { bgcolor: 'rgba(240,165,0,0.06)', borderColor: '#f0a500' } }}>
                                    מאחורי הקלעים
                                </Button>
                                <Button variant="contained" component={Link} to={`/story/${story.id}`}
                                    size="small"
                                    sx={{ background: 'linear-gradient(135deg,#6c63ff,#a78bfa)', boxShadow: 'none',
                                        fontSize: 13, '&:hover': { boxShadow: '0 4px 12px rgba(108,99,255,0.35)' } }}>
                                    קרא עוד
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Container>
        </Box>
    );
};

export default Home;