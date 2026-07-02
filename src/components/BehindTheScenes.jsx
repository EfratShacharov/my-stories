import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import { Box, CircularProgress, Container, Divider, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabase';

const rtlStyle = { textAlign: 'right', unicodeBidi: 'plaintext' };
const rtlSx = { direction: 'rtl' };

const BehindTheScenes = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('behind_the_scenes')
        .select('*')
        .eq('story_id', parseInt(id, 10))
        .maybeSingle();
      if (!error) setData(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0d0d0d', pt: '64px' }}>
      <Container maxWidth="sm" sx={{ py: 5 }}>

        {/* כפתור חזרה */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Tooltip title="חזור לדף הבית">
            <IconButton component={Link} to="/" sx={{ color: '#aaa' }}>
              <ArrowForwardIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* כותרת */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', ...rtlSx }} style={rtlStyle}>
            {data?.story_title || 'מאחורי הקלעים'}
          </Typography>
          <TheaterComedyIcon sx={{ fontSize: 38, color: '#f0a500' }} />
        </Box>

        <Typography variant="body2" sx={{ color: '#888', mb: 4, ...rtlSx }} style={rtlStyle}>
          הסיפור שמאחורי הסיפור
        </Typography>

        <Divider sx={{ borderColor: '#333', mb: 4 }} />

        {!data ? (
          <Typography sx={{ color: '#888', ...rtlSx }} style={rtlStyle}>
            תוכן בקרוב...
          </Typography>
        ) : (
          <>
            {/* ציטוט / כותרת משנה */}
            {data.tagline && (
              <Box sx={{
                borderRight: '3px solid #f0a500',
                pr: 2, py: 1, mb: 4,
                bgcolor: 'rgba(240,165,0,0.07)',
                borderRadius: '0 8px 8px 0',
                ...rtlSx
              }}>
                <Typography variant="body1" sx={{ fontStyle: 'italic', color: '#f0c060', lineHeight: 2, ...rtlSx }} style={rtlStyle}>
                  {data.tagline}
                </Typography>
              </Box>
            )}

            {/* תוכן ראשי */}
            {data.content?.split('\n').map((line, i) => {
              if (!line.trim()) return <Box key={i} sx={{ height: '1em' }} />;
              return (
                <Typography key={i} variant="body1" sx={{ color: '#ddd', lineHeight: 2.1, mb: 0.5, ...rtlSx }} style={rtlStyle}>
                  {line}
                </Typography>
              );
            })}

            {/* תאריך כתיבה */}
            {data.written_at && (
              <>
                <Divider sx={{ borderColor: '#333', mt: 4, mb: 2 }} />
                <Typography variant="caption" sx={{ color: '#555', display: 'block', ...rtlSx }} style={rtlStyle}>
                  נכתב: {new Date(data.written_at).toLocaleDateString('he-IL')}
                </Typography>
              </>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default BehindTheScenes;
