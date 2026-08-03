import { Box, Button, Container, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
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
    const [likesMap, setLikesMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStories() {
            const { data, error } = await supabase.from("stories").select("id, title, docx_url, pdf_url").order("id");
            if (error) console.error("שגיאה בטעינה:", error);
            else setStories(data || []);
            setLoading(false);
        }
        loadStories();
    }, []);

    useEffect(() => {
        if (stories.length === 0) return;
        const ids = stories.map(s => s.id);

        const fetchLikes = async () => {
            const { data } = await supabase.from('story_likes').select('story_id').in('story_id', ids);
            const map = {};
            (data || []).forEach(r => { map[r.story_id] = (map[r.story_id] || 0) + 1; });
            setLikesMap(map);
        };
        fetchLikes();

        const channel = supabase.channel('home-likes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'story_likes' }, fetchLikes)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [stories]);

    useEffect(() => {
        if (stories.length === 0) return;
        async function loadSummaries() {
            const results = {};
            for (const story of stories) {
                try { results[story.id] = await extractTextFromDocx(story.docx_url, 5, 17); }
                catch (e) { results[story.id] = "תקציר לא זמין"; }
            }
            setSummaries(results);
        }
        loadSummaries();
    }, [stories]);

    if (loading) return null;
    return (
        <Box sx={{ bgcolor: '#f5ede3', minHeight: '100vh', pt: { xs: 9, sm: 10 }, pb: 6 }}>
            <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>

                <Box sx={{ mb: 4, textAlign: 'right' }}>
                    <Typography variant="h4" sx={{ color: '#3b2008', fontWeight: 800 }}>הסיפורים</Typography>
                    <Box sx={{ width: 48, height: 3, bgcolor: '#c8860a', borderRadius: 2, mt: 1 }}
                        style={{ marginRight: 0, marginLeft: 'auto' }} />
                </Box>

                {stories.map((story, idx) => (
                    <Box key={story.id} sx={{
                        mb: 3, borderRadius: 4, bgcolor: '#fffaf5',
                        boxShadow: '0 2px 20px rgba(200,134,10,0.08)',
                        border: '1px solid rgba(200,134,10,0.12)',
                        overflow: 'hidden',
                        transition: 'box-shadow 0.25s, transform 0.25s',
                        '&:hover': { boxShadow: '0 8px 32px rgba(200,134,10,0.18)', transform: 'translateY(-2px)' },
                    }}>
                        <Box sx={{ height: 4, background: idx % 2 === 0
                            ? 'linear-gradient(90deg, #c8860a, #e8a830)'
                            : 'linear-gradient(90deg, #5c3a1e, #a0622a)' }} />

                        <Box sx={{ p: { xs: 2.5, sm: 3 }, textAlign: 'right', direction: 'rtl' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, justifyContent: 'flex-end' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b2008' }}>{story.title}</Typography>
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                    background: idx % 2 === 0 ? 'linear-gradient(135deg,#c8860a,#e8a830)' : 'linear-gradient(135deg,#5c3a1e,#a0622a)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{idx + 1}</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <FavoriteIcon sx={{ fontSize: 14, color: '#c8860a' }} />
                                <Typography variant="caption" sx={{ color: '#7a5c3a' }}>{likesMap[story.id] || 0}</Typography>
                            </Box>

                            <Typography variant="body2" sx={{
                                color: '#7a5c3a', lineHeight: 1.9,
                                display: '-webkit-box', WebkitLineClamp: 4,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                direction: 'rtl', unicodeBidi: 'plaintext', mb: 2,
                            }} style={{ textAlign: 'right' }}>
                                {summaries[story.id] || 'טוען תקציר...'}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <Button variant="outlined" component={Link} to={`/behind/${story.id}`}
                                    startIcon={<TheaterComedyIcon sx={{ fontSize: 16 }} />} size="small"
                                    sx={{ borderColor: '#c8860a', color: '#c8860a', fontSize: 13,
                                        '&:hover': { bgcolor: 'rgba(200,134,10,0.06)', borderColor: '#c8860a' } }}>
                                    מאחורי הקלעים
                                </Button>
                                <Button variant="contained" component={Link} to={`/story/${story.id}`} size="small"
                                    sx={{ background: 'linear-gradient(135deg,#c8860a,#e8a830)', boxShadow: 'none',
                                        fontSize: 13, '&:hover': { boxShadow: '0 4px 12px rgba(200,134,10,0.35)' } }}>
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
