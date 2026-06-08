import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { IconButton, Tooltip } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

const Navbar = ({ isAdmin, session, userName, onAuthClick, onLogout }) => {
  const handlrLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

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
            <span style={{ color: 'white', fontSize: 14 }}>
              שלום {userName}
            </span>
          </div>
        ) : (
          <Tooltip title="כניסה" arrow>
            <IconButton color='inherit' onClick={onAuthClick}>
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* צד ימין - ניווט */}
        <div>
          <Button color="inherit" component={Link} to="/comments">תגובות</Button>
          <Button color="inherit" component={Link} to="/">דף הבית</Button>
          {/* כפתור למנהל בלבד */}
          {isAdmin && <Button color="inherit" component={Link} to="/files">ניהול קבצים</Button>}
          {isAdmin && <Button color="inherit" component={Link} to="/manage-comments">ניהול תגובות</Button>}
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
