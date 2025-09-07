// import { Button, Card, CardContent, Container, Typography } from '@mui/material';
// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import stories from '../data/Stories';
// import * as mammoth from 'mammoth';
// import { List } from 'react-window';

// async function extractTextFromDocx(url, maxLines = 5, wordsPerLine = 17) {
//     const response = await fetch(url);
//     const arrayBuffer = await response.arrayBuffer();
//     const result = await mammoth.extractRawText({ arrayBuffer });
//     let text = result.value;
//     text = text.replace(/[^א-ת\s.,!?:;"]/g, " ").replace(/\s+/g, " ").trim();

//     const words = text.split(" ").filter(Boolean);
//     let indexOfMarker = -1;
//     const regex = /תש.\\"?/;
//     for (let i = 0; i < words.length; i++) {
//         if (regex.test(words[i])) {
//             indexOfMarker = i;
//             break;
//         }
//     }
//     const filteredWords = indexOfMarker !== -1 ? words.slice(indexOfMarker + 1) : words;

//     const lines = [];
//     for (let i = 0; i < maxLines; i++) {
//         const start = i * wordsPerLine;
//         const end = start + wordsPerLine;
//         const lineWords = filteredWords.slice(start, end);
//         if (lineWords.length === 0) break;
//         lines.push(lineWords.join(" "));
//     }

//     let summaryText = lines.join(" ");
//     let lastDotIndex = -1;
//     for (let i = summaryText.length - 1; i >= 0; i--) {
//         if (summaryText[i] === "." && (i === summaryText.length - 1 || summaryText[i + 1] === " ")) {
//             lastDotIndex = i;
//             break;
//         }
//     }
//     if (lastDotIndex !== -1) {
//         summaryText = summaryText.slice(0, lastDotIndex + 1);
//     }

//     return summaryText;
// }

// const Row = ({ index, style, data }) => {
//     const safeData = data || {};
//     const safeStories = safeData.stories || [];
//     const summaries = safeData.summaries || {};
//     const story = safeStories[index];
//     if (!story) return null;

//     const summaryText = summaries[story.id] || "טוען תקציר...";

//     return (
//         <div style={style}>
//             <Card key={story.id} style={{ marginBottom: 10, textAlign: 'right' }}>
//                 <CardContent style={{ minHeight: 160 }}>
//                     <Typography variant="h5">{story.title}</Typography>
//                     <Typography
//                         variant="body2"
//                         sx={{
//                             whiteSpace: "pre-wrap",
//                             direction: "rtl",
//                             unicodeBidi: "plaintext",
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                         }}
//                     >
//                         {summaryText}
//                     </Typography>
//                     <Button
//                         variant="contained"
//                         style={{ marginTop: 10 }}
//                         component={Link}
//                         to={`/story/${story.id}`}
//                     >
//                         קרא עוד
//                     </Button>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// };

// const Home = () => {
//     const [summaries, setSummaries] = useState({});

//     useEffect(() => {
//         async function loadSummaries() {
//             const promises = stories.map(async (story) => {
//                 try {
//                     const text = await extractTextFromDocx(story.docx, 5, 17);
//                     return { id: story.id, text };
//                 } catch {
//                     return { id: story.id, text: "תקציר לא זמין" };
//                 }
//             });

//             const results = await Promise.all(promises);

//             const summariesObj = {};
//             results.forEach(item => {
//                 summariesObj[item.id] = item.text;
//             });
//             setSummaries(summariesObj);
//         }
//         loadSummaries();

//         window.scrollTo(0, 0);
//     }, []);

//     return (
//         <Container sx={{ p: 2 }}>
//             <Typography variant="h4" style={{ marginBottom: 20, textAlign: 'right' }}>
//                 רשימת סיפורים
//             </Typography>
//             <List
//                 height={window.innerHeight}
//                 itemCount={(stories || []).length}
//                 itemSize={200}
//                 width="100%"
//                 itemData={{ stories: stories || [], summaries: summaries || {} }}
//             >
//                 {Row}
//             </List>
//         </Container>
//     );
// };

// export default Home;

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
