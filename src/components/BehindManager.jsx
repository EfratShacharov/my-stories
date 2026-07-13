import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    Box, Button, Chip, CircularProgress, Container,
    Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, MenuItem, TextField, Tooltip, Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const rtlStyle = { textAlign: 'right', unicodeBidi: 'plaintext' };

const emptyForm = { story_id: '', story_title: '', tagline: '', content: '', written_at: '' };

const BehindManager = () => {
    useEffect(() => {
        document.documentElement.style.overflow = 'scroll';
        document.documentElement.style.scrollbarWidth = 'none';
        document.documentElement.style.msOverflowStyle = 'none';
        const style = document.createElement('style');
        style.id = 'hide-scrollbar-bm';
        style.textContent = '::-webkit-scrollbar { display: none !important }';
        document.head.appendChild(style);
        return () => {
            document.documentElement.style.scrollbarWidth = '';
            document.documentElement.style.msOverflowStyle = '';
            document.getElementById('hide-scrollbar-bm')?.remove();
        };
    }, []);

    const [items, setItems] = useState([]);
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState({ text: '', type: '' });

    const showMsg = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const load = async () => {
        setLoading(true);
        const [{ data: bts }, { data: st }] = await Promise.all([
            supabase.from('behind_the_scenes').select('*').order('id'),
            supabase.from('stories').select('id, title').order('id'),
        ]);
        setItems(bts || []);
        setStories(st || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditItem(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            story_id: item.story_id || '',
            story_title: item.story_title || '',
            tagline: item.tagline || '',
            content: item.content || '',
            written_at: item.written_at || '',
        });
        setDialogOpen(true);
    };

    const handleStorySelect = (e) => {
        const id = e.target.value;
        const story = stories.find(s => s.id === id);
        setForm(p => ({ ...p, story_id: id, story_title: story?.title || '' }));
    };

    const handleSave = async () => {
        if (!form.story_id) return showMsg('חובה לבחור סיפור', 'error');
        if (!form.content.trim()) return showMsg('חובה להזין תוכן', 'error');
        setSaving(true);
        const payload = {
            story_id: form.story_id,
            story_title: form.story_title,
            tagline: form.tagline || null,
            content: form.content,
            written_at: form.written_at || null,
        };
        const { error } = editItem
            ? await supabase.from('behind_the_scenes').update(payload).eq('id', editItem.id)
            : await supabase.from('behind_the_scenes').insert(payload);
        if (error) showMsg('שגיאה: ' + error.message, 'error');
        else { showMsg(editItem ? 'עודכן בהצלחה!' : 'נוסף בהצלחה!'); setDialogOpen(false); load(); }
        setSaving(false);
    };

    const handleDelete = async () => {
        await supabase.from('behind_the_scenes').delete().eq('id', deleteId);
        setDeleteId(null);
        load();
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#0d0d0d', pt: '64px', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
            <Container maxWidth="sm" sx={{ py: 5 }}>

                {/* כותרת */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }} dir="rtl">
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={openAdd}
                        sx={{
                            bgcolor: '#f0a500', color: '#000', fontWeight: 700,
                            '&:hover': { bgcolor: '#d4920a' },
                            borderRadius: 2, px: 2.5,
                        }}
                    >
                        הוסף
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                            ניהול מאחורי הקלעים
                        </Typography>
                        <TheaterComedyIcon sx={{ fontSize: 32, color: '#f0a500' }} />
                    </Box>
                </Box>

                {/* הודעה */}
                {message.text && (
                    <Box sx={{
                        mb: 3, p: 2, borderRadius: 2,
                        bgcolor: message.type === 'error' ? 'rgba(211,47,47,0.15)' : 'rgba(46,125,50,0.15)',
                        border: `1px solid ${message.type === 'error' ? '#c62828' : '#388e3c'}`,
                        color: message.type === 'error' ? '#ef9a9a' : '#a5d6a7',
                    }} dir="rtl">
                        <Typography style={rtlStyle}>{message.text}</Typography>
                    </Box>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                        <CircularProgress sx={{ color: '#f0a500' }} />
                    </Box>
                ) : items.length === 0 ? (
                    <Typography sx={{ color: '#555', textAlign: 'center', mt: 6 }}>
                        אין פריטים עדיין
                    </Typography>
                ) : (
                    items.map(item => (
                        <Box key={item.id} dir="rtl" sx={{
                            mb: 2, p: 2.5, borderRadius: 3,
                            bgcolor: '#1a1a1a',
                            border: '1px solid #2a2a2a',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                            '&:hover': { borderColor: '#f0a500', boxShadow: '0 0 12px rgba(240,165,0,0.15)' },
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                {/* אווטאר */}
                                <Box sx={{
                                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #f0a500, #ff6b00)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(240,165,0,0.4)',
                                }}>
                                    <TheaterComedyIcon sx={{ color: '#000', fontSize: 22 }} />
                                </Box>

                                {/* תוכן */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }} style={rtlStyle}>
                                        {item.story_title || '—'}
                                    </Typography>
                                    {item.tagline && (
                                        <Typography variant="body2" sx={{ color: '#f0c060', fontStyle: 'italic', mb: 0.5 }} style={rtlStyle}>
                                            {item.tagline}
                                        </Typography>
                                    )}
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                                        {item.written_at && (
                                            <Chip
                                                label={new Date(item.written_at).toLocaleDateString('he-IL')}
                                                size="small"
                                                sx={{ bgcolor: '#2a2a2a', color: '#888', fontSize: 11 }}
                                            />
                                        )}
                                        <Chip
                                            label={`${item.content?.length || 0} תווים`}
                                            size="small"
                                            sx={{ bgcolor: '#2a2a2a', color: '#888', fontSize: 11 }}
                                        />
                                    </Box>
                                </Box>

                                {/* כפתורים */}
                                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                    <Tooltip title="צפה בדף">
                                        <IconButton size="small" component={Link} to={`/behind/${item.story_id}`} state={{ from: '/manage-behind' }}
                                            sx={{ color: '#f0a500', bgcolor: 'rgba(240,165,0,0.1)', '&:hover': { bgcolor: 'rgba(240,165,0,0.2)' } }}>
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="עריכה">
                                        <IconButton size="small" onClick={() => openEdit(item)}
                                            sx={{ color: '#42a5f5', bgcolor: 'rgba(66,165,245,0.1)', '&:hover': { bgcolor: 'rgba(66,165,245,0.2)' } }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="מחיקה">
                                        <IconButton size="small" onClick={() => setDeleteId(item.id)}
                                            sx={{ color: '#ef5350', bgcolor: 'rgba(239,83,80,0.1)', '&:hover': { bgcolor: 'rgba(239,83,80,0.2)' } }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Box>
                    ))
                )}
            </Container>

            {/* דיאלוג הוספה/עריכה */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" dir="rtl"
                PaperProps={{ sx: { bgcolor: '#1a1a1a', color: '#fff', borderRadius: 3, border: '1px solid #2a2a2a' } }}>
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, #f0a500, #ff6b00)',
                    color: '#000', fontWeight: 800, fontSize: '1.2rem',
                    display: 'flex', alignItems: 'center', gap: 1,
                }}>
                    <TheaterComedyIcon />
                    {editItem ? 'עריכת מאחורי הקלעים' : 'הוספת מאחורי הקלעים'}
                </DialogTitle>

                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '24px !important' }}>
                    {/* בחירת סיפור */}
                    <TextField
                        select label="סיפור *" fullWidth value={form.story_id}
                        onChange={handleStorySelect}
                        InputLabelProps={{ sx: { color: '#aaa' } }}
                        InputProps={{ sx: { color: '#fff' } }}
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' }, '& .MuiSelect-icon': { color: '#aaa' } }}
                    >
                        {stories.map(s => (
                            <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>
                        ))}
                    </TextField>

                    {/* ציטוט */}
                    <TextField
                        label="ציטוט פותח (אופציונלי)" fullWidth value={form.tagline}
                        onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
                        placeholder="משפט קצר ומסקרן שיופיע בהדגשה..."
                        InputLabelProps={{ sx: { color: '#aaa' } }}
                        InputProps={{ sx: { color: '#fff', fontStyle: 'italic' } }}
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
                        inputProps={{ style: rtlStyle }}
                    />

                    {/* תוכן */}
                    <TextField
                        label="תוכן *" fullWidth multiline rows={8} value={form.content}
                        onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                        placeholder="ספרי את הסיפור שמאחורי הסיפור..."
                        InputLabelProps={{ sx: { color: '#aaa' } }}
                        InputProps={{ sx: { color: '#ddd', lineHeight: 2 } }}
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
                        inputProps={{ style: { ...rtlStyle, lineHeight: 2 } }}
                    />

                    {/* תאריך */}
                    <TextField
                        label="תאריך כתיבה (אופציונלי)" type="date" fullWidth value={form.written_at}
                        onChange={e => setForm(p => ({ ...p, written_at: e.target.value }))}
                        InputLabelProps={{ shrink: true, sx: { color: '#aaa' } }}
                        InputProps={{ sx: { color: '#fff' } }}
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
                    />
                </DialogContent>

                <DialogActions sx={{ p: 2.5, gap: 1, borderTop: '1px solid #2a2a2a' }}>
                    <Button onClick={() => setDialogOpen(false)}
                        sx={{ color: '#888', '&:hover': { color: '#fff' } }}>
                        ביטול
                    </Button>
                    <Button onClick={handleSave} disabled={saving} variant="contained"
                        sx={{ bgcolor: '#f0a500', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#d4920a' }, px: 3 }}>
                        {saving ? <CircularProgress size={20} sx={{ color: '#000' }} /> : 'שמור'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* דיאלוג מחיקה */}
            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} dir="rtl"
                PaperProps={{ sx: { bgcolor: '#1a1a1a', color: '#fff', borderRadius: 3, border: '1px solid #2a2a2a' } }}>
                <DialogTitle sx={{ color: '#ef5350' }}>מחיקת פריט</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#ddd' }} style={rtlStyle}>האם למחוק את הפריט הזה לצמיתות?</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteId(null)} sx={{ color: '#888' }}>ביטול</Button>
                    <Button onClick={handleDelete} variant="contained" color="error">מחק</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BehindManager;
