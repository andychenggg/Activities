import { useEffect, useState, useMemo } from "react";
import { api } from "../api/api";
import {
    Box,
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    useMediaQuery,
    Divider,
    Chip,
    Alert,
    CircularProgress
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StatsCard from "../components/StatsCard";

function buildStats(persons, expenses) {
    const personTotals = {};
    persons.forEach(p => { personTotals[p.id] = 0; });
    expenses.forEach(e => {
        if (personTotals[e.person_id] === undefined) personTotals[e.person_id] = 0;
        personTotals[e.person_id] += Number(e.amount) || 0;
    });
    const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalWeight = persons.reduce((s, p) => s + (Number(p.weight) || 0), 0) || 1;
    const statsPersons = persons.map(p => {
        const total_spent = personTotals[p.id] || 0;
        const should_pay = totalExpense * ((Number(p.weight) || 0) / totalWeight);
        return { person_id: p.id, name: p.name, total_spent, should_pay };
    });
    return { totalExpense, persons: statsPersons };
}

export default function PublicShare({ token }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [data, setData] = useState(null);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // 允许分享页全局滚动，退出时恢复
    useEffect(() => {
        const prevBodyOverflow = document.body.style.overflow;
        const prevHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";
        return () => {
            document.body.style.overflow = prevBodyOverflow;
            document.documentElement.style.overflow = prevHtmlOverflow;
        };
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.getSharedActivity(token);
                setData(res.data);
                setStats(buildStats(res.data.persons, res.data.expenses));
            } catch (e) {
                console.error(e);
                const msg = e?.response?.data?.error || "链接不可用或已过期";
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [token]);

    const expiresLabel = useMemo(() => {
        if (!data?.expires_at) return "";
        const date = new Date(data.expires_at);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleString();
    }, [data]);

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !data) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>{error || "无法加载分享内容"}</Alert>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #0f172a 0%, #111827 50%, #0b1224 100%)",
                color: "#fff",
                py: isMobile ? 2 : 4,
                px: isMobile ? 1.5 : 3
            }}
        >
            <Container maxWidth="lg">
                <Paper
                    elevation={8}
                    sx={{
                        p: isMobile ? 2 : 3,
                        mb: isMobile ? 3 : 4,
                        borderRadius: 3,
                        background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.25))",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#fff"
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LockOpenIcon />
                        <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800}>
                            {data.activity.name}
                        </Typography>
                        <Chip
                            label="只读分享"
                            size="small"
                            sx={{ ml: 1, bgcolor: "rgba(255,255,255,0.15)", color: "#fff" }}
                        />
                    </Box>
                    {expiresLabel && (
                        <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1, color: "rgba(255,255,255,0.7)" }}>
                            <AccessTimeIcon fontSize="small" /> 有效期至：{expiresLabel}
                        </Typography>
                    )}
                    <Typography variant="body2" sx={{ mt: 1, color: "rgba(255,255,255,0.7)" }}>
                        本页面仅用于查看，无法编辑或添加数据。
                    </Typography>
                </Paper>

                <StatsCard stats={stats} isMobile={isMobile} />

                <Paper
                    elevation={3}
                    sx={{
                        p: isMobile ? 2 : 3,
                        mb: isMobile ? 3 : 4,
                        borderRadius: 3,
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#fff"
                    }}
                >
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                        👥 人员与权重
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.1)" }} />
                    <Table size={isMobile ? "small" : "medium"}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: "#e5e7eb", fontWeight: 700 }}>姓名</TableCell>
                                <TableCell sx={{ color: "#e5e7eb", fontWeight: 700 }}>权重</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.persons.map((p) => (
                                <TableRow key={p.id} sx={{ "&:nth-of-type(odd)": { backgroundColor: "rgba(255,255,255,0.02)" } }}>
                                    <TableCell sx={{ color: "#fff" }}>{p.name}</TableCell>
                                    <TableCell sx={{ color: "#fff" }}>{p.weight}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>

                <Paper
                    elevation={3}
                    sx={{
                        p: isMobile ? 2 : 3,
                        mb: isMobile ? 3 : 4,
                        borderRadius: 3,
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#fff"
                    }}
                >
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                        🧾 支出记录
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.1)" }} />
                    <Table size={isMobile ? "small" : "medium"}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: "#e5e7eb", fontWeight: 700 }}>人员</TableCell>
                                <TableCell sx={{ color: "#e5e7eb", fontWeight: 700 }}>金额</TableCell>
                                <TableCell sx={{ color: "#e5e7eb", fontWeight: 700 }}>备注</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.expenses.map((e) => (
                                <TableRow key={e.id} sx={{ "&:nth-of-type(odd)": { backgroundColor: "rgba(255,255,255,0.02)" } }}>
                                    <TableCell sx={{ color: "#fff" }}>{data.persons.find(p => p.id === e.person_id)?.name || "未知"}</TableCell>
                                    <TableCell sx={{ color: "#10b981", fontWeight: 700 }}>￥{Number(e.amount).toFixed(2)}</TableCell>
                                    <TableCell sx={{ color: "rgba(255,255,255,0.8)" }}>{e.note || "—"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            </Container>
        </Box>
    );
}
