import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    TextField,
    Button,
    MenuItem,
    useTheme,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Box,
    Typography,
    Snackbar,
    Alert
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import WarningIcon from '@mui/icons-material/Warning';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import ListIcon from '@mui/icons-material/List';
import { useState, useEffect, useRef } from "react"; // ⭐ 引入 useRef, useEffect
import { api } from "../api/api";

export default function ExpenseTable({ expenses, people, refresh, activity_id, isMobile }) {
    const theme = useTheme();

    // --- 状态管理 ---
    
    const [newEntries, setNewEntries] = useState([
        { id: Date.now(), personId: "", amount: "", note: "" }
    ]);

    // ⭐ 1. 焦点控制 Refs
    const amountInputRefs = useRef([]); // 存储所有金额输入框的 DOM 引用
    const shouldFocusRef = useRef(false); // 标记是否需要触发自动聚焦

    const [deleteId, setDeleteId] = useState(null);
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
    const [submitSummary, setSubmitSummary] = useState({ total: 0, count: 0, samePerson: true });
    const [errorMsg, setErrorMsg] = useState("");
    const [showError, setShowError] = useState(false);

    // --- Effect: 监听行数变化，自动聚焦 ---
    useEffect(() => {
        // 如果标记为需要聚焦，且 refs 中有对应的元素
        if (shouldFocusRef.current) {
            const lastIndex = newEntries.length - 1;
            const targetInput = amountInputRefs.current[lastIndex];
            
            if (targetInput) {
                targetInput.focus(); // ⭐ 执行聚焦
            }
            shouldFocusRef.current = false; // 重置标记
        }
    }, [newEntries]);

    // --- 逻辑处理 ---

    const handleEntryChange = (index, field, value) => {
        const updatedEntries = [...newEntries];
        updatedEntries[index][field] = value;
        setNewEntries(updatedEntries);
    };

    const handleAmountKeyDown = (e, index) => {
        if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            
            const currentEntry = newEntries[index];
            const amountVal = Number(currentEntry.amount);

            if (currentEntry.amount !== "" && (isNaN(amountVal) || amountVal < 0)) {
                setErrorMsg("金额必须为有效的正数");
                setShowError(true);
                return;
            }

            if (index === newEntries.length - 1) {
                setNewEntries([
                    ...newEntries,
                    { 
                        id: Date.now(), 
                        personId: currentEntry.personId, 
                        amount: "", 
                        note: "" 
                    }
                ]);
                shouldFocusRef.current = true; // ⭐ 标记：渲染完成后需要聚焦
            }
        }
    };

    const removeEntryRow = (index) => {
        if (newEntries.length === 1) {
            setNewEntries([{ id: Date.now(), personId: "", amount: "", note: "" }]);
        } else {
            const updated = newEntries.filter((_, i) => i !== index);
            setNewEntries(updated);
        }
    };

    const handlePreSubmit = () => {
        const validEntries = newEntries.filter(e => e.personId && Number(e.amount) > 0);

        if (validEntries.length === 0) {
            setErrorMsg("请输入有效的付款人和金额");
            setShowError(true);
            return;
        }

        // 只有一条时，直接提交，不弹选择
        if (validEntries.length === 1) {
            const e = validEntries[0];
            api.addExpense(activity_id, Number(e.personId), Number(e.amount), e.note || "")
                .then(() => resetForm())
                .catch(() => {
                    setErrorMsg("提交失败，请重试");
                    setShowError(true);
                });
            return;
        }

        const total = validEntries.reduce((sum, e) => sum + Number(e.amount), 0);
        const firstPerson = validEntries[0].personId;
        const allSamePerson = validEntries.every(e => e.personId === firstPerson);

        setSubmitSummary({
            total: total,
            count: validEntries.length,
            samePerson: allSamePerson,
            data: validEntries
        });

        setSubmitDialogOpen(true);
    };

    // 方式A：合并提交
    const submitMerged = async () => {
        const { data, total, count } = submitSummary; // ⭐ 解构出 count
        const personId = data[0].personId;
        
        // ⭐ 3. 修改备注格式：增加“共X笔”前缀
        const details = data
            .map(e => e.note ? `${e.note} (￥${e.amount})` : `￥${e.amount}`)
            .join("; ");
            
        const finalNote = `【共${count}笔】 ${details}`; // 最终拼接

        await api.addExpense(activity_id, Number(personId), Number(total), finalNote);
        resetForm();
    };

    // 方式B：分别提交
    const submitSeparately = async () => {
        const { data } = submitSummary;
        await Promise.all(data.map(e => 
            api.addExpense(activity_id, Number(e.personId), Number(e.amount), e.note)
        ));
        resetForm();
    };

    const resetForm = () => {
        setSubmitDialogOpen(false);
        setNewEntries([{ id: Date.now(), personId: "", amount: "", note: "" }]);
        shouldFocusRef.current = true; // 重置后聚焦到第一行
        refresh();
    };

    const handleDeleteClick = (id) => setDeleteId(id);
    const confirmDelete = async () => {
        if (deleteId) {
            await api.deleteExpense(deleteId);
            refresh();
            setDeleteId(null);
        }
    };
    const cancelDelete = () => setDeleteId(null);
    const formatAmount = (num) => `￥${Number(num).toFixed(2)}`;
    const expenseToDelete = expenses.find(e => e.id === deleteId);
    const personName = expenseToDelete ? people.find(p => p.id === expenseToDelete.person_id)?.name : "";

    return (
        <>
            <Table sx={{ my: 2, minWidth: isMobile ? 500 : 650 }}>
                <TableHead sx={{ bgcolor: theme.palette.secondary.light + '20' }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>💸 人员</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>金额</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>说明/备注</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '110px' }}>操作</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {/* 历史记录 */}
                    {expenses.map((e) => (
                        <TableRow key={e.id} sx={{ '&:nth-of-type(odd)': { bgcolor: theme.palette.action.hover } }}>
                            <TableCell>{people.find((p) => p.id === e.person_id)?.name}</TableCell>
                            <TableCell sx={{ color: theme.palette.error.main, fontWeight: 'bold' }}>
                                {formatAmount(e.amount)}
                            </TableCell>
                            <TableCell sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                                {e.note || '无备注'}
                            </TableCell>
                            <TableCell>
                                <IconButton size="small" onClick={() => handleDeleteClick(e.id)} sx={{ color: theme.palette.error.main }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}

                    {/* 新增输入区域 */}
                    {newEntries.map((entry, index) => (
                        <TableRow 
                            key={entry.id} 
                            sx={{ 
                                bgcolor: theme.palette.success.light + '10',
                                borderBottom: index === newEntries.length - 1 ? 'none' : `1px dashed ${theme.palette.divider}`
                            }}
                        >
                            <TableCell>
                                <TextField
                                    select
                                    value={entry.personId}
                                    onChange={(e) => handleEntryChange(index, "personId", e.target.value)}
                                    label={index === 0 ? "谁支付的?" : ""}
                                    size="small"
                                    variant="outlined"
                                    sx={{ minWidth: 120 }}
                                >
                                    {people.map((p) => (
                                        <MenuItem key={p.id} value={p.id}>
                                            {p.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </TableCell>
                            <TableCell>
                                <TextField
                                    // ⭐ 绑定 ref
                                    inputRef={(el) => amountInputRefs.current[index] = el}
                                    type="number"
                                    label={index === 0 ? "金额" : ""}
                                    value={entry.amount}
                                    size="small"
                                    variant="outlined"
                                    sx={{ 
                                        minWidth: 80,
                                        "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
                                            "-webkit-appearance": "none",
                                            margin: 0,
                                        },
                                        "& input[type=number]": {
                                            "-moz-appearance": "textfield",
                                        },
                                    }}
                                    onChange={(e) => handleEntryChange(index, "amount", e.target.value)}
                                    onKeyDown={(e) => handleAmountKeyDown(e, index)}
                                    placeholder="Enter换行"
                                />
                            </TableCell>
                            <TableCell>
                                <TextField
                                    // ⭐ 2. 增加 placeholder，确保每行都有提示
                                    placeholder="备注 (可选)"
                                    value={entry.note}
                                    size="small"
                                    variant="outlined"
                                    onChange={(e) => handleEntryChange(index, "note", e.target.value)}
                                    sx={{ minWidth: 150 }}
                                />
                            </TableCell>
                            <TableCell>
                                {index === newEntries.length - 1 ? (
                                    <Button 
                                        variant="contained" 
                                        color="success"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={handlePreSubmit}
                                        sx={{ whiteSpace: 'nowrap' }}
                                    >
                                        结算
                                    </Button>
                                ) : (
                                    <IconButton 
                                        size="small" 
                                        onClick={() => removeEntryRow(index)}
                                        sx={{ color: theme.palette.text.disabled }}
                                    >
                                        <RemoveCircleOutlineIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* 删除确认弹窗 */}
            <Dialog open={!!deleteId} onClose={cancelDelete} PaperProps={{ sx: { borderRadius: 2, padding: 1 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" /> 删除支出记录
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        您确定要删除 <strong>{personName}</strong> 支付的 
                        <strong style={{ color: '#d32f2f', margin: '0 4px' }}>
                            {expenseToDelete && formatAmount(expenseToDelete.amount)}
                        </strong> 吗？
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete} color="inherit">取消</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">确认删除</Button>
                </DialogActions>
            </Dialog>

            {/* 提交方式确认弹窗 */}
            <Dialog 
                open={submitDialogOpen} 
                onClose={() => setSubmitDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 3, padding: 2, minWidth: 400 } }}
            >
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                    确认提交支出
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ my: 2, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">待提交笔数</Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                            {submitSummary.count} 笔
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>总金额</Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.success.main }}>
                            {formatAmount(submitSummary.total)}
                        </Typography>
                    </Box>
                    
                    {!submitSummary.samePerson && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            检测到包含不同的付款人，无法合并为一条记录，只能分别提交。
                        </Alert>
                    )}
                    
                    <DialogContentText sx={{ mt: 2, textAlign: 'center' }}>
                        您希望如何记录这些支出？
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
                    <Button 
                        onClick={submitSeparately} 
                        variant="outlined" 
                        color="primary"
                        startIcon={<ListIcon />}
                        size="large"
                    >
                        分别提交 ({submitSummary.count}条)
                    </Button>
                    <Button 
                        onClick={submitMerged} 
                        variant="contained" 
                        color="success"
                        startIcon={<CallMergeIcon />}
                        size="large"
                        disabled={!submitSummary.samePerson} 
                    >
                        合并提交 (1条)
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 错误提示 */}
            <Snackbar
                open={showError}
                autoHideDuration={3000}
                onClose={() => setShowError(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setShowError(false)} severity="error" variant="filled" sx={{ width: '100%' }}>
                    {errorMsg}
                </Alert>
            </Snackbar>
        </>
    );
}
