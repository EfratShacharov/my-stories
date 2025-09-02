import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar style={{ justifyContent: 'space-between' }}>
        <Typography variant="h6">
          הסיפורים שלי
        </Typography>
        <div>
          <Button color="inherit" component={Link} to="/">דף הבית</Button>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
