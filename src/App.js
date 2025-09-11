import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import CommentPage from './components/CommentPage';
import Home from './components/Home';
import Navbar from './components/Navbar';
import StoryPage from './components/StoryPage';
import './index.css';
import { CommentsProvider } from './context/CommentsContext';

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
  return (
    <CommentsProvider>
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Navbar />
            <div className="app-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/story/:id" element={<StoryPage />} />
                <Route path="/comments" element={<CommentPage />} />
              </Routes>
            </div>
          </Router>
        </ThemeProvider>
      </CacheProvider>
    </CommentsProvider>
  );
}

export default App;
