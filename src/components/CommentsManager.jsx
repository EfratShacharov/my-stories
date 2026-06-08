import React, { useEffect, useState } from "react";

import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    TextField,
    Typography
} from "@mui/material";

import { supabase } from "../supabase";

const CommentsManager = () => {

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [replyInputs, setReplyInputs] = useState({});
    const [openReply, setOpenReply] = useState({});

    const fetchComments = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from("comments")
            .select("*")
            .order("created_at", { ascending: false });

        console.log("COMMENTS DATA:", data);
        console.log("COMMENTS ERROR:", error);

        if (error) {
            console.error("שגיאה", error);
        } else {
            setComments(data);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchComments();
    }, []);

    const updateStatus = async (id, status) => {
        const { error } = await supabase
            .from("comments")
            .update({ status })
            .eq("id", id);

        if (error) {
            console.error("שגיאה בעדכון:", error);
            return;
        }
        await fetchComments();
    };

    const sendReply = async (comment) => {

        const text = replyInputs[comment.id];

        if (!text?.trim()) return;

        const { error } = await supabase
            .from("comments")
            .insert([
                {
                    name: "יוסף",
                    story_id: comment.story_id,
                    story_title: comment.story_title,
                    comment: text,
                    email: "",
                    is_admin: true,
                    status: "approved",
                    parent_id: comment.id,
                }
            ]);

        if (error) {
            console.error(error);
            return;
        }

        setReplyInputs((prev) => ({
            ...prev,
            [comment.id]: ""
        }));

        setOpenReply((prev) => ({
            ...prev,
            [comment.id]: false
        }));
    };

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

    if (loading) {
        return <CircularProgress />;
    }

    const mainComments = comments.filter(
        (c) => c.parent_id === null
    );

    return (
        <Box sx={{ p: 2 }}>

            <Typography
                variant="h5"
                textAlign="right"
                mb={2}
            >
                ניהול תגובות
            </Typography>

            {mainComments.map((c) => {

                const replies = comments.filter(
                    (reply) => reply.parent_id === c.id
                );

                return (
                    <Card key={c.id} sx={{ mb: 2 }}>

                        <CardContent>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >
                                <Chip
                                    label={getStatusLabel(c.status)}
                                    color={getStatusColor(c.status)}
                                    size="small"
                                />

                                <Typography
                                    variant="h6"
                                    textAlign="right"
                                >
                                    {c.story_title}
                                </Typography>
                            </Box>

                            <Typography textAlign="right" mt={1}>
                                <strong>שם:</strong> {c.name}
                            </Typography>

                            <Typography textAlign="right">
                                <strong>מייל:</strong> {c.email}
                            </Typography>

                            <Typography textAlign="right" mt={1}>
                                {c.comment}
                            </Typography>

                            <Typography
                                textAlign="right"
                                color="text.secondary"
                                variant="caption"
                            >
                                {new Date(c.created_at).toLocaleString("he-IL")}
                            </Typography>

                            {/* תגובות מנהל */}
                            {replies.map((reply) => (
                                <Box
                                    key={reply.id}
                                    sx={{
                                        mt: 2,
                                        ml: 4,
                                        p: 2,
                                        borderRadius: 2,
                                        backgroundColor: "#fff3e0",
                                        border: "1px solid #ffcc80"
                                    }}
                                >
                                    <Typography
                                        fontWeight="bold"
                                        mb={1}
                                    >
                                        {reply.name} | מנהל
                                    </Typography>

                                    <Typography>
                                        {reply.comment}
                                    </Typography>
                                </Box>
                            ))}

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    justifyContent: "flex-end",
                                    mt: 2,
                                    flexWrap: "wrap"
                                }}
                            >

                                {c.status !== "approved" && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        size="small"
                                        onClick={() =>
                                            updateStatus(c.id, "approved")
                                        }
                                    >
                                        אשר
                                    </Button>
                                )}

                                {c.status !== "rejected" && (
                                    <Button
                                        variant="contained"
                                        color="error"
                                        size="small"
                                        onClick={() =>
                                            updateStatus(c.id, "rejected")
                                        }
                                    >
                                        דחה
                                    </Button>
                                )}

                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() =>
                                        setOpenReply((prev) => ({
                                            ...prev,
                                            [c.id]: !prev[c.id]
                                        }))
                                    }
                                >
                                    השב
                                </Button>

                            </Box>

                            {openReply[c.id] && (
                                <Box sx={{ mt: 2 }}>

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        value={replyInputs[c.id] || ""}
                                        onChange={(e) =>
                                            setReplyInputs((prev) => ({
                                                ...prev,
                                                [c.id]: e.target.value
                                            }))
                                        }
                                        placeholder="כתוב תגובת מנהל..."
                                    />

                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            mt: 1
                                        }}
                                    >
                                        <Button
                                            variant="contained"
                                            onClick={() => sendReply(c)}
                                        >
                                            שלח תגובה
                                        </Button>
                                    </Box>

                                </Box>
                            )}

                        </CardContent>

                    </Card>
                );
            })}
        </Box>
    );
};

export default CommentsManager;