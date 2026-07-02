import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, Drawer, IconButton, List, ListItemButton, ListItemText, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';

const Navbar = ({ isAdmin, session, userName, onAuthClick, onLogout }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();

  const handlrLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const navLinks = [
    { label: 'דף הבית', to: '/' },
    { label: 'תגובות', to: '/comments' },
    { label: 'אודות', to: '/about' },
    ...(isAdmin ? [
      { label: 'ניהול קבצים', to: '/files' },
      { label: 'ניהול תגובות', to: '/manage-comments' },
      { label: 'מאחורי הקלעים', to: '/manage-behind' },
    ] : []),
  ];

  return (
    <AppBar position="fixed" elevation={0} sx={{
      top: 0,
      bgcolor: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(108,99,255,0.1)',
      color: 'text.primary',
    }}>
      <Toolbar style={{ justifyContent: 'space-between' }}>

        {/* צד שמאל — התחברות */}
        {session ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="התנתקות" arrow>
              <IconButton onClick={handlrLogout} sx={{ color: '#6c63ff' }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {!isMobile && (
              <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
                שלום {userName}
              </Typography>
            )}
          </Box>
        ) : (
          <Tooltip title="כניסה" arrow>
            <IconButton onClick={onAuthClick} sx={{ color: '#6c63ff' }}>
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* צד ימין — לוגו + ניווט */}
        {isMobile ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoStoriesIcon sx={{ color: '#6c63ff', fontSize: 22 }} />
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#6c63ff' }}>
              <MenuIcon />
            </IconButton>
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: 220, bgcolor: '#fafafa' } }}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #eee' }}>
                <AutoStoriesIcon sx={{ color: '#6c63ff' }} />
                <Typography fontWeight={700} sx={{ color: '#1a1a2e' }}>הסיפורים שלי</Typography>
              </Box>
              <List sx={{ pt: 1 }} dir="rtl">
                {navLinks.map(link => (
                  <ListItemButton key={link.to} component={Link} to={link.to}
                    onClick={() => setDrawerOpen(false)}
                    selected={location.pathname === link.to}
                    sx={{ borderRadius: 2, mx: 1, mb: 0.5, '&.Mui-selected': { bgcolor: 'rgba(108,99,255,0.08)', color: '#6c63ff' } }}>
                    <ListItemText primary={link.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
                  </ListItemButton>
                ))}
                {session && (
                  <ListItemButton sx={{ mx: 1 }}>
                    <ListItemText primary={`שלום ${userName}`} primaryTypographyProps={{ fontSize: 13, color: '#6b7280' }} />
                  </ListItemButton>
                )}
              </List>
            </Drawer>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AutoStoriesIcon sx={{ color: '#6c63ff', fontSize: 22, ml: 1 }} />
            {navLinks.map(link => {
              const active = location.pathname === link.to;
              return (
                <Button key={link.to} component={Link} to={link.to}
                  sx={{
                    color: active ? '#6c63ff' : '#4b5563',
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    px: 1.5,
                    borderBottom: active ? '2px solid #6c63ff' : '2px solid transparent',
                    borderRadius: 0,
                    '&:hover': { color: '#6c63ff', bgcolor: 'transparent' },
                  }}>
                  {link.label}
                </Button>
              );
            })}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
