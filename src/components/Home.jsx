import { Button, Card, CardContent, Container, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import stories from '../data/Stories';
import * as mammoth from 'mammoth';

async function extractTextFromDocx(url, maxLines = 5, wordsPerLine = 17) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    let text = result.value;
    text = text.replace(/[^א-ת\s.,!?:;"]/g, " ").replace(/\s+/g, " ").trim();

    const words = text.split(" ").filter(Boolean);
    const indexOfMarker = -1;
    const regex = /תש.\\"?/;
    for (let i = 0; i < words.length; i++) {
        if (regex.test(words[i])) {
            indexOfMarker = i;
            break;
        }
    }
    const filteredWords = indexOfMarker !== -1 ? words.slice(indexOfMarker + 1) : words;

    const lines = [];
    for (let i = 0; i < maxLines; i++) {
        const start = i * wordsPerLine;
        const end = start + wordsPerLine;
        const lineWords = filteredWords.slice(start, end);
        if (lineWords.length === 0) break;
        lines.push(lineWords.join(" "));
    }

    let summaryText = lines.join(" ");
    let lastDotIndex = -1;
    for (let i = summaryText.length - 1; i >= 0; i--) {
        if (summaryText[i] === "." && (i === summaryText.length - 1 || summaryText[i + 1] === " ")) {
            lastDotIndex = i;
            break;
        }
    }
    if (lastDotIndex !== -1) {
        summaryText = summaryText.slice(0, lastDotIndex + 1);
    }

    return summaryText;
}

const Home = () => {
    const [summaries, setSummaries] = useState({});

    useEffect(() => {
        async function loadSummaries() {
            const results = {};
            for (const story of stories) {
                try {
                    const text = await extractTextFromDocx(story.docx, 5, 17);
                    results[story.id] = text;
                } catch (e) {
                    results[story.id] = "תקציר לא זמין";
                }
            }
            setSummaries(results);
        }
        loadSummaries();
    }, []);

    return (
        <Container sx={{ p: 2 }}>
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
                        <Button
                            variant="contained"
                            style={{ marginTop: 10 }}
                            component={Link}
                            to={`/story/${story.id}`}
                        >
                        קרא עוד
                    </Button>
                </CardContent>
                </Card>
    ))
}
        </Container >
    );
};

export default Home;
