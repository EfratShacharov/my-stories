import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import { Box, CircularProgress, Container, Divider, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { supabase } from '../supabase';

const rtlStyle = { textAlign: 'right', unicodeBidi: 'plaintext' };
const rtlSx = { direction: 'rtl' };

const BehindTheScenes = () => {
  const { id } = useParams();
  const location = useLocation();
  const backTo = location.state?.from || '/';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('behind_the_scenes').select('*')
        .eq('story_id', parseInt(id, 10)).maybeSingle();
      if (!error) setData(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress sx={{ color: '#c8860a' }} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5ede3', pt: '64px' }}>
      <Container maxWidth="sm" sx={{ py: 5 }}>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Tooltip title={backTo === '/manage-behind' ? 'חזור לניהול' : 'חזור לדף הבית'}>
            <IconButton component={Link} to={backTo} sx={{ color: '#7a5c3a' }}>
              <ArrowForwardIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#3b2008', ...rtlSx }} style={rtlStyle}>
            {data?.story_title || 'מאחורי הקלעים'}
          </Typography>
          <TheaterComedyIcon sx={{ fontSize: 38, color: '#c8860a' }} />
        </Box>

        <Typography variant="body2" sx={{ color: '#7a5c3a', mb: 4, ...rtlSx }} style={rtlStyle}>
          הסיפור שמאחורי הסיפור
        </Typography>

        <Divider sx={{ borderColor: 'rgba(200,134,10,0.25)', mb: 4 }} />

        {!data ? (
          <Typography sx={{ color: '#7a5c3a', ...rtlSx }} style={rtlStyle}>תוכן בקרוב...</Typography>
        ) : (
          <>
            {data.tagline && (
              <Box sx={{
                borderRight: '3px solid #c8860a', pr: 2, py: 1, mb: 4,
                bgcolor: 'rgba(200,134,10,0.07)', borderRadius: '0 8px 8px 0', ...rtlSx
              }}>
                <Typography variant="body1" sx={{ fontStyle: 'italic', color: '#a0622a', lineHeight: 2, ...rtlSx }} style={rtlStyle}>
                  {data.tagline}
                </Typography>
              </Box>
            )}

            {data.content?.split('\n').map((line, i) => {
              if (!line.trim()) return <Box key={i} sx={{ height: '1em' }} />;
              return (
                <Typography key={i} variant="body1" sx={{ color: '#3b2008', lineHeight: 2.1, mb: 0.5, ...rtlSx }} style={rtlStyle}>
                  {line}
                </Typography>
              );
            })}

            {data.written_at && (
              <>
                <Divider sx={{ borderColor: 'rgba(200,134,10,0.2)', mt: 4, mb: 2 }} />
                <Typography variant="caption" sx={{ color: '#a0622a', display: 'block', ...rtlSx }} style={rtlStyle}>
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
