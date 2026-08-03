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
        const channel = supabase.channel("stories-changes")
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
        const baseName = file.name.substring(0, nameParts).split("").map(c => hebrewMap[c] ?? c)
            .join("").replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_");
        const ext = file.name.substring(nameParts + 1);
        const fileName = `${baseName}.${ext}`;
        const { error } = await supabase.storage.from("stories").upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("stories").getPublicUrl(fileName);
        return publicUrl;
    };

    const handleOpenAdd = () => { setEditStory(null); setForm({ title: "" }); setDocxFile(null); setPdfFile(null); setDialogOpen(true); };
    const handleOpenEdit = (story) => { setEditStory(story); setForm({ title: story.title }); setDocxFile(null); setPdfFile(null); setDialogOpen(true); };

    const handleSave = async () => {
        if (!form.title.trim()) return showMessage("חובה להזין שם סיפור", "error");
        setUploading(true);
        const uploadedFiles = [];
        try {
            const updates = {};
            if (docxFile) { updates.docx_url = await uploadFile(docxFile); uploadedFiles.push(getFileNameFromUrl(updates.docx_url)); }
            if (pdfFile) { updates.pdf_url = await uploadFile(pdfFile); uploadedFiles.push(getFileNameFromUrl(updates.pdf_url)); }
            if (!editStory) {
                const { error } = await supabase.from("stories").insert({ title: form.title, ...updates }).select().single();
                if (error) throw error;
            } else {
                const { error } = await supabase.from("stories").update({ title: form.title, ...updates }).eq("id", editStory.id);
                if (error) throw error;
            }
            showMessage(editStory ? "הסיפור עודכן בהצלחה!" : "הסיפור נוסף בהצלחה!");
            setDialogOpen(false); loadStories();
        } catch (e) {
            if (uploadedFiles.length > 0) await supabase.storage.from("stories").remove(uploadedFiles);
            showMessage("שגיאה: " + e.message, "error");
        }
        setUploading(false);
    };

    const getFileNameFromUrl = (url) => url?.split("/").pop()?.split("?")[0];

    const handleDeleteConfirm = async () => {
        try {
            const filesToDelete = [getFileNameFromUrl(storyToDelete.docx_url), getFileNameFromUrl(storyToDelete.pdf_url)].filter(Boolean);
            if (filesToDelete.length > 0) await supabase.storage.from("stories").remove(filesToDelete);
            await supabase.from("stories").delete().eq("id", storyToDelete.id);
            showMessage("הסיפור נמחק בהצלחה!"); setDeleteDialogOpen(false); loadStories();
        } catch (e) { showMessage("שגיאה במחיקה", "error"); }
    };

    return (
        <Box sx={{ bgcolor: '#f5ede3', minHeight: '100vh', pt: { xs: 9, sm: 10 }, pb: 6 }}>
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }} dir="rtl">
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}
                    sx={{ background: 'linear-gradient(135deg,#c8860a,#e8a830)', boxShadow: 'none', borderRadius: 2,
                        '&:hover': { boxShadow: '0 4px 14px rgba(200,134,10,0.35)' } }}>
                    הוסף סיפור
                </Button>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#3b2008' }}>ניהול סיפורים</Typography>
                    <Box sx={{ width: 48, height: 3, bgcolor: '#c8860a', borderRadius: 2, mt: 0.5 }} style={{ marginRight: 0, marginLeft: 'auto' }} />
                </Box>
            </Box>

            {message.text && (
                <Box sx={{
                    mb: 2, p: 2, borderRadius: 2,
                    bgcolor: message.type === "error" ? "rgba(198,40,40,0.08)" : "rgba(46,125,50,0.08)",
                    color: message.type === "error" ? "#c62828" : "#2e7d32",
                    border: `1px solid ${message.type === "error" ? "#ef9a9a" : "#a5d6a7"}`
                }}>
                    {message.text}
                </Box>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                    <CircularProgress sx={{ color: '#c8860a' }} />
                </Box>
            ) : (
                stories.map((story) => (
                    <Box key={story.id} dir="rtl" sx={{
                        mt: 2, p: 2.5, borderRadius: 3, bgcolor: '#fffaf5',
                        border: '1px solid rgba(200,134,10,0.12)',
                        boxShadow: '0 2px 12px rgba(200,134,10,0.07)',
                        transition: 'box-shadow 0.2s',
                        '&:hover': { boxShadow: '0 4px 20px rgba(200,134,10,0.15)' },
                    }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                            <Box sx={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: 'linear-gradient(135deg,#c8860a,#e8a830)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, boxShadow: '0 2px 8px rgba(200,134,10,0.3)',
                            }}>
                                <AutoStoriesIcon sx={{ color: 'white', fontSize: 24 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.4, color: '#3b2008' }}>
                                    {story.title}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, mt: 0.8, flexWrap: "wrap" }}>
                                    <Chip icon={story.docx_url ? <CheckCircleIcon /> : <ErrorOutlineIcon />} label="DOCX"
                                        size="small" color={story.docx_url ? "success" : "default"}
                                        variant={story.docx_url ? "filled" : "outlined"}
                                        onClick={story.docx_url ? () => window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(story.docx_url)}`, "_blank") : undefined}
                                        sx={story.docx_url ? { cursor: "pointer" } : {}} />
                                    <Chip icon={story.pdf_url ? <CheckCircleIcon /> : <ErrorOutlineIcon />} label="PDF"
                                        size="small" color={story.pdf_url ? "error" : "default"}
                                        variant={story.pdf_url ? "filled" : "outlined"}
                                        onClick={story.pdf_url ? () => window.open(story.pdf_url, "_blank") : undefined}
                                        sx={story.pdf_url ? { bgcolor: "#c8860a", color: "white", "& .MuiChip-icon": { color: "white" }, cursor: "pointer" } : {}} />
                                </Box>
                            </Box>
                            <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                                <Tooltip title="עריכה">
                                    <IconButton size="small" onClick={() => handleOpenEdit(story)}
                                        sx={{ color: '#5c3a1e', bgcolor: 'rgba(92,58,30,0.08)', '&:hover': { bgcolor: 'rgba(92,58,30,0.18)' } }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="מחיקה">
                                    <IconButton size="small" onClick={() => { setStoryToDelete(story); setDeleteDialogOpen(true); }}
                                        sx={{ color: '#c62828', bgcolor: 'rgba(198,40,40,0.08)', '&:hover': { bgcolor: 'rgba(198,40,40,0.18)' } }}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    </Box>
                ))
            )}

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" dir="rtl"
                PaperProps={{ sx: { bgcolor: '#fffaf5', borderRadius: 3, border: '1px solid rgba(200,134,10,0.15)' } }}>
                <DialogTitle sx={{ background: 'linear-gradient(135deg,#c8860a,#e8a830)', color: "white", fontWeight: "bold" }}>
                    {editStory ? "עריכת סיפור" : "הוספת סיפור חדש"}
                </DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "20px !important", pb: 2 }}>
                    <TextField label="שם סיפור *" fullWidth value={form.title}
                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))} sx={{ mt: 1 }} />
                    <Box>
                        <Typography variant="body2" color="#7a5c3a" gutterBottom>קובץ DOCX</Typography>
                        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} fullWidth
                            sx={{ borderColor: '#c8860a', color: '#c8860a' }}>
                            {docxFile ? docxFile.name : (editStory?.docx_url ? getFileNameFromUrl(editStory.docx_url) : "בחר קובץ DOCX")}
                            <input type="file" accept=".docx" hidden onChange={e => setDocxFile(e.target.files[0])} />
                        </Button>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="#7a5c3a" gutterBottom>קובץ PDF</Typography>
                        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} fullWidth
                            sx={{ borderColor: '#c8860a', color: '#c8860a' }}>
                            {pdfFile ? pdfFile.name : (editStory?.pdf_url ? getFileNameFromUrl(editStory.pdf_url) : "בחר קובץ PDF")}
                            <input type="file" accept=".pdf" hidden onChange={e => setPdfFile(e.target.files[0])} />
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid rgba(200,134,10,0.15)' }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ color: '#7a5c3a' }}>ביטול</Button>
                    <Button onClick={handleSave} variant="contained" disabled={uploading}
                        sx={{ background: 'linear-gradient(135deg,#c8860a,#e8a830)', boxShadow: 'none' }}>
                        {uploading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : "שמור"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} dir="rtl"
                PaperProps={{ sx: { bgcolor: '#fffaf5', borderRadius: 3 } }}>
                <DialogTitle sx={{ color: '#3b2008' }}>מחיקת סיפור</DialogTitle>
                <DialogContent>
                    <Typography color="#5c3a1e">האם למחוק את הסיפור "{storyToDelete?.title}"?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#7a5c3a' }}>ביטול</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">מחק</Button>
                </DialogActions>
            </Dialog>
        </Container>
        </Box>
    );
};

export default FileManager;
