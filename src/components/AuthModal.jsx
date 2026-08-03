import { supabase } from "../supabase";
import { Alert, Box, Button, Checkbox, CircularProgress, Divider, FormControlLabel, IconButton, Modal, TextField, Typography } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useState, useRef, useEffect } from "react";
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    width: 400,
    bgcolor: '#fffaf5',
    borderRadius: 3,
    boxShadow: '0 4px 32px rgba(200,134,10,0.18)',
    border: '1px solid rgba(200,134,10,0.15)',
    p: 4,
};

const btnSx = {
    background: 'linear-gradient(135deg,#c8860a,#e8a830)', boxShadow: 'none',
    '&:hover': { boxShadow: '0 4px 14px rgba(200,134,10,0.35)' },
    '&.Mui-disabled': { background: 'rgba(200,134,10,0.4)', color: '#fff' }
};

const AuthModal = ({ open, onClose, onLoginSuccess }) => {
    const [mode, setMode] = useState("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [generatedOtp, setGeneratedOtp] = useState("");
    const [otpExpired, setOtpExpired] = useState(false);
    const [otpErrorMessage, setOtpErrorMessage] = useState("");
    const [otpEmail, setOtpEmail] = useState("");
    const inputsRef = useRef([]);
    const [emailUpdates, setEmailUpdates] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;

    const resetForm = () => {
        setName(""); setEmail(""); setPassword("");
        setOtp(["", "", "", "", "", ""]);
        setEmailUpdates(false); setError(null); setMessage(null);
    };

    const switchMode = (newMode) => { resetForm(); setMode(newMode); };

    const handleLogin = async () => {
        setError(null); setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError("המייל או הסיסמה שגויים"); setLoading(false); return; }
        if (email === adminEmail) { await sendOtp(email); setMode("otp"); setLoading(false); return; }
        setLoading(false); onLoginSuccess(data.session, false); onClose();
    };

    const handleClose = () => { resetForm(); setMode("login"); onClose(); };

    const generateOTP = (length = 6) => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    };

    const sendOtp = async (targetEmail) => {
        setLoading(true);
        const otpCode = generateOTP();
        setGeneratedOtp(otpCode);
        const { error } = await supabase.functions.invoke("send-otp", {
            body: JSON.stringify({ email: targetEmail, otpCode, expireTime: new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString() }),
        });
        if (error) { setError("אירעה שגיאה בשליחת הקוד"); }
        else { setOtpEmail(targetEmail); setOtpExpired(false); setOtpErrorMessage(""); setOtp(["", "", "", "", "", ""]); }
        setLoading(false);
    };

    const resendOtp = () => sendOtp(otpEmail);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            if (mode === "login") handleLogin();
            if (mode === "register") handleRegister();
            if (mode === "otp") handleVerifyOtp();
        }
    };

    const handleOtpChange = (value, index) => {
        if (value.length > 1) {
            const arr = value.split("").slice(0, 6);
            setOtp(arr); inputsRef.current[5]?.focus(); setOtpErrorMessage(""); return;
        }
        const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp); setOtpErrorMessage("");
        if (value && index < 5) inputsRef.current[index + 1]?.focus();
    };

    const handleVerifyOtp = async () => {
        const code = otp.join("");
        if (code.length !== 6) return;
        if (code !== generatedOtp) { setOtpErrorMessage("הקוד שגוי או פג תוקפו"); return; }
        const { data } = await supabase.auth.getSession();
        handleClose(); onLoginSuccess(data.session, true);
    };

    const handleRegister = async () => {
        setError(null);
        if (!name.trim()) { setError("הזן שם"); return; }
        if (!email.trim()) { setError("הזן מייל"); return; }
        if (!password.trim()) { setError("הזן סיסמה"); return; }
        if (password.length < 6) { setError("הסיסמה חייבת להכיל 6 תווים לפחות"); return; }
        if (!emailUpdates) { setError("לא תוכל להירשם עד שלא תאשר קבלת עדכונים למייל"); return; }
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            if (error.message.includes("already registered")) setError("המייל הזה כבר רשום במערכת");
            setLoading(false); return;
        }
        await supabase.from("users").insert([{ id: data.user.id, name, email, email_updates: true, is_admin: false }]);
        setLoading(false); handleClose(); onLoginSuccess(data.session, false);
    };

    useEffect(() => { if (open) { resetForm(); setMode("login"); } }, [open]);

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style} dir="rtl">
                <IconButton onClick={handleClose} size="small" sx={{ position: 'absolute', left: 8, top: 8, color: '#7a5c3a' }}>
                    <CloseIcon />
                </IconButton>

                <Typography variant="h6" textAlign="center" sx={{ mb: 2, fontWeight: 800, color: '#3b2008' }} mt={1}>
                    {mode === "login" && "התחברות"}
                    {mode === "register" && "הרשמה"}
                    {mode === "otp" && "אימות דו-שלבי"}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

                {mode === "login" && (
                    <>
                        <TextField label="מייל" fullWidth value={email} dir="ltr"
                            onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
                            sx={{ mb: 2, "& input": { paddingRight: "25px" } }} />
                        <TextField label="סיסמה" type={showPassword ? "text" : "password"} fullWidth
                            value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                            sx={{ mb: 3, "& .MuiInputAdornment-positionEnd": { marginRight: "10px" } }}
                            InputProps={{
                                inputProps: { style: { direction: 'ltr' } },
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(s => !s)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }} />
                        <Button variant="contained" fullWidth disabled={loading} onClick={handleLogin} sx={btnSx}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : "התחבר"}
                        </Button>
                        <Divider sx={{ my: 2, borderColor: 'rgba(200,134,10,0.2)' }} />
                        <Typography textAlign="center" fontSize={14} color="#5c3a1e">
                            עדיין אין לך חשבון?{" "}
                            <span onClick={() => switchMode("register")} style={{ color: "#c8860a", cursor: "pointer", fontWeight: "bold" }}>הירשם</span>
                        </Typography>
                    </>
                )}

                {mode === "register" && (
                    <>
                        <TextField label="שם" fullWidth value={name} onChange={e => setName(e.target.value)}
                            onKeyDown={handleKeyDown} sx={{ mb: 2, "& input": { paddingLeft: "20px" } }} />
                        <TextField label="מייל" fullWidth value={email} dir="ltr"
                            onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}
                            sx={{ mb: 2, "& input": { paddingRight: "25px" } }} />
                        <TextField label="סיסמה" type={showPassword ? "text" : "password"} fullWidth
                            value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                            sx={{ mb: 2, "& .MuiInputAdornment-positionEnd": { marginRight: "10px" } }}
                            InputProps={{
                                inputProps: { style: { direction: 'ltr' } },
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(s => !s)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }} />
                        <FormControlLabel
                            control={<Checkbox checked={emailUpdates} onChange={e => setEmailUpdates(e.target.checked)}
                                sx={{ color: '#c8860a', '&.Mui-checked': { color: '#c8860a' } }} />}
                            label={<Typography variant="body2" color="#5c3a1e">אני מאשר קבלת עדכונים למייל</Typography>}
                            sx={{ mb: 2 }} />
                        <Button variant="contained" fullWidth disabled={loading} onClick={handleRegister} sx={btnSx}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : "הירשם"}
                        </Button>
                        <Divider sx={{ my: 2, borderColor: 'rgba(200,134,10,0.2)' }} />
                        <Typography textAlign="center" fontSize={14} color="#5c3a1e">
                            כבר יש לך חשבון?{" "}
                            <span onClick={() => switchMode("login")} style={{ color: "#c8860a", cursor: "pointer", fontWeight: "bold" }}>התחבר</span>
                        </Typography>
                    </>
                )}

                {mode === "otp" && (
                    <>
                        <Typography textAlign="center" color="#7a5c3a" mb={2}>נשלח קוד אימות למייל שלך</Typography>
                        <Box display="flex" justifyContent="center" gap={0.5}
                            onPaste={(e) => {
                                e.preventDefault();
                                const paste = e.clipboardData.getData("text").slice(0, 6);
                                const arr = paste.split("");
                                setOtp((prev) => { const n = [...prev]; arr.forEach((c, i) => { if (i < 6) n[i] = c; }); return n; });
                                inputsRef.current[arr.length - 1]?.focus();
                            }}>
                            {otp.map((digit, index) => (
                                <TextField key={index} inputRef={(el) => (inputsRef.current[index] = el)}
                                    value={digit} onChange={(e) => handleOtpChange(e.target.value, index)}
                                    onKeyDown={handleKeyDown}
                                    inputProps={{ maxLength: 1, style: { textAlign: "center", fontSize: "1.1rem", fontWeight: "bold" } }}
                                    sx={{ width: 45 }} />
                            ))}
                        </Box>
                        {otpErrorMessage && <Typography textAlign="center" color="error" mt={1}>{otpErrorMessage}</Typography>}
                        {otpExpired ? (
                            <Box textAlign="center" mt={1}>
                                <Typography color="error">פג התוקף של הקוד</Typography>
                                <Button onClick={resendOtp} variant="text" sx={{ color: '#c8860a', textDecoration: 'underline' }}>שלח שוב</Button>
                            </Box>
                        ) : (
                            <Typography textAlign="center" color="#7a5c3a" mt={1}>הקוד תקף ל-5 דקות</Typography>
                        )}
                        <Button variant="contained" fullWidth sx={{ mt: 2, ...btnSx }}
                            disabled={otp.join("").length !== 6 || loading} onClick={handleVerifyOtp}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : "אמת/י קוד"}
                        </Button>
                    </>
                )}
            </Box>
        </Modal>
    );
};
export default AuthModal;
