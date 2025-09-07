import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, Toolbar } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import StoryPage from './pages/StoryPage';
import './index.css';

// יצירת cache ל־RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// יצירת theme עם RTL
const theme = createTheme({
  direction: 'rtl',
});

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Navbar />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/story/:id" element={<StoryPage />} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
