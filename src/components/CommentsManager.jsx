import React, { useEffect, useState } from "react";
import {
    Box, Button, Chip, CircularProgress, Collapse, Container, TextField, Typography
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { useComments } from "../context/CommentsContext";
import { supabase } from "../supabase";

const toDate = (dt) => new Date(dt.endsWith("Z") || dt.includes("+") ? dt : dt + "Z");
const formatDate = (dt) =>
    `${toDate(dt).toLocaleDateString("en-GB", { timeZone: "Asia/Jerusalem" }).replace(/\//g, ".")}, ${toDate(dt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" })}`;

const getStatusColor = (status) => {
    if (status === "approved") return "success";
    if (status === "rejected") return "error";
    return "warning";
};
const getStatusLabel = (status) => {
    if (status === "approved") return "מאושר";
    if (status === "rejected") return "נדחה";
    return "ממתין";
};

const CommentsManager = () => {
    const { comments, fetchComments, notifyReply } = useComments();
    const [loading, setLoading] = useState(false);
    const [replyInputs, setReplyInputs] = useState({});
    const [openReply, setOpenReply] = useState({});
    const [adminName, setAdminName] = useState("");

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session?.user?.id) return;
            const { data } = await supabase.from("users").select("name").eq("id", session.user.id).maybeSingle();
            if (data?.name) setAdminName(data.name);
        });
    }, []);

    const updateStatus = async (id, status) => {
        const { error } = await supabase.from("comments").update({ status }).eq("id", id);
        if (error) { console.error("שגיאה בעדכון:", error); return; }
        await fetchComments();
    };

    const sendReply = async (comment) => {
        const text = replyInputs[comment.id];
        if (!text?.trim()) return;
        const { data, error } = await supabase.from("comments").insert([{
            name: adminName, story_id: comment.story_id, story_title: comment.story_title,
            comment: text, email: "", is_admin: true, status: "approved", parent_id: comment.id,
        }]).select("id").maybeSingle();
        if (error) { console.error(error); return; }
        if (data?.id) await notifyReply(data.id);
        setReplyInputs((prev) => ({ ...prev, [comment.id]: "" }));
        setOpenReply((prev) => ({ ...prev, [comment.id]: false }));
        await fetchComments();
    };

    const ReplyItem = ({ reply, depth = 0 }) => {
        const children = comments.filter((r) => r.parent_id === reply.id)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        return (
            <>
                <Box dir="rtl" sx={{
                    mt: 2, mr: depth > 0 ? 2 : 4, p: 2, borderRadius: 2,
                    bgcolor: reply.is_admin ? '#fff8ee' : '#fffaf5',
                    border: `1px solid ${reply.is_admin ? 'rgba(200,134,10,0.2)' : 'rgba(200,134,10,0.1)'}`,
                }}>
                    {!reply.is_admin && (
                        <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
                            <Chip label={getStatusLabel(reply.status)} color={getStatusColor(reply.status)} size="small" />
                        </Box>
                    )}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <Box sx={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#c8860a,#e8a830)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            {reply.is_admin ? <AutoStoriesIcon sx={{ color: '#fff', fontSize: 18 }} /> : <CreateIcon sx={{ color: '#fff', fontSize: 18 }} />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {reply.is_admin ? (
                                    <Typography variant="caption" sx={{
                                        background: 'linear-gradient(135deg,#c8860a,#e8a830)',
                                        color: '#fff', px: 1, py: 0.2, borderRadius: 1, fontWeight: 700, fontSize: '0.7rem',
                                    }}>
                                        {reply.name} | מנהלת
                                    </Typography>
                                ) : (
                                    <Typography variant="subtitle2" fontWeight="bold" color="#3b2008">{reply.name}</Typography>
                                )}
                                <Typography variant="caption" color="#7a5c3a">({formatDate(reply.created_at)})</Typography>
                            </Box>
                            {!reply.is_admin && (
                                <Typography variant="caption" color="#7a5c3a" sx={{ display: "block" }}>{reply.email}</Typography>
                            )}
                            <Typography variant="body2" sx={{ mt: 0.5, color: "#3b2008", lineHeight: 1.8 }}>{reply.comment}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1.5, flexWrap: "wrap" }}>
                        {!reply.is_admin && reply.status !== "approved" && (
                            <Button variant="contained" color="success" size="small" onClick={() => updateStatus(reply.id, "approved")}>אשר</Button>
                        )}
                        {!reply.is_admin && reply.status !== "rejected" && (
                            <Button variant="contained" color="error" size="small" onClick={() => updateStatus(reply.id, "rejected")}>דחה</Button>
                        )}
                        <Button variant="outlined" size="small"
                            sx={{ borderColor: '#c8860a', color: '#c8860a' }}
                            onClick={() => setOpenReply((prev) => ({ ...prev, [reply.id]: !prev[reply.id] }))}>
                            השב
                        </Button>
                    </Box>
                    <Collapse in={!!openReply[reply.id]}>
                        <Box sx={{ mt: 2 }}>
                            <TextField fullWidth multiline rows={3}
                                value={replyInputs[reply.id] || ""}
                                onChange={(e) => setReplyInputs((prev) => ({ ...prev, [reply.id]: e.target.value }))}
                                placeholder="כתוב תגובת מנהל..."
                                inputProps={{ style: { textAlign: "right", direction: "rtl" } }} />
                            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                                <Button variant="contained" onClick={() => sendReply(reply)}
                                    sx={{ background: 'linear-gradient(135deg,#c8860a,#e8a830)', boxShadow: 'none' }}>
                                    שלח תגובה
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                </Box>
                {children.map((child) => (
                    <Box key={child.id} sx={{ mr: depth > 0 ? 2 : 4 }}>
                        <ReplyItem reply={child} depth={depth + 1} />
                    </Box>
                ))}
            </>
        );
    };

    if (loading) return <CircularProgress sx={{ color: '#c8860a' }} />;

    const mainComments = comments.filter((c) => c.parent_id === null);

    return (
        <Box sx={{ bgcolor: '#f5ede3', minHeight: '100vh', pt: { xs: 9, sm: 10 }, pb: 6 }}>
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 4, textAlign: 'right' }}>
                <Typography variant="h4" sx={{ color: '#3b2008', fontWeight: 800 }}>ניהול תגובות</Typography>
                <Box sx={{ width: 48, height: 3, bgcolor: '#c8860a', borderRadius: 2, mt: 1 }} style={{ marginRight: 0, marginLeft: 'auto' }} />
            </Box>

            {mainComments.map((c) => {
                const directReplies = comments.filter((r) => r.parent_id === c.id)
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                return (
                    <Box key={c.id} dir="rtl" sx={{
                        mt: 2, p: 2.5, borderRadius: 3, bgcolor: '#fffaf5',
                        border: '1px solid rgba(200,134,10,0.12)',
                        boxShadow: '0 2px 12px rgba(200,134,10,0.07)',
                    }}>
                        <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
                            <Chip label={getStatusLabel(c.status)} color={getStatusColor(c.status)} size="small" />
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                            <Box sx={{
                                width: 42, height: 42, borderRadius: '50%',
                                background: 'linear-gradient(135deg,#c8860a,#e8a830)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <CreateIcon sx={{ color: '#fff', fontSize: 20 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="#3b2008">{c.name}</Typography>
                                    <Typography variant="caption" color="#7a5c3a">({formatDate(c.created_at)})</Typography>
                                </Box>
                                <Typography variant="caption" color="#7a5c3a" sx={{ display: "block" }}>{c.email}</Typography>
                                <Typography variant="caption" color="#7a5c3a" sx={{ display: "block" }}>{c.story_title}</Typography>
                            </Box>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1.5, mr: 7, color: "#3b2008", lineHeight: 1.8 }}>{c.comment}</Typography>

                        {directReplies.map((reply) => <ReplyItem key={reply.id} reply={reply} depth={0} />)}

                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 2, flexWrap: "wrap" }}>
                            {c.status !== "approved" && (
                                <Button variant="contained" color="success" size="small" onClick={() => updateStatus(c.id, "approved")}>אשר</Button>
                            )}
                            {c.status !== "rejected" && (
                                <Button variant="contained" color="error" size="small" onClick={() => updateStatus(c.id, "rejected")}>דחה</Button>
                            )}
                            <Button variant="outlined" size="small"
                                sx={{ borderColor: '#c8860a', color: '#c8860a' }}
                                onClick={() => setOpenReply((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}>
                                השב
                            </Button>
                        </Box>
                        <Collapse in={!!openReply[c.id]}>
                            <Box sx={{ mt: 2 }}>
                                <TextField fullWidth multiline rows={3}
                                    value={replyInputs[c.id] || ""}
                                    onChange={(e) => setReplyInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                    placeholder="כתוב תגובת מנהל..."
                                    inputProps={{ style: { textAlign: "right", direction: "rtl" } }} />
                                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                                    <Button variant="contained" onClick={() => sendReply(c)}
                                        sx={{ background: 'linear-gradient(135deg,#c8860a,#e8a830)', boxShadow: 'none' }}>
                                        שלח תגובה
                                    </Button>
                                </Box>
                            </Box>
                        </Collapse>
                    </Box>
                );
            })}
        </Container>
        </Box>
    );
};

export default CommentsManager;
