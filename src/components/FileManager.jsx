import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import {
    Box, Button, Typography, CircularProgress, Container, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, IconButton, Tooltip, Chip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const FileManager = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editStory, setEditStory] = useState(null);
    const [form, setForm] = useState({ title: "" });
    const [docxFile, setDocxFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [storyToDelete, setStoryToDelete] = useState(null);

    const loadStories = async () => {
        setLoading(true);
        const { data } = await supabase.from("stories").select("*").order("id");
        if (data) setStories(data);
        setLoading(false);
    };

    useEffect(() => {
        loadStories();
        const channel = supabase
            .channel("stories-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, loadStories)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    const showMessage = (text, type = "success") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    };

    const uploadFile = async (file) => {
        const hebrewMap = {
            'א':'a','ב':'b','ג':'g','ד':'d','ה':'h','ו':'v','ז':'z','ח':'ch','ט':'t',
            'י':'y','כ':'k','ך':'k','ל':'l','מ':'m','ם':'m','נ':'n','ן':'n','ס':'s',
            'ע':'a','פ':'p','ף':'f','צ':'tz','ץ':'tz','ק':'k','ר':'r','ש':'sh','ת':'t'
        };
        const nameParts = file.name.lastIndexOf(".");
        const baseName = file.name.substring(0, nameParts)
            .split("").map(c => hebrewMap[c] ?? c)
            .join("").replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_");
        const ext = file.name.substring(nameParts + 1);
        const fileName = `${baseName}.${ext}`;
        const { error } = await supabase.storage
            .from("stories")
            .upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("stories").getPublicUrl(fileName);
        return publicUrl;
    };

    const handleOpenAdd = () => {
        setEditStory(null);
        setForm({ title: "" });
        setDocxFile(null);
        setPdfFile(null);
        setDialogOpen(true);
    };

    const handleOpenEdit = (story) => {
        setEditStory(story);
        setForm({ title: story.title });
        setDocxFile(null);
        setPdfFile(null);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return showMessage("חובה להזין שם סיפור", "error");
        setUploading(true);
        const uploadedFiles = [];
        try {
            // העלאת קבצים תחילה
            const updates = {};
            if (docxFile) {
                updates.docx_url = await uploadFile(docxFile);
                uploadedFiles.push(getFileNameFromUrl(updates.docx_url));
            }
            if (pdfFile) {
                updates.pdf_url = await uploadFile(pdfFile);
                uploadedFiles.push(getFileNameFromUrl(updates.pdf_url));
            }

            // כתיבה ל-DB
            if (!editStory) {
                const { data, error } = await supabase
                    .from("stories")
                    .insert({ title: form.title, ...updates })
                    .select()
                    .single();
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("stories")
                    .update({ title: form.title, ...updates })
                    .eq("id", editStory.id);
                if (error) throw error;
            }

            showMessage(editStory ? "הסיפור עודכן בהצלחה!" : "הסיפור נוסף בהצלחה!");
            setDialogOpen(false);
            loadStories();
        } catch (e) {
            // rollback — מחיקת קבצים שהועלו אם ה-DB נכשל
            if (uploadedFiles.length > 0)
                await supabase.storage.from("stories").remove(uploadedFiles);
            showMessage("שגיאה: " + e.message, "error");
        }
        setUploading(false);
    };

    const getFileNameFromUrl = (url) => url?.split("/").pop()?.split("?")[0];

    const handleDeleteConfirm = async () => {
        try {
            const filesToDelete = [
                getFileNameFromUrl(storyToDelete.docx_url),
                getFileNameFromUrl(storyToDelete.pdf_url)
            ].filter(Boolean);
            if (filesToDelete.length > 0)
                await supabase.storage.from("stories").remove(filesToDelete);
            await supabase.from("stories").delete().eq("id", storyToDelete.id);
            showMessage("הסיפור נמחק בהצלחה!");
            setDeleteDialogOpen(false);
            loadStories();
        } catch (e) {
            showMessage("שגיאה במחיקה", "error");
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: { xs: 9, sm: 10 }, mb: 6, px: { xs: 2, sm: 3 } }}>

            {/* כותרת */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }} dir="rtl">
                <Typography variant="h4" fontWeight="bold">ניהול סיפורים</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ borderRadius: 2 }}>
                    הוסף סיפור
                </Button>
            </Box>

            {/* הודעה */}
            {message.text && (
                <Box sx={{
                    mb: 2, p: 2, borderRadius: 2,
                    bgcolor: message.type === "error" ? "#ffebee" : "#e8f5e9",
                    color: message.type === "error" ? "#c62828" : "#2e7d32",
                    border: `1px solid ${message.type === "error" ? "#ef9a9a" : "#a5d6a7"}`
                }}>
                    {message.text}
                </Box>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                    <CircularProgress />
                </Box>
            ) : (
                stories.map((story) => (
                    <Box key={story.id} dir="rtl" sx={{
                        mt: 2, p: 2.5, borderRadius: 3,
                        backgroundColor: "#ffffff",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
                        transition: "box-shadow 0.2s",
                        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.13)" },
                    }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                            {/* אווטאר */}
                            <Box sx={{
                                width: 48, height: 48, borderRadius: "50%",
                                background: "linear-gradient(135deg, #1976d2, #42a5f5)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0, boxShadow: "0 2px 8px rgba(25,118,210,0.3)",
                            }}>
                                <AutoStoriesIcon sx={{ color: "white", fontSize: 24 }} />
                            </Box>

                            {/* כותרת + קבצים */}
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.4 }}>
                                    {story.title}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, mt: 0.8, flexWrap: "wrap" }}>
                                    <Chip
                                        icon={story.docx_url ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
                                        label="DOCX"
                                        size="small"
                                        color={story.docx_url ? "success" : "default"}
                                        variant={story.docx_url ? "filled" : "outlined"}
                                        onClick={story.docx_url ? () => window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(story.docx_url)}`, "_blank") : undefined}
                                        sx={story.docx_url ? { cursor: "pointer" } : {}}
                                    />
                                    <Chip
                                        icon={story.pdf_url ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
                                        label="PDF"
                                        size="small"
                                        color={story.pdf_url ? "error" : "default"}
                                        variant={story.pdf_url ? "filled" : "outlined"}
                                        onClick={story.pdf_url ? () => window.open(story.pdf_url, "_blank") : undefined}
                                        sx={story.pdf_url ? { bgcolor: "#ff7043", color: "white", "& .MuiChip-icon": { color: "white" }, cursor: "pointer" } : {}}
                                    />
                                </Box>
                            </Box>

                            {/* כפתורים */}
                            <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                                <Tooltip title="עריכה">
                                    <IconButton size="small" color="primary" onClick={() => handleOpenEdit(story)}
                                        sx={{ bgcolor: "#e3f2fd", "&:hover": { bgcolor: "#bbdefb" } }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="מחיקה">
                                    <IconButton size="small" color="error" onClick={() => { setStoryToDelete(story); setDeleteDialogOpen(true); }}
                                        sx={{ bgcolor: "#ffebee", "&:hover": { bgcolor: "#ffcdd2" } }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    </Box>
                ))
            )}

            {/* דיאלוג הוספה/עריכה */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" dir="rtl">
                <DialogTitle sx={{ bgcolor: "#1976d2", color: "white", fontWeight: "bold" }}>
                    {editStory ? "עריכת סיפור" : "הוספת סיפור חדש"}
                </DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "20px !important", pb: 2 }}>
                    <TextField
                        label="שם סיפור *" fullWidth value={form.title}
                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        sx={{ mt: 1 }}
                    />
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>קובץ DOCX</Typography>
                        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} fullWidth>
                            {docxFile ? docxFile.name : (editStory?.docx_url ? getFileNameFromUrl(editStory.docx_url) : "בחר קובץ DOCX")}
                            <input type="file" accept=".docx" hidden onChange={e => setDocxFile(e.target.files[0])} />
                        </Button>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>קובץ PDF</Typography>
                        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} fullWidth>
                            {pdfFile ? pdfFile.name : (editStory?.pdf_url ? getFileNameFromUrl(editStory.pdf_url) : "בחר קובץ PDF")}
                            <input type="file" accept=".pdf" hidden onChange={e => setPdfFile(e.target.files[0])} />
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setDialogOpen(false)} variant="outlined">ביטול</Button>
                    <Button onClick={handleSave} variant="contained" disabled={uploading}>
                        {uploading ? <CircularProgress size={20} /> : "שמור"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* דיאלוג מחיקה */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} dir="rtl">
                <DialogTitle>מחיקת סיפור</DialogTitle>
                <DialogContent>
                    <Typography>האם למחוק את הסיפור "{storyToDelete?.title}"?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>ביטול</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">מחק</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default FileManager;
