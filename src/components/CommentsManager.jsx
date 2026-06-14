import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Container,
    TextField,
    Typography
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { useComments } from "../context/CommentsContext";
import { supabase } from "../supabase";

const formatDate = (dt) =>
    `${new Date(dt).toLocaleDateString("en-GB").replace(/\//g, ".")}, ${new Date(dt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;

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
    const { comments, fetchComments } = useComments();
    const [loading, setLoading] = useState(false);
    const [replyInputs, setReplyInputs] = useState({});
    const [openReply, setOpenReply] = useState({});
    const [adminName, setAdminName] = useState("");

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session?.user?.id) return;
            const { data } = await supabase
                .from("users")
                .select("name")
                .eq("id", session.user.id)
                .maybeSingle();
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
        const { error } = await supabase.from("comments").insert([{
            name: adminName,
            story_id: comment.story_id,
            story_title: comment.story_title,
            comment: text,
            email: "",
            is_admin: true,
            status: "approved",
            parent_id: comment.id,
        }]);
        if (error) { console.error(error); return; }
        setReplyInputs((prev) => ({ ...prev, [comment.id]: "" }));
        setOpenReply((prev) => ({ ...prev, [comment.id]: false }));
        await fetchComments();
    };

    if (loading) return <CircularProgress />;

    const mainComments = comments.filter((c) => c.parent_id === null);

    return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
            <Typography variant="h4" gutterBottom align="right">
                ניהול תגובות
            </Typography>

            {mainComments.map((c) => {
                const replies = comments
                    .filter((r) => r.parent_id === c.id)
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                return (
                    <Box key={c.id} dir="rtl" sx={{
                        mt: 2, p: 2.5, borderRadius: 3,
                        backgroundColor: "#ffffff",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
                    }}>
                        {/* סטטוס */}
                        <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
                            <Chip label={getStatusLabel(c.status)} color={getStatusColor(c.status)} size="small" />
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                            {/* אווטאר */}
                            <Box sx={{
                                width: 42, height: 42, borderRadius: "50%",
                                backgroundColor: "#e3f2fd",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <CreateIcon sx={{ color: "#1976d2", fontSize: 22 }} />
                            </Box>

                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">{c.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        ({formatDate(c.created_at)})
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                    {c.email}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                    {c.story_title}
                                </Typography>
                            </Box>
                        </Box>

                        <Typography variant="body2" sx={{ mt: 1.5, mr: 7, color: "#333", lineHeight: 1.8 }}>
                            {c.comment}
                        </Typography>

                        {/* תגובות משויכות */}
                        {replies.map((reply) => (
                            <Box key={reply.id} dir="rtl" sx={{
                                mt: 2, mr: 4, p: 2, borderRadius: 2,
                                backgroundColor: reply.is_admin ? "#fff8f0" : "#f5f9ff",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                            }}>
                                {/* סטטוס לתגובות משתמש */}
                                {!reply.is_admin && (
                                    <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
                                        <Chip label={getStatusLabel(reply.status)} color={getStatusColor(reply.status)} size="small" />
                                    </Box>
                                )}

                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                    <Box sx={{
                                        width: 36, height: 36, borderRadius: "50%",
                                        backgroundColor: reply.is_admin ? "#fff3e0" : "#e3f2fd",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        {reply.is_admin
                                            ? <AutoStoriesIcon sx={{ color: "#e65100", fontSize: 20 }} />
                                            : <CreateIcon sx={{ color: "#1976d2", fontSize: 20 }} />
                                        }
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            {reply.is_admin ? (
                                                <Typography variant="caption" sx={{
                                                    backgroundColor: "#e65100", color: "white",
                                                    px: 1, py: 0.2, borderRadius: 1,
                                                    fontWeight: "bold", fontSize: "0.7rem",
                                                }}>
                                                    {reply.name} | מנהלת
                                                </Typography>
                                            ) : (
                                                <Typography variant="subtitle2" fontWeight="bold">{reply.name}</Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary">
                                                ({formatDate(reply.created_at)})
                                            </Typography>
                                        </Box>
                                        {!reply.is_admin && (
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                                {reply.email}
                                            </Typography>
                                        )}
                                        <Typography variant="body2" sx={{ mt: 0.5, color: "#444", lineHeight: 1.8 }}>
                                            {reply.comment}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* כפתורי ניהול לתגובות משתמש */}
                                {!reply.is_admin && (
                                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 1.5, flexWrap: "wrap" }}>
                                        {reply.status !== "approved" && (
                                            <Button variant="contained" color="success" size="small"
                                                onClick={() => updateStatus(reply.id, "approved")}>אשר</Button>
                                        )}
                                        {reply.status !== "rejected" && (
                                            <Button variant="contained" color="error" size="small"
                                                onClick={() => updateStatus(reply.id, "rejected")}>דחה</Button>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        ))}

                        {/* כפתורי ניהול לתגובה הראשית */}
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 2, flexWrap: "wrap" }}>
                            {c.status !== "approved" && (
                                <Button variant="contained" color="success" size="small"
                                    onClick={() => updateStatus(c.id, "approved")}>אשר</Button>
                            )}
                            {c.status !== "rejected" && (
                                <Button variant="contained" color="error" size="small"
                                    onClick={() => updateStatus(c.id, "rejected")}>דחה</Button>
                            )}
                            <Button variant="outlined" size="small"
                                onClick={() => setOpenReply((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}>
                                השב
                            </Button>
                        </Box>

                        <Collapse in={!!openReply[c.id]}>
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    fullWidth multiline rows={3}
                                    value={replyInputs[c.id] || ""}
                                    onChange={(e) => setReplyInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                    placeholder="כתוב תגובת מנהל..."
                                    inputProps={{ style: { textAlign: "right", direction: "rtl" } }}
                                />
                                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                                    <Button variant="contained" onClick={() => sendReply(c)}>
                                        שלח תגובה
                                    </Button>
                                </Box>
                            </Box>
                        </Collapse>
                    </Box>
                );
            })}
        </Container>
    );
};

export default CommentsManager;
