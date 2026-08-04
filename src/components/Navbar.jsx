import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  AppBar, Box, Divider, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const PROFILE_ITEMS = [
  { label: 'פרטים אישיים',   tab: 'account',       icon: <PersonIcon fontSize="small" /> },
  { label: 'סיפורים שאהבתי', tab: 'likes',          icon: <FavoriteIcon fontSize="small" /> },
  { label: 'התגובות שלי',    tab: 'comments',       icon: <ChatBubbleOutlineIcon fontSize="small" /> },
  { label: 'התראות',         tab: 'notifications',  icon: <NotificationsNoneIcon fontSize="small" /> },
  { label: 'הגדרות',         tab: 'settings',       icon: <SettingsIcon fontSize="small" /> },
];

const UnreadBadge = ({ count, bg = '#fffaf5' }) => count > 0 ? (
  <Box sx={{
    position: 'absolute', top: -6, left: -6,
    minWidth: 16, height: 16, borderRadius: '50%', px: '2px',
    bgcolor: '#707070', border: `1.5px solid ${bg}`,
    pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Typography sx={{ color: '#fff', fontSize: 9, fontWeight: 700, lineHeight: 1 }}>
      {count > 9 ? '9+' : count}
    </Typography>
  </Box>
) : null;

const Navbar = ({ isAdmin, session, userName, userEmail, onAuthClick, onLogout, unreadCount = 0 }) => {
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [menuAnchor, setMenuAnchor]     = useState(null);
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setMenuAnchor(null);
    await supabase.auth.signOut();
    onLogout();
  };

  const handleProfileNav = (tab) => {
    setMenuAnchor(null);
    setDrawerOpen(false);
    navigate(`/profile/${tab}`);
  };

  const navLinks = [
    { label: 'דף הבית', to: '/' },
    { label: 'תגובות',  to: '/comments' },
    { label: 'אודות',   to: '/about' },
    ...(isAdmin ? [
      { label: 'ניהול קבצים',    to: '/files' },
      { label: 'ניהול תגובות',   to: '/manage-comments' },
      { label: 'מאחורי הקלעים', to: '/manage-behind' },
    ] : []),
  ];

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{
        bgcolor: 'rgba(245,237,227,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(200,134,10,0.15)',
        color: 'text.primary',
      }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>

          {/* ── שמאל: פרופיל / כניסה ── */}
          {session ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {!isMobile && (
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <Button
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                    endIcon={<PersonIcon fontSize="small" />}
                    size="small"
                    sx={{
                      color: '#c8860a', fontWeight: 600, fontSize: 13,
                      border: '1px solid rgba(200,134,10,0.35)', borderRadius: 2,
                      px: 1.5, py: 0.4,
                      '& .MuiButton-endIcon': { ml: 0, mr: 0.5 },
                      bgcolor: menuAnchor ? 'rgba(200,134,10,0.08)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(200,134,10,0.08)' },
                    }}
                  >
                    שלום {userName}
                  </Button>
                  <UnreadBadge count={unreadCount} bg="rgba(245,237,227,0.92)" />
                </Box>
              )}
            </Box>
          ) : (
            <Tooltip title="כניסה" arrow>
              <IconButton onClick={onAuthClick} sx={{ color: '#c8860a' }}>
                <AccountCircleIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* ── ימין: לוגו + ניווט ── */}
          {isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="img" src="/logo.png" alt="אפיזודה" sx={{ height: 36 }} />
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#c8860a' }}>
                <MenuIcon />
              </IconButton>
              <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: 230, bgcolor: '#fffaf5' } }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(200,134,10,0.15)' }}>
                  <Box component="img" src="/logo.png" alt="אפיזודה" sx={{ height: 32 }} />
                </Box>
                <List sx={{ pt: 1 }} dir="rtl">
                  {navLinks.map(link => (
                    <ListItemButton key={link.to} component={Link} to={link.to}
                      onClick={() => setDrawerOpen(false)}
                      selected={location.pathname === link.to}
                      sx={{ borderRadius: 2, mx: 1, mb: 0.5,
                        '&.Mui-selected': { bgcolor: 'rgba(200,134,10,0.10)', color: '#c8860a' } }}>
                      <ListItemText primary={link.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
                    </ListItemButton>
                  ))}
                  {session && (
                    <>
                      <Divider sx={{ my: 1, borderColor: 'rgba(200,134,10,0.15)' }} />
                      <Box sx={{ px: 2, py: 0.5 }}>
                        <Typography variant="caption" color="#7a5c3a" fontWeight={600}>{userName}</Typography>
                      </Box>
                      {PROFILE_ITEMS.map(({ label, tab, icon }) => (
                        <ListItemButton key={tab} onClick={() => handleProfileNav(tab)}
                          selected={location.pathname === `/profile/${tab}`}
                          sx={{ borderRadius: 2, mx: 1, mb: 0.5,
                            '&.Mui-selected': { bgcolor: 'rgba(200,134,10,0.10)', color: '#c8860a' } }}>
                          <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{icon}</ListItemIcon>
                          <ListItemText primary={label} primaryTypographyProps={{ fontSize: 13 }} />
                        </ListItemButton>
                      ))}
                    </>
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
                  <Button key={link.to} component={Link} to={link.to} sx={{
                    color: active ? '#c8860a' : '#5c3a1e',
                    fontWeight: active ? 700 : 500, fontSize: 13, px: 1.5,
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

      {/* ── Dropdown menu ── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 0.5, minWidth: 210,
            bgcolor: '#fffaf5',
            border: '1px solid rgba(200,134,10,0.18)',
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(200,134,10,0.14)',
            overflow: 'hidden',
          },
        }}
      >
        {/* user info header */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }} dir="rtl">
          <Typography variant="subtitle2" fontWeight={700} color="#3b2008">{userName}</Typography>
          <Typography variant="caption" color="#7a5c3a">{userEmail}</Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(200,134,10,0.15)', mb: 0.5 }} />

        {/* nav items */}
        {PROFILE_ITEMS.map(({ label, tab, icon }) => {
          const active = location.pathname === `/profile/${tab}`;
          return (
            <MenuItem key={tab} onClick={() => handleProfileNav(tab)} dir="rtl"
              sx={{
                gap: 1.5, py: 1, px: 2,
                color: active ? '#c8860a' : '#3b2008',
                fontWeight: active ? 700 : 400,
                bgcolor: active ? 'rgba(200,134,10,0.07)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(200,134,10,0.07)', color: '#c8860a' },
              }}>
              <Box sx={{ color: active ? '#c8860a' : '#bfa07a', display: 'flex', position: 'relative' }}>
                {icon}
                {tab === 'notifications' && <UnreadBadge count={unreadCount} />}
              </Box>
              <Typography variant="body2" fontWeight="inherit">{label}</Typography>
            </MenuItem>
          );
        })}

        {/* logout */}
        <Divider sx={{ borderColor: 'rgba(200,134,10,0.15)', mt: 0.5 }} />
        <MenuItem onClick={handleLogout} dir="rtl"
          sx={{ gap: 1.5, py: 1, px: 2, color: '#5c3a1e',
            '&:hover': { bgcolor: 'rgba(92,58,30,0.07)', color: '#5c3a1e' } }}>
          <Box sx={{ display: 'flex', color: '#5c3a1e' }}><LogoutIcon fontSize="small" /></Box>
          <Typography variant="body2">התנתקות</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default Navbar;
