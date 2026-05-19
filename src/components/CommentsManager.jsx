import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Box, Button, Card, CardContent, Chip, CircularProgress, Typography } from "@mui/material";

const CommentsManager = () => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("comments")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("שגיאה:", error);
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
        } else {
            fetchComments();
        }
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

    if (loading) return <CircularProgress />;

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" textAlign="right" mb={2}>
                ניהול תגובות
            </Typography>

            {comments.length === 0 && (
                <Typography textAlign="right">אין עדיין תגובות</Typography>
            )}

            {comments.map((c) => (
                <Card key={c.id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Chip
                                label={getStatusLabel(c.status)}
                                color={getStatusColor(c.status)}
                                size="small"
                            />
                            <Typography variant="h6" textAlign="right">
                                {c.story_title}
                            </Typography>
                        </Box>
                        <Typography textAlign="right" mt={1}><strong>שם:</strong> {c.name}</Typography>
                        <Typography textAlign="right"><strong>מייל:</strong> {c.email}</Typography>
                        <Typography textAlign="right" mt={1}>{c.comment}</Typography>
                        <Typography textAlign="right" color="text.secondary" variant="caption">
                            {new Date(c.created_at).toLocaleString("he-IL")}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 2 }}>
                            {c.status !== "approved" && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    onClick={() => updateStatus(c.id, "approved")}
                                >
                                    אשר
                                </Button>
                            )}
                            {c.status !== "rejected" && (
                                <Button
                                    variant="contained"
                                    color="error"
                                    size="small"
                                    onClick={() => updateStatus(c.id, "rejected")}
                                >
                                    דחה
                                </Button>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
};

export default CommentsManager;