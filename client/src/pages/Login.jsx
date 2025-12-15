import { useState } from "react";
import { 
    Box, 
    TextField, 
    Button, 
    Typography, 
    Paper, 
    InputAdornment, 
    Avatar,
    CssBaseline,
    Container
} from "@mui/material";
// 引入图标
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import axios from "axios";
import { api } from "../api/api";

axios.defaults.withCredentials = true;

export default function Login({ onLogin }) {
    // --- 逻辑部分保持完全不变 ---
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [err, setErr] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const submit = async () => {
        try {
            const response = await api.login(username, password);
            console.log("登录成功", response.data);
            onLogin();
        } catch (error) {
            console.error("登录失败", error);
            setErr("用户名或密码错误");
        }
    };
    // -------------------------

    return (
        <Box 
            sx={{ 
                height: "100vh", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                // Fancy 背景：流体渐变
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundSize: "cover",
            }}
        >
            <CssBaseline />
            
            <Container component="main" maxWidth="xs">
                <Paper 
                    elevation={10} // 更深的阴影
                    sx={{ 
                        p: 4, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        borderRadius: 4, // 更大的圆角
                        // 毛玻璃效果
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        backdropFilter: 'blur(10px)',
                        transition: 'transform 0.3s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-5px)' // 鼠标悬停轻微上浮
                        }
                    }}
                >
                    {/* 顶部 Logo 区 */}
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56, boxShadow: 3 }}>
                        <LockOutlinedIcon fontSize="large" />
                    </Avatar>
                    
                    <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#333' }}>
                        欢迎回来
                    </Typography>

                    <Box component="div" sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="用户名"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setU(e.target.value)}
                            // 增加图标
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutlineIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="密码"
                            type={showPassword ? "text" : "password"}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setP(e.target.value)}
                            // 增加图标
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(prev => !prev)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            // 支持回车登录 (这也是一种 UI/UX 优化)
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') submit();
                            }}
                        />

                        {/* 错误提示优化 */}
                        {err && (
                            <Typography 
                                color="error" 
                                variant="body2" 
                                sx={{ 
                                    mt: 1, 
                                    textAlign: 'center', 
                                    bgcolor: '#ffebee', 
                                    p: 1, 
                                    borderRadius: 1 
                                }}
                            >
                                ⚠️ {err}
                            </Typography>
                        )}

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={submit}
                            size="large"
                            endIcon={<LoginIcon />} // 增加按钮图标
                            sx={{
                                mt: 4,
                                mb: 2,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                borderRadius: 2,
                                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', // 按钮渐变
                                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #2196F3 60%, #21CBF3 90%)',
                                    transform: 'scale(1.02)',
                                    boxShadow: '0 6px 10px 4px rgba(33, 203, 243, .3)',
                                }
                            }}
                        >
                            立即登录
                        </Button>
                    </Box>
                </Paper>
                
                {/* 底部版权/提示信息 (可选，增加完整度) */}
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4, color: 'rgba(255,255,255,0.7)' }}>
                    {'Copyright © 算账工具 Pro ' + new Date().getFullYear() + '.'}
                </Typography>
            </Container>
        </Box>
    );
}
