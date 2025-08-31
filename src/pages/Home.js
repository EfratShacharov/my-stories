import { Button, Card, CardContent, Container, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import stories from '../data/Stories';

const Home = () => {
    return (
        <Container style={{ padding: 20 }}>
            <Typography variant="h4" style={{ marginBottom: 20, textAlign: 'right' }}>
                רשימת סיפורים
            </Typography>
            {stories.map(story => (
                <Card key={story.id} style={{ marginBottom: 10, textAlign: 'right' }}>
                    <CardContent>
                        <Typography variant="h5">{story.title}</Typography>
                        <Typography variant="body2">{story.summary}</Typography>
                        <Button
                            variant="contained"
                            style={{ marginTop: 10 }}
                            href={story.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            קרא עוד
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </Container>
    );
};

export default Home;
