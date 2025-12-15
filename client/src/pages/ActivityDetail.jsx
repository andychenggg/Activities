import { useEffect, useState } from "react";
import { api } from "../api/api";
import {
    Container,
    Typography,
    Divider,
    Button,
    useMediaQuery,
    Box,
    useTheme,
    Paper,
    IconButton,    // ⭐ 新增
    TextField,     // ⭐ 新增
    InputAdornment, // ⭐ 新增
    Stack
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';   // ⭐ 新增图标
import CheckIcon from '@mui/icons-material/Check'; // ⭐ 新增图标
import CloseIcon from '@mui/icons-material/Close'; // ⭐ 新增图标
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonTable from "../components/PersonTable";
import ExpenseTable from "../components/ExpenseTable";
import StatsCard from "../components/StatsCard";

export default function ActivityDetail({ id, goBack, onUpdate }) {
    const theme = useTheme();
    const [detail, setDetail] = useState(null);
    const [stats, setStats] = useState(null);
    const [shareDays, setShareDays] = useState(7);
    const [shareInfo, setShareInfo] = useState(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [shareError, setShareError] = useState("");

    // ⭐ 新增：控制标题编辑状态
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");

    // 检测是否手机端
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const load = async () => {
        const res = await api.getActivityDetail(id);
        setDetail(res.data);
        // 加载数据时，同步设置编辑名为当前名
        setEditName(res.data.activity.name);

        const st = await api.getStats(id);
        setStats(st.data);
    };

    useEffect(() => {
        load();
    }, [id]);

    // ⭐ 新增：处理保存名字
    const handleSaveName = async () => {
        if (!editName.trim()) return;
        try {
            await api.updateActivity(id, editName);
            setIsEditing(false);
            load();
            
            // ⭐ 核心修改：通知父组件刷新左侧列表
            if (onUpdate) {
                onUpdate();
            }
            
        } catch (error) {
            console.error("修改失败", error);
            alert("修改失败，请重试");
        }
    };

    // ⭐ 新增：处理取消编辑
    const handleCancelEdit = () => {
        setEditName(detail.activity.name); // 恢复原名
        setIsEditing(false);
    };

    // ⭐ 创建分享链接
    const handleCreateShare = async () => {
        setShareError("");
        if (!shareDays || Number(shareDays) <= 0 || Number(shareDays) > 365) {
            setShareError("有效期天数需在 1-365 之间");
            return;
        }
        setShareLoading(true);
        try {
            const { data } = await api.createShareLink(id, shareDays);
            const url = `${window.location.origin}/?share=${data.token}`;
            setShareInfo({
                token: data.token,
                expires_at: data.expires_at,
                url
            });
        } catch (e) {
            console.error(e);
            setShareError("生成分享链接失败，请稍后重试");
        } finally {
            setShareLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!shareInfo?.url) return;
        try {
            await navigator.clipboard.writeText(shareInfo.url);
            setShareError("链接已复制到剪贴板");
        } catch {
            setShareError("复制失败，请手动复制");
        }
    };

    if (!detail) return <div>Loading...</div>;

    return (
        <Container
            maxWidth="lg"
            sx={{
                mt: isMobile ? 1 : 4,
                width: "100%",
                overflowX: "hidden",
            }}
        >
            {/* 1. 顶部操作区：返回按钮和标题 */}
            <Box sx={{ mb: isMobile ? 2 : 3, display: 'flex', flexDirection: 'column' }}>
                <Button
                    variant="text"
                    startIcon={<ArrowBackIcon />}
                    onClick={goBack}
                    sx={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                        alignSelf: 'flex-start',
                    }}
                >
                    返回活动列表
                </Button>

                {/* ⭐⭐ 修改：标题区域支持编辑 ⭐⭐ */}
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', minHeight: '3.5rem' }}>
                    {isEditing ? (
                        // 编辑模式：显示输入框和操作按钮
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                            <TextField
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                autoFocus
                                fullWidth
                                variant="standard"
                                placeholder="输入新的活动名称"
                                InputProps={{
                                    sx: { 
                                        fontSize: isMobile ? "1.5rem" : "2rem", // 保持字体大小与标题接近
                                        fontWeight: 700,
                                        color: theme.palette.primary.main
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName();
                                    if (e.key === 'Escape') handleCancelEdit();
                                }}
                            />
                            <IconButton 
                                onClick={handleSaveName} 
                                sx={{ color: theme.palette.success.main, bgcolor: theme.palette.success.light + '20' }}
                            >
                                <CheckIcon />
                            </IconButton>
                            <IconButton 
                                onClick={handleCancelEdit}
                                sx={{ color: theme.palette.error.main, bgcolor: theme.palette.error.light + '20' }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    ) : (
                        // 查看模式：显示文本和编辑图标
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography
                                variant={isMobile ? "h4" : "h3"}
                                component="h1"
                                sx={{ 
                                    wordBreak: "break-word", 
                                    fontWeight: 700, 
                                    color: theme.palette.primary.main 
                                }}
                            >
                                {detail.activity.name}
                            </Typography>
                            
                            <IconButton 
                                size="small" 
                                onClick={() => {
                                    setEditName(detail.activity.name); // 确保编辑状态是最新名字
                                    setIsEditing(true);
                                }}
                                sx={{ 
                                    opacity: 0.6, 
                                    transition: '0.2s',
                                    '&:hover': { opacity: 1, bgcolor: theme.palette.action.hover }
                                }}
                            >
                                <EditIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* 2. 主内容区域 */}

            {/* 分享链接设置 */}
            <Paper
                elevation={3}
                sx={{
                    p: isMobile ? 2 : 3,
                    mb: isMobile ? 3 : 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #2563eb10, #7c3aed12)'
                }}
            >
                <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems="center">
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ShareIcon color="primary" /> 生成共享查看链接
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            允许他人无需登录查看此活动，链接将在有效期后自动失效。
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                            type="number"
                            label="有效天数"
                            size="small"
                            value={shareDays}
                            onChange={(e) => setShareDays(e.target.value)}
                            inputProps={{ min: 1, max: 365 }}
                            sx={{ width: 130 }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<ShareIcon />}
                            onClick={handleCreateShare}
                            disabled={shareLoading}
                        >
                            {shareLoading ? "生成中..." : "生成链接"}
                        </Button>
                    </Stack>
                </Stack>

                {shareError && (
                    <Typography color={shareError.includes("复制") ? "primary" : "error"} sx={{ mt: 1 }}>
                        {shareError}
                    </Typography>
                )}

                {shareInfo && (
                    <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: theme.palette.grey[50], border: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon fontSize="small" color="action" /> 有效期至：{new Date(shareInfo.expires_at).toLocaleString()}
                        </Typography>
                        <Stack direction={isMobile ? "column" : "row"} spacing={1} sx={{ mt: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                value={shareInfo.url}
                                InputProps={{ readOnly: true }}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<ContentCopyIcon />}
                                onClick={handleCopy}
                            >
                                复制链接
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* 统计信息 */}
            <StatsCard stats={stats} isMobile={isMobile} />

            <Paper elevation={2} sx={{ p: isMobile ? 3 : 4, mb: isMobile ? 3 : 4, borderRadius: 3 }}>
                <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600} gutterBottom>
                    👥 人员与权重
                </Typography>
                <Divider sx={{ mb: isMobile ? 2 : 3 }} />
                <Box sx={{ overflowX: "auto" }}>
                    <PersonTable
                        people={detail.persons}
                        refresh={load}
                        activity_id={id}
                    />
                </Box>
            </Paper>

            <Paper elevation={2} sx={{ p: isMobile ? 3 : 4, mb: isMobile ? 3 : 4, borderRadius: 3 }}>
                <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600} gutterBottom>
                    🧾 支出记录
                </Typography>
                <Divider sx={{ mb: isMobile ? 2 : 3 }} />
                <Box sx={{ overflowX: "auto" }}>
                    <ExpenseTable
                        expenses={detail.expenses}
                        people={detail.persons}
                        refresh={load}
                        activity_id={id}
                        isMobile={isMobile}
                    />
                </Box>
            </Paper>

        </Container>
    );
}
