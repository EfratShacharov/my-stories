import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import React, { useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import CommentPage from './components/CommentPage';
import Home from './components/Home';
import Navbar from './components/Navbar';
import StoryPage from './components/StoryPage';
import './index.css';
import { CommentsProvider } from './context/CommentsContext';
import FileManager from './components/FileManager';

// יצירת cache ל־RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// יצירת Theme עם RTL
const theme = createTheme({
  direction: 'rtl', // משנה את כיוון כל רכיבי MUI ל־Right-to-Left
});

function App() {
  const [isAdmin, setIsAdmin] = useState(() => {
    const savedAdmin = localStorage.getItem("isAdmin");
    return savedAdmin ? JSON.parse(savedAdmin) : false;
  });

  return (
    <CommentsProvider>
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Navbar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
            <div className="app-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/story/:id" element={<StoryPage />} />
                <Route path="/comments" element={<CommentPage />} />
                {isAdmin && <Route path='/files' element={<FileManager />} />}
              </Routes>
            </div>
          </Router>
        </ThemeProvider>
      </CacheProvider>
    </CommentsProvider>
  );
}

export default App;
