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
import FileManager from './components/FileManager';
import CommentsManager from './components/CommentsManager';
import About from './components/About';
import BehindTheScenes from './components/BehindTheScenes';
import BehindManager from './components/BehindManager';
import AuthModal from './components/AuthModal';

import './index.css';
import { CommentsProvider } from './context/CommentsContext';
import { supabase } from './supabase';

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const theme = createTheme({
  direction: 'rtl',
});

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showUser, setShowUser] = useState(false);

  const loadUserData = async (userId) => {
    if (!userId) {
      setUserName("");
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("name, is_admin")
      .eq("id", userId)
      .maybeSingle();

    setUserName(data?.name || "");
    setIsAdmin(data?.is_admin === true);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setSession(session);
        loadUserData(session.user.id).then(() => {
          setShowUser(true);
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          // התנתקות
          setUserName("");
          setIsAdmin(false);
          setShowUser(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <CommentsProvider>
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Navbar
              isAdmin={isAdmin}
              session={showUser ? session : null}
              userName={userName}
              onAuthClick={() => setAuthOpen(true)}
              onLogout={async () => {
                await supabase.auth.signOut();
                setIsAdmin(false);
                setSession(null);
                setUserName("");
                setShowUser(false);
              }}
            />

            <div className="app-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/story/:id"
                  element={
                    <StoryPage
                      session={session}
                      isAdmin={isAdmin}
                      onAuthClick={() => setAuthOpen(true)}
                    />
                  }
                />
                <Route
                  path="/comments"
                  element={
                    <CommentPage
                      isAdmin={isAdmin}
                      session={session}
                      onAuthClick={() => setAuthOpen(true)}
                    />
                  }
                />
                <Route
                  path="/files"
                  element={isAdmin ? <FileManager /> : <Home />}
                />

                <Route
                  path="/manage-comments"
                  element={isAdmin ? <CommentsManager /> : <Home />}
                />
                <Route path="/about" element={<About />} />
                <Route path="/behind/:id" element={<BehindTheScenes />} />
                <Route path="/manage-behind" element={isAdmin ? <BehindManager /> : <Home />} />
              </Routes>
            </div>

            <AuthModal
              open={authOpen}
              onClose={() => setAuthOpen(false)}
              onLoginSuccess={async (sess, adminStatus) => {
                setSession(sess);
                setIsAdmin(adminStatus || false);
                await loadUserData(sess?.user?.id);
                setShowUser(true);
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