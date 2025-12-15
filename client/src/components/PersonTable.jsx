import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    TextField,
    Button,
    useTheme,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert,
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Chip,
    Paper
} from "@mui/material";
// 图标
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import EditIcon from '@mui/icons-material/Edit';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import { api } from "../api/api";
import { useState, useEffect } from "react";

export default function PersonTable({ people, refresh, activity_id }) {
    const theme = useTheme();
    
    // --- 原有状态 ---
    const [localPeople, setLocalPeople] = useState([]); 
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [name, setName] = useState("");
    const [weight, setWeight] = useState(1);
    const [deleteId, setDeleteId] = useState(null);
    const [errorOpen, setErrorOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // --- 配置管理相关状态 ---
    const [configOpen, setConfigOpen] = useState(false);
    const [configs, setConfigs] = useState([]);
    const [newConfigName, setNewConfigName] = useState("");
    const [editingConfigId, setEditingConfigId] = useState(null); 
    const [editingConfigData, setEditingConfigData] = useState(null);
    
    // ⭐ 新增：删除配置模板的确认弹窗状态
    const [deleteConfigId, setDeleteConfigId] = useState(null);

    // --- Effect: 同步数据 ---
    useEffect(() => {
        setLocalPeople(people);
        setHasUnsavedChanges(false);
    }, [people]);

    // --- 原有逻辑 ---
    const add = async () => {
        if (!name.trim()) return;
        await api.addPerson(activity_id, name, Number(weight));
        setName("");
        setWeight(1);
        refresh();
    };

    const handleLocalChange = (id, field, value) => {
        if (field === "weight") {
             if (Number(value) < 0) {
                 setErrorMessage("权重数值不能小于 0，请输入有效的正数。");
                 setErrorOpen(true);
                 return;
             }
        }
        setLocalPeople(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, [field]: value };
            }
            return p;
        }));
        setHasUnsavedChanges(true);
    };

    const saveChanges = async () => {
        const updates = localPeople.map(async (localP) => {
            const originalP = people.find(p => p.id === localP.id);
            if (!originalP) return null;
            if (localP.name !== originalP.name || Number(localP.weight) !== originalP.weight) {
                if (Number(localP.weight) <= 0 || isNaN(Number(localP.weight))) return null;
                return api.updatePerson(localP.id, {
                    name: localP.name,
                    weight: Number(localP.weight),
                });
            }
            return null;
        });
        await Promise.all(updates);
        refresh();
        setShowSuccess(true);
    };

    const handleDeleteClick = (id) => setDeleteId(id);
    const confirmDelete = async () => {
        if (deleteId) {
            await api.deletePerson(deleteId);
            refresh();
            setDeleteId(null);
        }
    };
    const cancelDelete = () => setDeleteId(null);
    const personToDelete = people.find(p => p.id === deleteId);


    // =========================================================
    // 配置管理逻辑
    // =========================================================

    const handleOpenConfigManager = async () => {
        setConfigOpen(true);
        loadConfigs();
    };

    const loadConfigs = async () => {
        try {
            const res = await api.getConfigs();
            setConfigs(res.data);
        } catch (e) {
            console.error("加载配置失败", e);
        }
    };

    const handleSaveCurrentAsConfig = async () => {
        if (!newConfigName.trim()) {
            setErrorMessage("请输入配置名称");
            setErrorOpen(true);
            return;
        }
        if (localPeople.length === 0) {
            setErrorMessage("当前人员列表为空，无法保存");
            setErrorOpen(true);
            return;
        }
        try {
            await api.createConfig(newConfigName, localPeople);
            setNewConfigName("");
            loadConfigs();
            setShowSuccess(true);
        } catch (e) {
            setErrorMessage("保存配置失败");
            setErrorOpen(true);
        }
    };

    // 覆盖导入逻辑
    const handleImportConfig = async (configPersons) => {
        try {
            const deletePromises = people.map(p => api.deletePerson(p.id));
            await Promise.all(deletePromises);

            const addPromises = configPersons.map(p =>
                api.addPerson(activity_id, p.name.trim(), Number(p.weight))
            );

            await Promise.all(addPromises);
            refresh();
            setConfigOpen(false);
            setShowSuccess(true);

        } catch (e) {
            console.error(e);
            setErrorMessage("导入失败");
            setErrorOpen(true);
        }
    };

    // ⭐ 修改：点击删除配置图标，只设置ID，不弹窗
    const handleDeleteConfigClick = (e, id) => {
        e.stopPropagation();
        setDeleteConfigId(id);
    };

    // ⭐ 新增：确认删除配置
    const handleConfirmDeleteConfig = async () => {
        if (deleteConfigId) {
            try {
                await api.deleteConfig(deleteConfigId);
                loadConfigs();
            } catch (e) {
                console.error(e);
            }
            setDeleteConfigId(null);
        }
    };

    const handleAccordionChange = (panelId, config) => (event, isExpanded) => {
        if (isExpanded) {
            setEditingConfigId(panelId);
            setEditingConfigData({
                name: config.name,
                persons: JSON.parse(JSON.stringify(config.persons))
            });
        } else {
            setEditingConfigId(null);
            setEditingConfigData(null);
        }
    };

    const handleConfigPersonChange = (index, field, value) => {
        const newData = { ...editingConfigData };
        newData.persons[index][field] = value;
        setEditingConfigData(newData);
    };

    const handleAddPersonToConfig = () => {
        setEditingConfigData(prev => ({
            ...prev,
            persons: [...prev.persons, { name: "", weight: 1 }]
        }));
    };

    const handleRemovePersonFromConfig = (index) => {
        setEditingConfigData(prev => ({
            ...prev,
            persons: prev.persons.filter((_, i) => i !== index)
        }));
    };

    const handleUpdateConfig = async (configId) => {
        try {
            const validPersons = editingConfigData.persons.filter(p => p.name.trim() !== "");
            await api.updateConfig(configId, editingConfigData.name, validPersons);
            loadConfigs();
            setShowSuccess(true);
        } catch (e) {
            setErrorMessage("更新配置失败");
            setErrorOpen(true);
        }
    };
    
    // 获取当前要删除的配置名称，用于弹窗展示
    const configToDeleteName = configs.find(c => c.id === deleteConfigId)?.name;

    return (
        <>
            {/* 顶部操作栏 */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {hasUnsavedChanges ? "⚠️ 有未保存的修改" : "当前数据已同步"}
                </Typography>
                
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<SettingsSuggestIcon />}
                        onClick={handleOpenConfigManager}
                        sx={{ mr: 2, borderRadius: 2, textTransform: 'none' }}
                    >
                        导入/管理配置
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={saveChanges}
                        disabled={!hasUnsavedChanges}
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            boxShadow: hasUnsavedChanges ? theme.shadows[4] : 'none'
                        }}
                    >
                        保存修改
                    </Button>
                </Box>
            </Box>

            {/* 原有表格 */}
            <Table sx={{ minWidth: 400 }}>
                <TableHead sx={{ bgcolor: theme.palette.grey[100] }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>名字</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>权重 (份数)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', minWidth: '110px' }}>操作</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {localPeople.map((p) => (
                        <TableRow key={p.id} sx={{ '&:nth-of-type(odd)': { bgcolor: theme.palette.action.hover } }}>
                            <TableCell>
                                <TextField
                                    value={p.name}
                                    variant="standard"
                                    size="small"
                                    fullWidth
                                    onChange={(e) => handleLocalChange(p.id, "name", e.target.value)}
                                    sx={{ 
                                        '& .MuiInputBase-input': { 
                                            fontWeight: people.find(op=>op.id===p.id)?.name !== p.name ? 'bold' : 'normal',
                                            color: people.find(op=>op.id===p.id)?.name !== p.name ? 'primary.main' : 'inherit'
                                        } 
                                    }}
                                />
                            </TableCell>
                            <TableCell>
                                <TextField
                                    type="number"
                                    value={p.weight}
                                    variant="standard"
                                    size="small"
                                    sx={{ width: '80px' }}
                                    onChange={(e) => handleLocalChange(p.id, "weight", e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <IconButton 
                                    size="small"
                                    onClick={() => handleDeleteClick(p.id)}
                                    sx={{ color: theme.palette.error.main }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}

                    <TableRow sx={{ bgcolor: theme.palette.primary.light + '10' }}>
                        <TableCell>
                            <TextField
                                label="新成员姓名"
                                value={name}
                                size="small"
                                fullWidth
                                variant="outlined"
                                onChange={(e) => setName(e.target.value)}
                            />
                        </TableCell>
                        <TableCell>
                            <TextField
                                label="权重"
                                type="number"
                                value={weight}
                                size="small"
                                variant="outlined"
                                sx={{ width: '80px' }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (Number(val) < 0) {
                                        setErrorMessage("权重数值不能小于 0。");
                                        setErrorOpen(true);
                                        return;
                                    }
                                    setWeight(val);
                                }}
                            />
                        </TableCell>
                        <TableCell>
                            <Button 
                                variant="contained" 
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={add}
                                sx={{ whiteSpace: 'nowrap' }} 
                            >
                                添加
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {/* 删除成员确认窗口 */}
            <Dialog open={!!deleteId} onClose={cancelDelete} PaperProps={{ sx: { borderRadius: 2, padding: 1 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" /> 删除成员
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        确定要删除 <strong>{personToDelete?.name}</strong> 吗？
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete} color="inherit">取消</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">确认删除</Button>
                </DialogActions>
            </Dialog>

            {/* 错误提示窗口 */}
            <Dialog open={errorOpen} onClose={() => setErrorOpen(false)} PaperProps={{ sx: { borderRadius: 2, padding: 1, minWidth: 300 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.error.main }}>
                    <ErrorOutlineIcon /> 输入无效
                </DialogTitle>
                <DialogContent><DialogContentText>{errorMessage}</DialogContentText></DialogContent>
                <DialogActions><Button onClick={() => setErrorOpen(false)} variant="contained" color="primary" autoFocus>好的</Button></DialogActions>
            </Dialog>

            {/* 成功提示 */}
            <Snackbar open={showSuccess} autoHideDuration={3000} onClose={() => setShowSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setShowSuccess(false)} severity="success" variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    操作成功！
                </Alert>
            </Snackbar>

            {/* 配置管理弹窗 */}
            <Dialog 
                open={configOpen} 
                onClose={() => setConfigOpen(false)} 
                maxWidth="md" 
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, minHeight: '50vh' } }}
            >
                <DialogTitle sx={{ bgcolor: theme.palette.grey[50], borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SettingsSuggestIcon color="primary" />
                        常用人员配置模板
                    </Box>
                    <Button onClick={() => setConfigOpen(false)} color="inherit">关闭</Button>
                </DialogTitle>

                <DialogContent sx={{ mt: 2 }}>
                    <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: theme.palette.primary.light + '08', borderColor: theme.palette.primary.main }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                            将当前活动列表保存为新模板：
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField 
                                label="新配置名称 (如: 周末球局)" 
                                size="small" 
                                fullWidth 
                                value={newConfigName}
                                onChange={(e) => setNewConfigName(e.target.value)}
                            />
                            <Button 
                                variant="contained" 
                                onClick={handleSaveCurrentAsConfig}
                                disabled={!newConfigName.trim()}
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                保存当前
                            </Button>
                        </Box>
                    </Paper>

                    <Divider sx={{ mb: 2 }}>已保存的模板 ({configs.length})</Divider>

                    {configs.length === 0 ? (
                        <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                            暂无保存的配置模板
                        </Typography>
                    ) : (
                        configs.map((config) => (
                            <Accordion 
                                key={config.id} 
                                expanded={editingConfigId === config.id}
                                onChange={handleAccordionChange(config.id, config)}
                                disableGutters
                                sx={{ 
                                    mb: 1, 
                                    border: `1px solid ${theme.palette.divider}`, 
                                    borderRadius: '8px !important',
                                    '&:before': { display: 'none' },
                                    boxShadow: 'none'
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', pr: 2 }}>
                                        <Typography fontWeight="bold">{config.name}</Typography>
                                        <Box>
                                            <Chip size="small" label={`${config.persons.length} 人`} sx={{ mr: 1 }} />
                                            {/* ⭐ 修改：删除按钮点击事件 */}
                                            <IconButton 
                                                size="small" 
                                                color="error"
                                                onClick={(e) => handleDeleteConfigClick(e, config.id)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                
                                <AccordionDetails sx={{ bgcolor: theme.palette.grey[50], borderTop: `1px solid ${theme.palette.divider}` }}>
                                    {editingConfigData && (
                                        <>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    可在此直接修改模板内容，点击保存生效。
                                                </Typography>
                                                <Box>
                                                    <Button 
                                                        variant="contained" 
                                                        color="secondary" 
                                                        size="small"
                                                        startIcon={<CloudDownloadIcon />}
                                                        onClick={() => handleImportConfig(editingConfigData.persons)}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        导入此配置到活动
                                                    </Button>
                                                    <Button 
                                                        variant="outlined" 
                                                        size="small"
                                                        startIcon={<EditIcon />}
                                                        onClick={() => handleUpdateConfig(config.id)}
                                                    >
                                                        保存修改
                                                    </Button>
                                                </Box>
                                            </Box>

                                            <Table size="small" sx={{ bgcolor: 'white' }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>名字</TableCell>
                                                        <TableCell width="100px">权重</TableCell>
                                                        <TableCell width="60px">操作</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {editingConfigData.persons.map((p, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>
                                                                <TextField 
                                                                    value={p.name} 
                                                                    size="small" 
                                                                    variant="standard" 
                                                                    fullWidth 
                                                                    onChange={(e) => handleConfigPersonChange(idx, 'name', e.target.value)}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <TextField 
                                                                    value={p.weight} 
                                                                    type="number"
                                                                    size="small" 
                                                                    variant="standard" 
                                                                    onChange={(e) => handleConfigPersonChange(idx, 'weight', e.target.value)}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="default"
                                                                    onClick={() => handleRemovePersonFromConfig(idx)}
                                                                >
                                                                    <RemoveCircleOutlineIcon fontSize="small" />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>

                                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={handleAddPersonToConfig}
                                                    sx={{ color: theme.palette.text.secondary }}
                                                >
                                                    添加新成员
                                                </Button>
                                            </Box>
                                        </>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        ))
                    )}
                </DialogContent>
            </Dialog>

            {/* ⭐⭐⭐ 新增：删除配置确认弹窗 ⭐⭐⭐ */}
            <Dialog 
                open={!!deleteConfigId} 
                onClose={() => setDeleteConfigId(null)}
                PaperProps={{ sx: { borderRadius: 2, padding: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    删除配置模板
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        您确定要永久删除 <strong>{configToDeleteName}</strong> 模板吗？
                        <br/>此操作无法撤销。
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfigId(null)} color="inherit">
                        取消
                    </Button>
                    <Button onClick={handleConfirmDeleteConfig} color="error" variant="contained">
                        删除
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}