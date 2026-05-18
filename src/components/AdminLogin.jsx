import { Box, Button, CircularProgress, IconButton, InputAdornment, Modal, TextField, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import emailjs from 'emailjs-com';

const AdminLogin = ({ setIsAdmin }) => {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputsRef = useRef([]);
    const [otpEmail, setOtpEmail] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [otpExpired, setOtpExpired] = useState(false);
    const [otpErrorMessage, setOtpErrorMessage] = useState("");
    const [generatedOtp, setGeneratedOtp] = useState("");

    const handleOpen = () => setOpen(true);

    const handleClose = () => {
        setOpen(false);
        setStep(1);
        setEmail("");
        setPassword("");
        setOtp(["", "", "", "", "", ""]);
        setOtpErrorMessage("");
        setOtpExpired(false);
    }

    const toggleShowPassword = () => setShowPassword((s) => !s);

    const generateOTP = (length = 6) => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return Array.from({ length }, () =>
            chars[Math.floor(Math.random() * chars.length)]
        ).join("");
    };

    const sendOtp = async (targetEmail) => {
        try {
            setLoading(true);
            const otpCode = generateOTP();
            setGeneratedOtp(otpCode);
            const expireAt = Date.now() + 5 * 60 * 1000;

            // שליחת מייל דרך EmailJS
            await emailjs.send(
                "service_mbhv7lb",
                "template_c88sgdl",
                {
                    email: targetEmail,
                    passcode: otpCode,
                    time: new Date(expireAt).toLocaleTimeString()
                },
                "oK5wn2dt8-Nwik3Ob"
            );

            setOtpEmail(targetEmail);
            setOtpExpired(false);      // הסרת האזהרה של פג תוקף
            setOtpErrorMessage("");    // הסרת הודעת קוד שגוי
            setOtp(["", "", "", "", "", ""]); // איפוס השדות
        } catch (err) {
            console.error(err);
            setErrorMessage("אירעה שגיאה בשליחת הסיסמה");
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = () => sendOtp(otpEmail);

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);

        try {
            const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
            const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD;

            if (email !== adminEmail || password !== adminPassword) {
                setErrorMessage("אחד מהערכים שגוי");
                setLoading(false);
                return;
            }

            // רק אם המייל והסיסמה נכונים - שולחים OTP
            await sendOtp(email);
            setEmail("");
            setPassword("");
            setStep(2);
        } catch (err) {
            console.error(err);
            setErrorMessage("אירעה שגיאה");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (value, index) => {
        if (value.length > 1) {
            const arr = value.split("").slice(0, 6);
            setOtp(arr);
            inputsRef.current[5]?.focus();
            setOtpErrorMessage("");
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setOtpErrorMessage("");

        if (value && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleVerifyOtp = () => {
        const code = otp.join("");
        if (code.length !== 6) return;

        const now = Date.now();
        const optExpireTime = 5 * 60 * 1000; //5 דקות
        if (now > optExpireTime + (now - optExpireTime)) { // תוקף של 5 דקות
            setOtpExpired(true);
            setOtp(["", "", "", "", "", ""]);
            return;
        }

        if (code !== generatedOtp) {
            setOtpErrorMessage("הקוד שגוי");
            return;
        }

        // כאן מסמנים שהמנהל נכנס בהצלחה
        setIsAdmin(true);
        localStorage.setItem("isAdmin", true);

        //סוגרים את חלון ההתחברות
        handleClose();

    };

    return (
        <>
            <IconButton onClick={handleOpen} color="inherit" aria-label="open admin login">
                <AdminPanelSettingsIcon />
            </IconButton>

            <Modal open={open} onClose={handleClose}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 300,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        outline: 'none',
                    }}
                >
                    {/* כפתור לסגירת ההתחברות */}
                    <IconButton
                        onClick={handleClose}
                        size="small"
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>

                    {step === 1 && (
                        <>
                            <Typography variant="h6" textAlign="center" sx={{ mt: 1 }}>
                                כניסת מנהל
                            </Typography>

                            <TextField
                                label="מייל"
                                variant="outlined"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setErrorMessage(""); }}
                                fullWidth
                            />
                            <TextField
                                label="סיסמה"
                                variant="outlined"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setErrorMessage(""); }}
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IconButton
                                                onClick={toggleShowPassword}
                                                edge="start"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    sx: {
                                        direction: 'rtl',
                                    }
                                }}
                                inputProps={{ style: { textAlign: 'right' } }}
                            />

                            {errorMessage && (
                                <Typography color="error" textAlign="center">
                                    {errorMessage}
                                </Typography>
                            )}

                            {loading ? (
                                <Box display="flex" justifyContent="center">
                                    <CircularProgress size={24} />
                                </Box>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleLogin}
                                    disabled={!email || !password}
                                >
                                    אישור
                                </Button>
                            )}
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Typography variant="h6" textAlign="center" sx={{ mt: 1 }}>
                                נא הכנס את הסיסמה שנשלחה אליך למייל
                            </Typography>

                            <Box display="flex"
                                justifyContent="center"
                                gap={0.5}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const paste = e.clipboardData.getData("text").slice(0, 6);
                                    const arr = paste.split("");
                                    setOtp((prev) => {
                                        const newOtp = [...prev];
                                        arr.forEach((char, index) => {
                                            if (index < 6) newOtp[index] = char;
                                        });
                                        return newOtp;
                                    });
                                    inputsRef.current[arr.length - 1]?.focus();
                                }}
                            >
                                {otp.map((digit, index) => (
                                    <TextField
                                        key={index}
                                        inputRef={(el) => (inputsRef.current[index] = el)}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, index)}
                                        inputProps={{
                                            maxLength: 1,
                                            style: {
                                                marginTop: "-0.4rem",
                                                marginBottom: "-0.4rem",
                                                marginLeft: "-0.4rem",
                                                marginRight: "-0.4rem",
                                                textAlign: "center",
                                                fontSize: "1.1rem",
                                                fontWeight: "bold",
                                            }
                                        }}
                                    />
                                ))}
                            </Box>

                            {otpErrorMessage && (
                                <Typography textAlign="center" color="error">
                                    {otpErrorMessage}
                                </Typography>
                            )}

                            {otpExpired ? (
                                <Box textAlign="center">
                                    <Typography color="error">פג התוקף של הסיסמה</Typography>
                                    <Button
                                        onClick={resendOtp}
                                        variant="text"
                                        sx={{ textDecoration: 'underline', mt: 1 }}
                                    >
                                        שלח שוב
                                    </Button>
                                </Box>
                            ) : (
                                <Typography textAlign="center" color="text.secondary">
                                    הסיסמה תקפה ל-5 דקות
                                </Typography>
                            )}

                            {loading ? (
                                <Box display="flex" justifyContent="center">
                                    <CircularProgress size={24} />
                                </Box>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleVerifyOtp}
                                    disabled={otp.join("").length !== 6 || loading}
                                >
                                    אישור
                                </Button>
                            )}
                        </>
                    )}
                </Box>
            </Modal >
        </>
    );
};

export default AdminLogin;
