import { useEffect, useState } from "react";
import {
    Typography,
    Button,
    TextField,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    IconButton,
    Box,
    useTheme,
    Dialog,             // ⭐ 新增
    DialogActions,      // ⭐ 新增
    DialogContent,      // ⭐ 新增
    DialogContentText,  // ⭐ 新增
    DialogTitle,        // ⭐ 新增
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning'; // 引入警告图标用于弹窗
import { api } from "../api/api";

export default function Activities({ onSelect, onDelete, selectedId, refreshTrigger }) {
    const theme = useTheme();
    const [activities, setActivities] = useState([]);
    const [newName, setNewName] = useState("");
    
    // ⭐ 新增：控制删除确认弹窗的状态，存储待删除的ID
    const [deleteId, setDeleteId] = useState(null);

    const load = async () => {
        const res = await api.getActivities();
        setActivities(res.data);
    };

    useEffect(() => {
        load();
    // ⭐ 将 refreshTrigger 加入依赖数组
    // 只要父组件的 refreshTrigger 变了 (0 -> 1 -> 2 ...)，这里就会重新执行 load()
    }, [refreshTrigger]);

    const add = async () => {
        if (!newName.trim()) return;
        await api.createActivity(newName, 0);
        setNewName("");
        load();
    };

    // ⭐ 修改：点击列表删除图标时，只打开弹窗，不直接调 API
    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    // ⭐ 新增：用户在弹窗点击“确认”后执行的逻辑
    const confirmDelete = async () => {
        if (deleteId) {
            await api.deleteActivity(deleteId);
            load();
            if (onDelete) onDelete(deleteId);
            setDeleteId(null); // 关闭弹窗
        }
    };

    // ⭐ 新增：关闭弹窗
    const cancelDelete = () => {
        setDeleteId(null);
    };

    return (
        <Box 
            sx={{ 
                width: 280, 
                bgcolor: theme.palette.grey[50], 
                p: 2, 
                display: "flex", 
                flexDirection: "column", 
                minHeight: 0,
                borderRight: `1px solid ${theme.palette.divider}`, 
            }}
        >
            {/* 创建活动卡片 (保持不变) */}
            <Paper 
                elevation={3} 
                sx={{ p: 2, mb: 3, borderRadius: 2 }}
            >
                <TextField
                    label="新活动名"
                    value={newName}
                    size="small"
                    fullWidth
                    variant="outlined"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            add();
                        }
                    }}
                    onChange={(e) => setNewName(e.target.value)}
                />
                <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    sx={{ mt: 1.5, py: 1, borderRadius: 2 }} 
                    onClick={add} 
                    fullWidth
                >
                    创建新活动
                </Button>
            </Paper>

            <Typography variant="h6" sx={{ mb: 1, color: theme.palette.text.secondary, fontWeight: 600 }}>
                所有活动
            </Typography>

            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    minHeight: 0,
                    "&::-webkit-scrollbar": { width: '4px' },
                    "&::-webkit-scrollbar-thumb": { 
                        bgcolor: theme.palette.grey[400], 
                        borderRadius: '2px' 
                    },
                }}
            >
                <List disablePadding>
                    {activities.map((a) => (
                        <ListItem
                            key={a.id}
                            disablePadding
                            secondaryAction={
                                <IconButton 
                                    size="small" 
                                    edge="end" 
                                    aria-label="delete"
                                    sx={{ 
                                        color: theme.palette.error.main, 
                                        opacity: 0.7,
                                        '&:hover': { opacity: 1 } 
                                    }}
                                    // ⭐ 修改：这里调用 handleDeleteClick 而不是直接 remove
                                    onClick={() => handleDeleteClick(a.id)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            }
                        >
                            <ListItemButton 
                                onClick={() => onSelect(a.id)}
                                selected={a.id === selectedId}
                                sx={{
                                    borderRadius: 1,
                                    my: 0.5, 
                                    py: 1.5, 
                                    '&.Mui-selected': { 
                                        bgcolor: theme.palette.primary.light + '20', 
                                        borderLeft: `3px solid ${theme.palette.primary.main}`, 
                                    },
                                    '&.Mui-selected .MuiListItemText-primary': {
                                        fontWeight: 700,
                                        color: theme.palette.primary.main,
                                    },
                                    '&:hover': {
                                        bgcolor: theme.palette.grey[200], 
                                    },
                                }}
                            >
                                <PeopleIcon sx={{ color: theme.palette.text.secondary, mr: 1, opacity: 0.6 }} />
                                <ListItemText
                                    primary={a.name}
                                    secondary={`人数: ${a.num_people}`}
                                    sx={{ ml: 1 }}
                                    primaryTypographyProps={{ 
                                        fontWeight: 600, 
                                        fontSize: '1rem',
                                        noWrap: true
                                    }}
                                    secondaryTypographyProps={{
                                        fontSize: '0.8rem', 
                                        color: theme.palette.text.secondary,
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* ⭐⭐⭐ 新增：删除确认弹窗 ⭐⭐⭐ */}
            <Dialog
                open={!!deleteId} // 只要 deleteId 不为 null，就显示弹窗
                onClose={cancelDelete}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                PaperProps={{
                    sx: { borderRadius: 2, padding: 1 } // 让弹窗也圆润一点
                }}
            >
                <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    确认删除此活动？
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        删除后，该活动下的所有人员和账单数据都将无法恢复。
                        <br/>
                        您确定要继续吗？
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete} color="inherit">
                        取消
                    </Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
                        确认删除
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}