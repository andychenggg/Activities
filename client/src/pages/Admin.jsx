import { useState } from "react";
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Stack,
    Divider,
    Alert
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { api } from "../api/api";

export default function Admin({ onBack, userInfo }) {
    const [createUsername, setCreateUsername] = useState("");
    const [createPassword, setCreatePassword] = useState("");
    const [createPasswordConfirm, setCreatePasswordConfirm] = useState("");
    const [resetUsername, setResetUsername] = useState("");
    const [resetPassword, setResetPassword] = useState("");
    const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
    const [showCreatePwd, setShowCreatePwd] = useState(false);
    const [showCreatePwdConfirm, setShowCreatePwdConfirm] = useState(false);
    const [showResetPwd, setShowResetPwd] = useState(false);
    const [showResetPwdConfirm, setShowResetPwdConfirm] = useState(false);

    const [loadingCreate, setLoadingCreate] = useState(false);
    const [loadingReset, setLoadingReset] = useState(false);
    const [message, setMessage] = useState(null); // {type, text}

    const handleCreate = async () => {
        setMessage(null);
        if (createPassword !== createPasswordConfirm) {
            setMessage({ type: "error", text: "两次输入的密码不一致" });
            return;
        }
        setLoadingCreate(true);
        try {
            await api.adminCreateUser(createUsername.trim(), createPassword);
            setMessage({ type: "success", text: "创建成功，角色为 user" });
            setCreateUsername("");
            setCreatePassword("");
            setCreatePasswordConfirm("");
        } catch (err) {
            const status = err?.response?.status;
            if (status === 409) {
                setMessage({ type: "error", text: "用户名已存在" });
            } else if (status === 403) {
                setMessage({ type: "error", text: "需要管理员权限" });
            } else {
                setMessage({ type: "error", text: "创建失败，请重试" });
            }
        } finally {
            setLoadingCreate(false);
        }
    };

    const handleReset = async () => {
        setMessage(null);
        if (resetPassword !== resetPasswordConfirm) {
            setMessage({ type: "error", text: "两次输入的密码不一致" });
            return;
        }
        setLoadingReset(true);
        try {
            await api.adminResetPassword(resetUsername.trim(), resetPassword);
            setMessage({ type: "success", text: "密码已重置" });
            setResetUsername("");
            setResetPassword("");
            setResetPasswordConfirm("");
        } catch (err) {
            const status = err?.response?.status;
            if (status === 404) {
                setMessage({ type: "error", text: "用户不存在" });
            } else if (status === 403) {
                setMessage({ type: "error", text: "需要管理员权限" });
            } else {
                setMessage({ type: "error", text: "重置失败，请重试" });
            }
        } finally {
            setLoadingReset(false);
        }
    };

    return (
        <Box
            sx={{
                flex: 1,
                overflowY: "auto",
                background: "linear-gradient(135deg, #1f2937 0%, #111827 40%, #0b1224 100%)",
                color: "#fff",
                p: { xs: 2, md: 4 }
            }}
        >
            <Container maxWidth="lg">
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<ArrowBackIosNewIcon />}
                        onClick={onBack}
                        sx={{
                            borderColor: "rgba(255,255,255,0.3)",
                            color: "rgba(255,255,255,0.9)",
                            "&:hover": { borderColor: "#90caf9", backgroundColor: "rgba(255,255,255,0.05)" }
                        }}
                    >
                        返回工作台
                    </Button>
                    <AdminPanelSettingsIcon sx={{ fontSize: 32, color: "#60a5fa" }} />
                    <Box>
                        <Typography variant="h5" fontWeight={700} sx={{ color: "#e5e7eb" }}>
                            管理员控制台
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            {userInfo ? `当前登录：${userInfo.username} (${userInfo.role})` : "已登录"}
                        </Typography>
                    </Box>
                </Stack>

                {message && (
                    <Alert
                        severity={message.type}
                        sx={{
                            mb: 3,
                            bgcolor: message.type === "success" ? "rgba(76, 175, 80, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            color: "#fff",
                            border: "1px solid rgba(255,255,255,0.1)"
                        }}
                    >
                        {message.text}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper
                            elevation={8}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                background: "linear-gradient(145deg, rgba(59,130,246,0.15), rgba(99,102,241,0.25))",
                                border: "1px solid rgba(255,255,255,0.08)",
                                backdropFilter: "blur(12px)",
                                color: "#fff"
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <PersonAddAlt1Icon sx={{ color: "#a5b4fc" }} />
                                <Typography variant="h6" fontWeight={700}>创建新用户</Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mb: 2 }}>
                                仅创建 role 为 user 的账户，密码将被安全加密存储。
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    label="用户名"
                                    fullWidth
                                    value={createUsername}
                                    onChange={(e) => setCreateUsername(e.target.value)}
                                    InputLabelProps={{ style: { color: "#cbd5e1" } }}
                                    InputProps={{
                                        style: { color: "#fff" },
                                    }}
                                />
                                <TextField
                                    label="密码"
                                    type={showCreatePwd ? "text" : "password"}
                                    fullWidth
                                    value={createPassword}
                                    onChange={(e) => setCreatePassword(e.target.value)}
                                    InputLabelProps={{ style: { color: "#cbd5e1" } }}
                                    InputProps={{
                                        style: { color: "#fff" },
                                        endAdornment: (
                                            <Button 
                                                color="inherit" 
                                                size="small" 
                                                onClick={() => setShowCreatePwd(v => !v)}
                                                sx={{ minWidth: 'auto', color: "#cbd5e1" }}
                                            >
                                                {showCreatePwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </Button>
                                        )
                                    }}
                                />
                                <TextField
                                    label="确认密码"
                                    type={showCreatePwdConfirm ? "text" : "password"}
                                    fullWidth
                                    value={createPasswordConfirm}
                                    onChange={(e) => setCreatePasswordConfirm(e.target.value)}
                                    InputLabelProps={{ style: { color: "#cbd5e1" } }}
                                    InputProps={{
                                        style: { color: "#fff" },
                                        endAdornment: (
                                            <Button 
                                                color="inherit" 
                                                size="small" 
                                                onClick={() => setShowCreatePwdConfirm(v => !v)}
                                                sx={{ minWidth: 'auto', color: "#cbd5e1" }}
                                            >
                                                {showCreatePwdConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </Button>
                                        )
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<PersonAddAlt1Icon />}
                                    onClick={handleCreate}
                                    disabled={
                                        loadingCreate ||
                                        !createUsername.trim() ||
                                        !createPassword ||
                                        !createPasswordConfirm
                                    }
                                    sx={{
                                        mt: 1,
                                        py: 1.2,
                                        fontWeight: 700,
                                        background: "linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)",
                                        boxShadow: "0 10px 30px rgba(37, 99, 235, 0.35)"
                                    }}
                                >
                                    创建用户
                                </Button>
                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper
                            elevation={8}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                background: "linear-gradient(145deg, rgba(16, 185, 129, 0.15), rgba(45, 212, 191, 0.25))",
                                border: "1px solid rgba(255,255,255,0.08)",
                                backdropFilter: "blur(12px)",
                                color: "#fff"
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <RestartAltIcon sx={{ color: "#6ee7b7" }} />
                                <Typography variant="h6" fontWeight={700}>重置密码</Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mb: 2 }}>
                                输入目标用户名和新密码，立即生效。
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    label="用户名"
                                    fullWidth
                                    value={resetUsername}
                                    onChange={(e) => setResetUsername(e.target.value)}
                                    InputLabelProps={{ style: { color: "#cbd5e1" } }}
                                    InputProps={{
                                        style: { color: "#fff" },
                                    }}
                                />
                                <TextField
                                    label="新密码"
                                    type={showResetPwd ? "text" : "password"}
                                    fullWidth
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                    InputLabelProps={{ style: { color: "#cbd5e1" } }}
                                    InputProps={{
                                        style: { color: "#fff" },
                                        endAdornment: (
                                            <Button 
                                                color="inherit" 
                                                size="small" 
                                                onClick={() => setShowResetPwd(v => !v)}
                                                sx={{ minWidth: 'auto', color: "#cbd5e1" }}
                                            >
                                                {showResetPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </Button>
                                        )
                                    }}
                                />
                                <TextField
                                    label="确认新密码"
                                    type={showResetPwdConfirm ? "text" : "password"}
                                    fullWidth
                                    value={resetPasswordConfirm}
                                    onChange={(e) => setResetPasswordConfirm(e.target.value)}
                                    InputLabelProps={{ style: { color: "#cbd5e1" } }}
                                    InputProps={{
                                        style: { color: "#fff" },
                                        endAdornment: (
                                            <Button 
                                                color="inherit" 
                                                size="small" 
                                                onClick={() => setShowResetPwdConfirm(v => !v)}
                                                sx={{ minWidth: 'auto', color: "#cbd5e1" }}
                                            >
                                                {showResetPwdConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </Button>
                                        )
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<RestartAltIcon />}
                                    onClick={handleReset}
                                    disabled={
                                        loadingReset ||
                                        !resetUsername.trim() ||
                                        !resetPassword ||
                                        !resetPasswordConfirm
                                    }
                                    sx={{
                                        mt: 1,
                                        py: 1.2,
                                        fontWeight: 700,
                                        background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
                                        boxShadow: "0 10px 30px rgba(16, 185, 129, 0.35)"
                                    }}
                                >
                                    重置密码
                                </Button>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.08)" }} />

                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px dashed rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.8)"
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                        提示
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                        - 只有管理员账户才能访问本页面并调用接口。<br />
                        - 新用户默认角色为 user；密码会在服务端加密存储。<br />
                        - 重置密码操作立即生效，用户需使用新密码登录。
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
}
