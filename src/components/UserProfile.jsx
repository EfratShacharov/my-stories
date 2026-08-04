import React, { useEffect, useState } from "react";
import {
  Box, Button, CircularProgress, Container, Divider,
  IconButton, InputAdornment, TextField, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsIcon from "@mui/icons-material/Settings";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";

const TABS = [
  { id: "account",       label: "פרטים אישיים",   icon: <PersonIcon fontSize="small" /> },
  { id: "likes",         label: "סיפורים שאהבתי", icon: <FavoriteIcon fontSize="small" /> },
  { id: "comments",      label: "התגובות שלי",     icon: <ChatBubbleOutlineIcon fontSize="small" /> },
  { id: "notifications", label: "התראות",          icon: <NotificationsNoneIcon fontSize="small" /> },
  { id: "settings",      label: "הגדרות",          icon: <SettingsIcon fontSize="small" /> },
];

const SectionTitle = ({ icon, label }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, pb: 1.5,
    borderBottom: "2px solid rgba(200,134,10,0.15)" }}>
    <Box sx={{ color: "#c8860a", display: "flex" }}>{icon}</Box>
    <Typography variant="h6" fontWeight={700} color="#3b2008">{label}</Typography>
  </Box>
);

const Msg = ({ msg }) => !msg ? null : (
  <Box sx={{
    mb: 1.5, px: 2, py: 1, borderRadius: 2,
    bgcolor: msg.isError ? "rgba(92,58,30,0.08)" : "rgba(200,134,10,0.10)",
    border: `1px solid ${msg.isError ? "rgba(92,58,30,0.30)" : "rgba(200,134,10,0.35)"}`,
  }}>
    <Typography variant="body2" fontWeight={600}
      sx={{ color: msg.isError ? "#5c3a1e" : "#c8860a" }}>
      {msg.isError ? "⚠ " : "✓ "}{msg.text}
    </Typography>
  </Box>
);

