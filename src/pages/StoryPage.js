import { Button, Container, Typography } from '@mui/material';
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import stories from '../data/Stories';

const StoryPage = () => {
  const { id } = useParams();
  const story = stories.find(s => s.id === parseInt(id));

  if (!story) {
    return (
      <Container style={{ padding: 20, textAlign: 'right' }}>
        <Typography variant="h5">סיפור לא נמצא</Typography>
        <Button component={Link} to="/" variant="contained" style={{ marginTop: 10 }}>
          חזור לדף הבית
        </Button>
      </Container>
    );
  }

  return (
    <Container style={{ padding: 20, textAlign: 'right' }}>
      <Typography variant="h4" style={{ marginBottom: 20 }}>
        {story.title}
      </Typography>
      <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
        {story.content}
      </Typography>
      <Button component={Link} to="/" variant="contained" style={{ marginTop: 20 }}>
        חזור לדף הבית
      </Button>
    </Container>
  );
};

export default StoryPage;
