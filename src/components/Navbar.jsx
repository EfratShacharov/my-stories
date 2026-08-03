import AccountCircleIcon from '@mui/icons-material/AccountCircle';
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
      bgcolor: 'rgba(245,237,227,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(200,134,10,0.15)',
      color: 'text.primary',
    }}>
      <Toolbar style={{ justifyContent: 'space-between' }}>

        {/* צד שמאל — התחברות */}
        {session ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="התנתקות" arrow>
              <IconButton onClick={handlrLogout} sx={{ color: '#c8860a' }}>
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
            <IconButton onClick={onAuthClick} sx={{ color: '#c8860a' }}>
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* צד ימין — לוגו + ניווט */}
        {isMobile ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="img" src="/logo.png" alt="אפיזודה" sx={{ height: 36 }} />
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#c8860a' }}>
              <MenuIcon />
            </IconButton>
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
              PaperProps={{ sx: { width: 220, bgcolor: '#fffaf5' } }}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(200,134,10,0.15)' }}>
                <Box component="img" src="/logo.png" alt="אפיזודה" sx={{ height: 32 }} />
              </Box>
              <List sx={{ pt: 1 }} dir="rtl">
                {navLinks.map(link => (
                  <ListItemButton key={link.to} component={Link} to={link.to}
                    onClick={() => setDrawerOpen(false)}
                    selected={location.pathname === link.to}
                    sx={{ borderRadius: 2, mx: 1, mb: 0.5, '&.Mui-selected': { bgcolor: 'rgba(200,134,10,0.10)', color: '#c8860a' } }}>
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
            <Box component="img" src="/logo.png" alt="אפיזודה" sx={{ height: 40, ml: 1 }} />
            {navLinks.map(link => {
              const active = location.pathname === link.to;
              return (
                <Button key={link.to} component={Link} to={link.to}
                  sx={{
                    color: active ? '#c8860a' : '#5c3a1e',
                    fontWeight: active ? 700 : 500,
                    fontSize: 13,
                    px: 1.5,
                    borderBottom: active ? '2px solid #c8860a' : '2px solid transparent',
                    borderRadius: 0,
                    '&:hover': { color: '#c8860a', bgcolor: 'transparent' },
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