const UserProfile = ({ session, onNameChange, onMarkRead }) => {
  const { tab = "account" } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [userData, setUserData]   = useState({ name: "", email: "" });
  const [nameForm, setNameForm]   = useState("");
  const [emailForm, setEmailForm] = useState("");
  const [pwForm, setPwForm]       = useState({ next: "", confirm: "" });
  const [showPw, setShowPw]       = useState({ next: false, confirm: false });
  const [likedStories, setLikedStories] = useState([]);
  const [myComments, setMyComments]     = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState({});
  const [msgs, setMsgs]       = useState({});

  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;

    (async () => {
      const [{ data: user }, { data: likes }] = await Promise.all([
        supabase.from("users").select("name, email, email_updates").eq("id", uid).maybeSingle(),
        supabase.from("story_likes").select("stories(id,title)").eq("user_identifier", uid),
      ]);

      const name  = user?.name  || "";
      const email = user?.email || session.user.email || "";

      const { data: userComments } = name
        ? await supabase.from("comments")
            .select("id,comment,story_title,created_at,status,story_id")
            .eq("name", name).eq("is_admin", false).is("parent_id", null)
            .order("created_at", { ascending: false })
        : { data: [] };

      const rootIds = (userComments || []).map((c) => c.id);
      const { data: replies } = rootIds.length
        ? await supabase.from("comments")
            .select("id,comment,name,created_at,status,is_admin,parent_id")
            .in("parent_id", rootIds)
            .order("created_at", { ascending: true })
        : { data: [] };

      const repliesMap = {};
      (replies || []).forEach((r) => {
        if (!r.is_admin && r.status !== "approved") return;
        if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = [];
        repliesMap[r.parent_id].push(r);
      });

      const commentsWithReplies = (userComments || []).map((c) => ({
        ...c, replies: repliesMap[c.id] || [],
      }));

      setUserData({ name, email });
      setNameForm(name);
      setEmailForm(email);
      setEmailUpdates(user?.email_updates ?? false);
      setLikedStories(likes?.map((l) => l.stories).filter(Boolean) || []);
      setMyComments(commentsWithReplies);
      const { data: notifs } = await supabase
        .from("notifications")
        .select("id,type,title,link,is_read,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      setNotifications(notifs || []);
      setLoading(false);
    })();
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${uid}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${uid}`,
      }, (payload) => {
        setNotifications((prev) =>
          prev.map((n) => n.id === payload.new.id ? payload.new : n)
        );
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'notifications',
      }, (payload) => {
        setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session?.user?.id]);

  const setMsg = (key, text, isError = false) => {
    setMsgs((p) => ({ ...p, [key]: { text, isError } }));
    setTimeout(() => setMsgs((p) => ({ ...p, [key]: null })), 3500);
  };
  const setSav = (key, val) => setSaving((p) => ({ ...p, [key]: val }));

  const saveName = async () => {
    if (!nameForm.trim()) return;
    setSav("name", true);
    const { error } = await supabase.from("users").update({ name: nameForm.trim() }).eq("id", session.user.id);
    if (!error) {
      setUserData((p) => ({ ...p, name: nameForm.trim() }));
      onNameChange?.(nameForm.trim());
      setMsg("name", "השם עודכן בהצלחה");
    } else setMsg("name", "שגיאה בשמירה", true);
    setSav("name", false);
  };

  const saveEmail = async () => {
    if (!emailForm.trim()) return;
    setSav("email", true);
    const { error } = await supabase.auth.updateUser({ email: emailForm.trim() });
    if (!error) {
      setUserData((p) => ({ ...p, email: emailForm.trim() }));
      setMsg("email", "נשלח מייל אימות לכתובת החדשה");
    } else setMsg("email", "שגיאה בעדכון המייל", true);
    setSav("email", false);
  };

  const savePassword = async () => {
    if (pwForm.next.length < 6) { setMsg("pw", "הסיסמה חייבת להכיל לפחות 6 תווים", true); return; }
    if (pwForm.next !== pwForm.confirm) { setMsg("pw", "הסיסמאות אינן תואמות", true); return; }
    setSav("pw", true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    if (!error) { setPwForm({ next: "", confirm: "" }); setMsg("pw", "הסיסמה עודכנה בהצלחה"); }
    else setMsg("pw", "שגיאה בעדכון הסיסמה", true);
    setSav("pw", false);
  };

  const saveSettings = async () => {
    setSav("settings", true);
    const { error } = await supabase.from("users").update({ email_updates: emailUpdates }).eq("id", session.user.id);
    if (!error) setMsg("settings", "ההגדרות נשמרו בהצלחה");
    else setMsg("settings", "שגיאה בשמירת ההגדרות", true);
    setSav("settings", false);
  };

  const dismissNotification = async (id) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!unread.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unread);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    onMarkRead?.();
  };

  useEffect(() => {
    if (tab === 'notifications' && notifications.length) markAllRead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, notifications.length]);

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderContent = () => {
    if (loading) return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
        <CircularProgress sx={{ color: "#c8860a" }} />
      </Box>
    );

    switch (tab) {
      case "account": return (
        <Box dir="rtl">
          <SectionTitle icon={<PersonIcon />} label="פרטים אישיים" />

          <Typography variant="caption" color="#7a5c3a" fontWeight={600} sx={{ mb: 0.5, display: "block" }}>שם</Typography>
          <TextField fullWidth size="small" sx={{ mb: 1.5 }} value={nameForm}
            onChange={(e) => setNameForm(e.target.value)}
            inputProps={{ style: { textAlign: "right" } }} />
          <Msg msg={msgs.name} />
          <Button variant="contained" size="small" onClick={saveName}
            disabled={saving.name || nameForm.trim() === userData.name}
            sx={{ mb: 3, background: "linear-gradient(135deg,#c8860a,#e8a830)", boxShadow: "none" }}>
            {saving.name ? "שומר..." : "עדכן שם"}
          </Button>

          <Divider sx={{ mb: 3, borderColor: "rgba(200,134,10,0.12)" }} />

          <Typography variant="caption" color="#7a5c3a" fontWeight={600} sx={{ mb: 0.5, display: "block" }}>כתובת מייל</Typography>
          <TextField fullWidth size="small" sx={{ mb: 1.5 }} value={emailForm}
            onChange={(e) => setEmailForm(e.target.value)}
            inputProps={{ style: { direction: "ltr", textAlign: "left" } }} />
          <Msg msg={msgs.email} />
          <Button variant="contained" size="small" onClick={saveEmail}
            disabled={saving.email || emailForm.trim() === userData.email}
            sx={{ mb: 3, background: "linear-gradient(135deg,#c8860a,#e8a830)", boxShadow: "none" }}>
            {saving.email ? "שומר..." : "עדכן מייל"}
          </Button>

          <Divider sx={{ mb: 3, borderColor: "rgba(200,134,10,0.12)" }} />

          <Typography variant="caption" color="#7a5c3a" fontWeight={600} sx={{ mb: 1.5, display: "block" }}>שינוי סיסמה</Typography>
          {["next", "confirm"].map((field) => (
            <TextField key={field} fullWidth size="small" sx={{ mb: 1.5 }}
              label={field === "next" ? "סיסמה חדשה" : "אימות סיסמה"}
              type={showPw[field] ? "text" : "password"}
              value={pwForm[field]}
              onChange={(e) => setPwForm((p) => ({ ...p, [field]: e.target.value }))}
              InputProps={{
                inputProps: { style: { direction: "ltr" } },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}>
                      {showPw[field] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }} />
          ))}
          <Msg msg={msgs.pw} />
          <Button variant="contained" size="small" onClick={savePassword}
            disabled={saving.pw || !pwForm.next || !pwForm.confirm}
            sx={{ background: "linear-gradient(135deg,#c8860a,#e8a830)", boxShadow: "none" }}>
            {saving.pw ? "שומר..." : "עדכן סיסמה"}
          </Button>
        </Box>
      );

      case "likes": return (
        <Box dir="rtl">
          <SectionTitle icon={<FavoriteIcon />} label="סיפורים שאהבתי" />
          {likedStories.length === 0
            ? <Typography variant="body2" color="#7a5c3a">עדיין לא אהבת סיפורים.</Typography>
            : likedStories.map((story) => (
              <Box key={story.id} sx={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                py: 1.2, px: 1.5, mb: 1, borderRadius: 2,
                bgcolor: "#fff8ee", border: "1px solid rgba(200,134,10,0.12)",
              }}>
                <Typography variant="body2" color="#3b2008" fontWeight={500}>{story.title}</Typography>
                <Button component={Link} to={`/story/${story.id}`} size="small"
                  sx={{ color: "#c8860a", fontWeight: 600, p: 0, minWidth: 0,
                    "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>
                  קרא
                </Button>
              </Box>
            ))
          }
        </Box>
      );

      case "comments": return (
        <Box dir="rtl">
          <SectionTitle icon={<ChatBubbleOutlineIcon />} label="התגובות שלי" />
          {myComments.length === 0
            ? <Typography variant="body2" color="#7a5c3a">עדיין לא כתבת תגובות.</Typography>
            : myComments.map((c) => {
              return (
                <Box key={c.id} sx={{
                  py: 1.5, px: 2, mb: 2, borderRadius: 2,
                  bgcolor: "#fff8ee", border: "1px solid rgba(200,134,10,0.12)",
                }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" color="#7a5c3a">{formatDate(c.created_at)}</Typography>
                    <Typography variant="caption" fontWeight={700} color="#c8860a">{c.story_title}</Typography>
                  </Box>
                  <Typography variant="body2" color="#3b2008" sx={{ lineHeight: 1.8 }}>{c.comment}</Typography>
                  {c.story_id && (
                    <Box sx={{ mt: 1, textAlign: "left" }}>
                      <Button component={Link} to={`/story/${c.story_id}`} size="small"
                        sx={{ color: "#c8860a", p: 0, fontSize: 11,
                          "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>
                        לסיפור
                      </Button>
                    </Box>
                  )}

                  {c.replies.length > 0 && (
                    <Box sx={{ mt: 1.5, borderTop: "1px solid rgba(200,134,10,0.12)", pt: 1.5 }}>
                      {c.replies.map((r) => (
                        <Box key={r.id} sx={{
                          px: 1.5, py: 1, mb: 1, borderRadius: 1.5,
                          bgcolor: r.is_admin ? "#fffbf0" : "#fff",
                          border: `1px solid ${r.is_admin ? "rgba(200,134,10,0.25)" : "rgba(200,134,10,0.10)"}`,
                        }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
                            <Typography variant="caption" color="#7a5c3a">{formatDate(r.created_at)}</Typography>
                            <Typography variant="caption" fontWeight={700}
                              sx={{ color: r.is_admin ? "#c8860a" : "#5c3a1e" }}>
                              {r.is_admin ? "מנהלת" : r.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="#3b2008" sx={{ lineHeight: 1.8 }}>{r.comment}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })
          }
        </Box>
      );

      case "notifications": return (
        <Box dir="rtl">
          <SectionTitle icon={<NotificationsNoneIcon />} label="התראות" />
          {notifications.length === 0
            ? <Typography variant="body2" color="#7a5c3a">אין התראות חדשות.</Typography>
            : (
              <>
                {notifications.some((n) => !n.is_read) && (
                  <Button size="small" onClick={markAllRead}
                    sx={{ mb: 2, color: '#c8860a', p: 0, fontSize: 12,
                      '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                    סמן הכל כנקראו
                  </Button>
                )}
                {notifications.map((n) => (
                  <Box key={n.id}
                    sx={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      py: 1.2, px: 0, mb: 1, borderRadius: 2,
                      bgcolor: n.is_read ? '#fff8ee' : 'rgba(200,134,10,0.10)',
                      border: `1px solid ${n.is_read ? 'rgba(200,134,10,0.12)' : 'rgba(200,134,10,0.35)'}`,
                      overflow: 'hidden',
                    }}>
                    <Box sx={{ flex: 1, px: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                        <Typography variant="caption" color="#7a5c3a">{formatDate(n.created_at)}</Typography>
                        {!n.is_read && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#c8860a' }} />
                        )}
                      </Box>
                      <Typography variant="body2" color="#3b2008">{n.title}</Typography>
                    </Box>
                    <Button size="small" onClick={(e) => { e.preventDefault(); dismissNotification(n.id); }}
                      sx={{ flexShrink: 0, color: '#7a5c3a', fontSize: 11, px: 1.2, py: 0.4,
                        border: '1px solid rgba(92,58,30,0.25)', borderRadius: 2,
                        bgcolor: 'rgba(92,58,30,0.06)', mr: 1.5,
                        '&:hover': { bgcolor: 'rgba(92,58,30,0.12)' } }}>
                      הבנתי
                    </Button>
                  </Box>
                ))}
              </>
            )
          }
        </Box>
      );

      case "settings": return (
        <Box dir="rtl">
          <SectionTitle icon={<SettingsIcon />} label="הגדרות" />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Box onClick={() => setEmailUpdates((v) => !v)} sx={{
              width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background 0.2s",
              bgcolor: emailUpdates ? "#c8860a" : "rgba(200,134,10,0.2)",
              position: "relative", flexShrink: 0,
            }}>
              <Box sx={{
                position: "absolute", top: 3, transition: "left 0.2s",
                left: emailUpdates ? 23 : 3,
                width: 18, height: 18, borderRadius: "50%", bgcolor: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }} />
            </Box>
            <Typography variant="body2" color="#3b2008">קבלת עדכונים למייל כשמשיבים לתגובות שלי</Typography>
          </Box>
          <Msg msg={msgs.settings} />
          <Button variant="contained" size="small" onClick={saveSettings} disabled={saving.settings}
            sx={{ background: "linear-gradient(135deg,#c8860a,#e8a830)", boxShadow: "none" }}>
            {saving.settings ? "שומר..." : "שמור הגדרות"}
          </Button>
        </Box>
      );

      default: return null;
    }
  };

  return (
    <Box sx={{ bgcolor: "#f5ede3", minHeight: "100vh", pt: { xs: "56px", sm: "64px" } }}>

      {/* ── internal nav header ── */}
      <Box sx={{
        position: "sticky", top: { xs: 56, sm: 64 }, zIndex: 99,
        bgcolor: "rgba(255,250,245,0.97)", backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(200,134,10,0.15)",
        overflowX: "auto", "&::-webkit-scrollbar": { display: "none" },
      }}>
        <Box sx={{
          display: "flex", flexDirection: "row-reverse",
          justifyContent: { xs: "flex-start", sm: "center" },
          px: 1, minWidth: "max-content",
        }}>
          {TABS.map(({ id, label, icon }) => {
            const active = tab === id;
            return (
              <Button key={id} onClick={() => navigate(`/profile/${id}`)}
                size="small"
                sx={{
                  color: active ? "#c8860a" : "#7a5c3a",
                  fontWeight: active ? 700 : 500,
                  fontSize: { xs: 11, sm: 13 },
                  px: { xs: 1.2, sm: 1.8 },
                  py: 1.2, borderRadius: 0,
                  borderBottom: active ? "2px solid #c8860a" : "2px solid transparent",
                  whiteSpace: "nowrap",
                  flexDirection: "column",
                  gap: 0.3,
                  "&:hover": { color: "#c8860a", bgcolor: "transparent" },
                }}>
                <Box sx={{ display: "flex", position: 'relative' }}>
                  {icon}
                  {id === 'notifications' && unreadCount > 0 && (
                    <Box sx={{
                      position: 'absolute', top: -6, left: -6,
                      minWidth: 16, height: 16, borderRadius: '50%', px: '2px',
                      bgcolor: '#707070', border: '1.5px solid rgba(255,250,245,0.97)',
                      pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography sx={{ color: '#fff', fontSize: 9, fontWeight: 700, lineHeight: 1 }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Typography>
                    </Box>
                  )}
                </Box>
                {label}
              </Button>
            );
          })}
        </Box>
      </Box>

      {/* ── page content ── */}
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pt: 4, pb: 6 }}>
        <Box sx={{
          bgcolor: "#fffaf5", borderRadius: 3, p: { xs: 2.5, sm: 3 },
          border: "1px solid rgba(200,134,10,0.12)",
          boxShadow: "0 2px 16px rgba(200,134,10,0.07)",
        }}>
          {renderContent()}
        </Box>
      </Container>
    </Box>
  );
};

export default UserProfile;
