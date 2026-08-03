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

const UserProfile = ({ session, onNameChange }) => {
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

      setUserData({ name, email });
      setNameForm(name);
      setEmailForm(email);
      setEmailUpdates(user?.email_updates ?? false);
      setLikedStories(likes?.map((l) => l.stories).filter(Boolean) || []);
      setMyComments(userComments || []);
      setNotifications([]);
      setLoading(false);
    })();
  }, [session]);

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

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });

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
            : myComments.map((c) => (
              <Box key={c.id} sx={{
                py: 1.5, px: 2, mb: 1.5, borderRadius: 2,
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
              </Box>
            ))
          }
        </Box>
      );

      case "notifications": return (
        <Box dir="rtl">
          <SectionTitle icon={<NotificationsNoneIcon />} label="התראות" />
          {notifications.length === 0
            ? <Typography variant="body2" color="#7a5c3a">אין התראות חדשות.</Typography>
            : notifications.map((n, i) => (
              <Box key={i} sx={{ py: 1.2, px: 2, mb: 1, borderRadius: 2,
                bgcolor: "#fff8ee", border: "1px solid rgba(200,134,10,0.12)" }}>
                <Typography variant="body2" color="#3b2008">{n.text}</Typography>
                <Typography variant="caption" color="#7a5c3a">{formatDate(n.created_at)}</Typography>
              </Box>
            ))
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
                <Box sx={{ display: "flex" }}>{icon}</Box>
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
