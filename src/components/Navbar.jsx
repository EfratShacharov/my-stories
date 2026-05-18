import React, { useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import AdminLogin from './AdminLogin';

const Navbar = ({ isAdmin, setIsAdmin }) => {
  useEffect(() => {
    const savedAdmin = JSON.parse(localStorage.getItem("isAdmin")) || false;
    setIsAdmin(savedAdmin);
  }, [setIsAdmin]);

  return (
    <AppBar position="fixed" sx={{ top: 0 }}>
      <Toolbar style={{ justifyContent: 'space-between' }}>
        {/* מעבירים את setIsAdmin ל-AdminLogin */}
        <AdminLogin setIsAdmin={setIsAdmin} />
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
