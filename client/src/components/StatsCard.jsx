import { 
    Card, 
    CardContent, 
    Typography, 
    Table, 
    TableBody, 
    TableCell, 
    TableRow, 
    Grid, 
    useTheme,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    IconButton,
    Box
} from "@mui/material";
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useState } from "react";

export default function StatsCard({ stats, isMobile }) {
    const theme = useTheme();
    const [openPlan, setOpenPlan] = useState(false);
    const [transferPlan, setTransferPlan] = useState([]);

    if (!stats) return null;

    // 格式化金额
    const formatAmount = (num) => `￥${Number(num).toFixed(2)}`;

    // ⭐ 核心算法：生成最小转账列表
    const generatePlan = () => {
        let debtors = [];
        let creditors = [];

        // 1. 计算每个人的净余额，并分类
        stats.persons.forEach(p => {
            // 余额 = 已支付 - 应支付
            const balance = Number(p.total_spent) - Number(p.should_pay);
            // 这里为了计算方便，保留2位小数精度，防止浮点数误差
            const val = Math.round(balance * 100) / 100;

            if (val < -0.01) {
                debtors.push({ name: p.name, amount: val }); // amount 是负数
            } else if (val > 0.01) {
                creditors.push({ name: p.name, amount: val }); // amount 是正数
            }
        });

        // 2. 排序：按绝对值从大到小排序（贪心策略：优先解决大额）
        debtors.sort((a, b) => a.amount - b.amount); // 负数越小，绝对值越大，升序排列即可 (e.g. -100, -50)
        creditors.sort((a, b) => b.amount - a.amount); // 正数越大，绝对值越大，降序

        const transactions = [];
        let i = 0; // debtor index
        let j = 0; // creditor index

        // 3. 双指针匹配
        while (i < debtors.length && j < creditors.length) {
            let debtor = debtors[i];
            let creditor = creditors[j];

            // 欠款绝对值 vs 收款绝对值
            let debitAmt = Math.abs(debtor.amount);
            let creditAmt = creditor.amount;

            // 找出本次能转的最小金额（要么还清，要么收满）
            let transferAmount = Math.min(debitAmt, creditAmt);
            
            // 记录转账
            if (transferAmount > 0) {
                transactions.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: transferAmount
                });
            }

            // 更新余额
            debtor.amount += transferAmount;
            creditor.amount -= transferAmount;

            // 处理精度问题
            debtor.amount = Math.round(debtor.amount * 100) / 100;
            creditor.amount = Math.round(creditor.amount * 100) / 100;

            // 如果欠款人还清了，处理下一个欠款人
            if (Math.abs(debtor.amount) < 0.01) {
                i++;
            }
            // 如果收款人收满了，处理下一个收款人
            if (Math.abs(creditor.amount) < 0.01) {
                j++;
            }
        }

        setTransferPlan(transactions);
        setOpenPlan(true);
    };

    return (
        <>
            <Card 
                elevation={5} 
                sx={{ 
                    my: isMobile ? 2 : 4, 
                    borderRadius: 3, 
                    border: `2px solid ${theme.palette.secondary.main}`, 
                    background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
                    color: '#fff',
                    position: 'relative',
                    overflow: 'visible' // 允许按钮浮出一点
                }}
            >
                <CardContent>
                    <Grid container spacing={isMobile ? 1 : 2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700 }}>
                                🚀 总支出：
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            <Typography variant={isMobile ? "h4" : "h3"} component="div" sx={{ fontWeight: 900, color: 'white' }}>
                                {formatAmount(stats.totalExpense)}
                            </Typography>
                        </Grid>
                    </Grid>

                    {/* ⭐ 新增：推荐转账方案按钮 */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                         <Button 
                            variant="contained" 
                            color="secondary" // 使用次级色（如粉色/橙色）形成对比
                            startIcon={<CurrencyExchangeIcon />}
                            onClick={generatePlan}
                            sx={{ 
                                borderRadius: 4, 
                                fontWeight: 'bold',
                                boxShadow: theme.shadows[4],
                                background: 'white',
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    background: '#f0f0f0'
                                }
                            }}
                         >
                             查看最佳平账方案
                         </Button>
                    </Box>
                </CardContent>
                
                <CardContent sx={{ bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, pt: isMobile ? 1 : 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        结算详情
                    </Typography>
                    <Table size={isMobile ? "small" : "medium"}>
                        <TableBody>
                            {stats.persons.map((p) => {
                                // 修正后的余额计算
                                const balance = Number(p.total_spent) - Number(p.should_pay);
                                
                                const balanceColor = balance > 0.01
                                    ? theme.palette.success.main 
                                    : balance < -0.01
                                        ? theme.palette.error.main 
                                        : theme.palette.text.secondary;

                                return (
                                    <TableRow key={p.person_id} sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell sx={{ fontWeight: 600, width: '30%' }}>{p.name}</TableCell>
                                        <TableCell sx={{ color: theme.palette.text.secondary }}>
                                            总付: {formatAmount(p.total_spent)}
                                        </TableCell>
                                        <TableCell sx={{ width: '30%', fontWeight: 'bold' }}>
                                            总结算: 
                                            <span style={{ color: balanceColor, marginLeft: '8px' }}>
                                                {formatAmount(balance)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ⭐⭐⭐ 弹窗：展示转账方案 ⭐⭐⭐ */}
            <Dialog 
                open={openPlan} 
                onClose={() => setOpenPlan(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: theme.palette.primary.main, color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CurrencyExchangeIcon />
                        <Typography variant="h6">最佳平账方案</Typography>
                    </Box>
                    <IconButton onClick={() => setOpenPlan(false)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {transferPlan.length === 0 ? (
                        <Typography align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            所有账目已平，无需转账 🎉
                        </Typography>
                    ) : (
                        <List>
                            {transferPlan.map((t, index) => (
                                <ListItem 
                                    key={index} 
                                    sx={{ 
                                        mb: 1, 
                                        bgcolor: theme.palette.grey[50], 
                                        borderRadius: 2, 
                                        border: `1px solid ${theme.palette.grey[200]}` 
                                    }}
                                >
                                    {/* 支付方 */}
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: theme.palette.error.dark, color: theme.palette.error.contrastText, width: 32, height: 32, fontSize: 14 }}>
                                            付
                                        </Avatar>
                                    </ListItemAvatar>
                                    
                                    {/* 详情 */}
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {t.from}
                                                </Typography>
                                                <ArrowForwardIcon color="action" fontSize="small" />
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {t.to}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary="点击复制或扫码 (需后续开发)"
                                    />
                                    
                                    {/* 金额 */}
                                    <Typography variant="h6" color="primary" fontWeight="bold">
                                        {formatAmount(t.amount)}
                                    </Typography>
                                </ListItem>
                            ))}
                        </List>
                    )}
                    <Typography variant="caption" display="block" align="center" sx={{ color: 'text.secondary', mt: 2 }}>
                        * 算法已自动优化转账路径，以最少交易次数结清账单。
                    </Typography>
                </DialogContent>
            </Dialog>
        </>
    );
}