import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { Drawer, IconButton, List, ListItemButton, ListItemText, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = ({ isAdmin, session, userName, onAuthClick, onLogout }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    <AppBar position="fixed" sx={{ top: 0 }}>
      <Toolbar style={{ justifyContent: 'space-between' }}>

        {/* צד שמאל - התחברות */}
        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tooltip title="התנתקות" arrow>
              <IconButton color='inherit' onClick={handlrLogout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
            {!isMobile && <span style={{ color: 'white', fontSize: 14 }}>שלום {userName}</span>}
          </div>
        ) : (
          <Tooltip title="כניסה" arrow>
            <IconButton color='inherit' onClick={onAuthClick}>
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* צד ימין - ניווט */}
        {isMobile ? (
          <>
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
              <List sx={{ width: 200, pt: 2 }} dir="rtl">
                {navLinks.map(link => (
                  <ListItemButton key={link.to} component={Link} to={link.to} onClick={() => setDrawerOpen(false)}>
                    <ListItemText primary={link.label} />
                  </ListItemButton>
                ))}
                {session && (
                  <ListItemButton>
                    <ListItemText primary={`שלום ${userName}`} sx={{ color: 'text.secondary' }} />
                  </ListItemButton>
                )}
              </List>
            </Drawer>
          </>
        ) : (
          <div>
            {navLinks.map(link => (
              <Button key={link.to} color="inherit" component={Link} to={link.to}>{link.label}</Button>
            ))}
          </div>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
