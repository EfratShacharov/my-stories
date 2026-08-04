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
import UserProfile from './components/UserProfile';
import './index.css';
import { CommentsProvider } from './context/CommentsContext';
import { supabase } from './supabase';

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: { main: '#c8860a' },
    secondary: { main: '#5c3a1e' },
    background: { default: '#f5ede3', paper: '#fffaf5' },
    text: { primary: '#3b2008', secondary: '#7a5c3a' },
  },
  typography: {
    fontFamily: `'Segoe UI', 'Helvetica Neue', Arial, sans-serif`,
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': { overflowX: 'hidden', maxWidth: '100%' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: '0 2px 16px rgba(200,134,10,0.10)' },
      },
    },
  },
});

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showUser, setShowUser] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async (userId) => {
    if (!userId) { setUnreadCount(0); return; }
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setUnreadCount(count || 0);
  };

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
    setUserEmail(userId ? (await supabase.auth.getUser()).data?.user?.email || "" : "");
    await loadUnreadCount(userId);
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
          setUserName("");
          setIsAdmin(false);
          setShowUser(false);
          setUnreadCount(0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase
      .channel('notifications-count')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${session.user.id}`,
      }, (payload) => {
        if (!payload.new.is_read) setUnreadCount((c) => c + 1);
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${session.user.id}`,
      }, (payload) => {
        if (payload.new.is_read && !payload.old.is_read) setUnreadCount((c) => Math.max(0, c - 1));
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'notifications',
      }, (payload) => {
        if (!payload.old.is_read) setUnreadCount((c) => Math.max(0, c - 1));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session?.user?.id]);

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
              userEmail={userEmail}
              unreadCount={unreadCount}
              onAuthClick={() => setAuthOpen(true)}
              onLogout={async () => {
                await supabase.auth.signOut();
                setIsAdmin(false);
                setSession(null);
                setUserName("");
                setShowUser(false);
                setUnreadCount(0);
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
                <Route path="/profile/:tab" element={session ? <UserProfile session={session} onNameChange={(n) => setUserName(n)} onMarkRead={() => setUnreadCount(0)} /> : <Home />} />
                <Route path="/profile" element={session ? <UserProfile session={session} onNameChange={(n) => setUserName(n)} onMarkRead={() => setUnreadCount(0)} /> : <Home />} />
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
