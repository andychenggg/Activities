import { useEffect, useState, useRef } from "react";
import {
    Box,
    Paper,
    Drawer,
    IconButton,
    AppBar,
    Toolbar,
    Typography,
    useMediaQuery,
    Button,
    CssBaseline,
    ThemeProvider,
    createTheme,
    alpha
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from '@mui/icons-material/Logout'; // 引入退出图标
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'; // 引入Logo图标
import Activities from "./pages/Activities";
import ActivityDetail from "./pages/ActivityDetail";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import PublicShare from "./pages/PublicShare";
import { api } from "./api/api";

// 创建一个自定义主题（可选，为了更好的默认字体和颜色）
const theme = createTheme({
    palette: {
        background: {
            default: "#f4f6f8", // 全局浅灰背景
        },
        primary: {
            main: "#2563eb",
        }
    },
    typography: {
        fontFamily: '"Inter", "PingFang SC", "Roboto", "Helvetica", "Arial", sans-serif',
    }
});

export default function App() {
    const [selectedId, setSelectedId] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [view, setView] = useState("main"); // main | admin
    // ⭐ 新增：用于控制左侧列表刷新的信号
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const shareToken = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("share") : null;
    // 小于 900px 视为移动端
    const isMobile = useMediaQuery("(max-width: 900px)");
    const sidebarWidth = 280; // 调整为更精致的宽度

    // 管理员强制进入 admin 视图
    const effectiveView = userInfo?.role === 'admin' ? 'admin' : view;

    const selectedIdRef = useRef(null);

    const checkLogin = async () => {
        if (shareToken) return;
        try {
            const { data } = await api.authStatus();
            if (!data.authenticated) {
                setLoggedIn(false);
                setUserInfo(null);
                setView("main");
                return;
            }
            setLoggedIn(true);
            setUserInfo({ id: data.id, username: data.username, role: data.role });
            // 管理员默认进入 admin 视图，禁止访问普通工作台
            setView(data.role === 'admin' ? 'admin' : 'main');
        } catch {
            setLoggedIn(false);
            setUserInfo(null);
            setView("main");
        }
    };

    useEffect(() => {
        checkLogin();
    }, []);

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    // ⭐ 新增：触发刷新的函数
    const handleActivityUpdate = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // 公共分享视图（无顶栏/菜单）
    if (shareToken) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <PublicShare token={shareToken} />
            </ThemeProvider>
        );
    }

    if (!loggedIn) {
        return <Login onLogin={checkLogin} />;
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline /> {/* 重置 CSS，应用背景色 */}
            
            <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: 'background.default' }}>

                {/* 顶部导航栏 - Fancy 渐变风格 */}
                <AppBar 
                    position="static" 
                    elevation={0} // 去除默认阴影，使用更现代的平面风格或自定义阴影
                    sx={{
                        // 线性渐变背景：深蓝 -> 亮蓝
                        background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <Toolbar sx={{ minHeight: 64 }}>
                        {/* 移动端菜单按钮 */}
                        {isMobile && (
                            <IconButton
                                onClick={() => setDrawerOpen(true)}
                                edge="start"
                                sx={{ mr: 1, color: 'white' }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}

                        {/* Logo 和 标题 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <AccountBalanceWalletIcon sx={{ mr: 1.5, fontSize: 28, color: '#4facfe' }} /> {/* Logo */}
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    fontWeight: 700, 
                                    letterSpacing: 1,
                                    textShadow: '0 2px 4px rgba(0,0,0,0.2)' // 文字阴影
                                }}
                            >
                                算账工具 Pro
                            </Typography>
                        </Box>

                        {userInfo?.role === 'admin' && (
                            <Typography sx={{ mr: 2, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                                管理员模式
                            </Typography>
                        )}

                        {/* 退出按钮 - 优化为半透明按钮 */}
                        <Button
                            startIcon={<LogoutIcon />}
                            sx={{ 
                                color: 'white',
                                textTransform: 'none',
                                bgcolor: alpha('#fff', 0.1), // 半透明背景
                                '&:hover': {
                                    bgcolor: alpha('#fff', 0.2), // 悬停加深
                                    color: '#ffcdd2' // 悬停变淡红
                                }
                            }}
                            onClick={async () => {
                                await api.logout();
                                setLoggedIn(false);
                                setSelectedId(null);
                                setUserInfo(null);
                                setView("main");
                            }}
                        >
                            退出登录
                        </Button>
                    </Toolbar>
                </AppBar>

                {/* 主区域布局 */}
                <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>

                    {effectiveView === "admin" ? (
                        <Admin onBack={() => setView("main")} userInfo={userInfo} />
                    ) : (
                        <>
                            {/* PC 左侧侧栏 */}
                            {!isMobile && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        width: sidebarWidth,
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        borderRadius: 0,
                                        borderRight: '1px solid #e0e0e0',
                                        backgroundColor: "#fff",
                                        overflow: "hidden",
                                        zIndex: 1,
                                    }}
                                >
                                    <Activities
                                        selectedId={selectedId}
                                        onSelect={(id) => setSelectedId(id)}
                                        onDelete={(deletedId) => {
                                            if (deletedId === selectedIdRef.current) {
                                                setSelectedId(null);
                                            }
                                            handleActivityUpdate(); // 删除时也可以触发一下刷新以防万一
                                        }}
                                        // ⭐ 传入刷新信号
                                        refreshTrigger={refreshTrigger}
                                    />
                                </Paper>
                            )}


                            {/* Mobile 抽屉侧栏 */}
                            {isMobile && (
                                <Drawer 
                                    open={drawerOpen} 
                                    onClose={() => setDrawerOpen(false)}
                                    PaperProps={{ sx: { width: sidebarWidth } }}
                                >
                                    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
                                        <Activities
                                            selectedId={selectedId}
                                            onSelect={(id) => {
                                                setSelectedId(id);
                                                setDrawerOpen(false);
                                            }}
                                            onDelete={(deletedId) => {
                                                if (deletedId === selectedIdRef.current) {
                                                    setSelectedId(null);
                                                }
                                                handleActivityUpdate();
                                            }}
                                            // ⭐ 传入刷新信号
                                            refreshTrigger={refreshTrigger}
                                        />
                                    </Box>
                                </Drawer>
                            )}

                            {/* 右侧内容区 */}
                            <Box 
                                sx={{ 
                                    flex: 1, 
                                    overflowY: "auto", 
                                    p: isMobile ? 2 : 4,
                                    backgroundColor: '#f4f6f8',
                                    backgroundImage: 'radial-gradient(#e3e8eb 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}
                            >
                                {!selectedId && (
                                    // ... (空状态保持不变)
                                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                        <Typography variant="h5">请选择一个活动</Typography>
                                    </Box>
                                )}

                                {selectedId && (
                                    <ActivityDetail 
                                        id={selectedId} 
                                        goBack={() => setSelectedId(null)}
                                        // ⭐ 传入回调函数，当详情页更新名字时调用
                                        onUpdate={handleActivityUpdate} 
                                    />
                                )}
                            </Box>
                        </>
                    )}
                </Box>
            </Box>
        </ThemeProvider>
    );
}
