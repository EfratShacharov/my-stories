import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import React, { useEffect, useState } from 'react';
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
import CommentsManager from './components/CommentsManager';
import { supabase } from './supabase';
import AuthModal from './components/AuthModal';

// יצירת cache ל־RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// יצירת Theme עם RTL
const theme = createTheme({
  direction: 'rtl',
});

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [userName, setUserName] = useState("");

  const fetchUserName = async (session) => {
    if (!session) return;
    const { data, error } = await supabase
      .from("users")
      .select("name")
      .eq("id", session.user.id)
      .maybeSingle();
    console.log("data:", data);
    console.log("error:", error);
    if (data) setUserName(data.name);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchUserName(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      fetchUserName(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <CommentsProvider>
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Navbar
              isAdmin={isAdmin}
              session={session}
              userName={userName}
              onAuthClick={() => setAuthOpen(true)}
              onLogout={() => {
                setIsAdmin(false);
                setSession(null);
              }}
            />
            <div className="app-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/story/:id" element={<StoryPage session={session} onAuthClick={() => setAuthOpen(true)} />} />
                <Route path="/comments" element={<CommentPage isAdmin={isAdmin} session={session} onAuthClick={() => setAuthOpen(true)} />} />
                {isAdmin && <Route path='/files' element={<FileManager />} />}
                {isAdmin && <Route path='/manage-comments' element={<CommentsManager />} />}
              </Routes>
            </div>

            <AuthModal
              open={authOpen}
              onClose={() => setAuthOpen(false)}
              onLoginSuccess={(session, adminStatus) => {
                setSession(session);
                setIsAdmin(adminStatus || false);
                setAuthOpen(false);
              }}
            />
          </Router>
        </ThemeProvider>
      </CacheProvider>
    </CommentsProvider>
  );
}

export default App;
