const express = require('express');
const cors = require('cors');
const db = require('./db');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const corsOptions = {
    origin: true,   // 前端地址
    credentials: true,                 // ⭐允许发送 cookie
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// 登录
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = db.prepare(`
        SELECT * FROM users WHERE username = ?
    `).get(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: "用户名或密码错误" });
    }

    // 简单的会话 token——这里用 user.id 最简单
    res.cookie("session", user.id, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 一周
        sameSite: 'lax',  // 👈 改这里
    });

    res.json({ success: true, role: user.role || 'user' });
});

app.post('/logout', (req, res) => {
    res.clearCookie("session");
    res.json({ success: true });
});

// 会话/角色检查
app.get('/auth/status', (req, res) => {
    if (!req.cookies.session) {
        return res.json({ authenticated: false, role: null });
    }
    const user = db.prepare(`SELECT id, username, role FROM users WHERE id = ?`).get(req.cookies.session);
    if (!user) {
        res.clearCookie("session");
        return res.json({ authenticated: false, role: null });
    }
    res.json({ authenticated: true, id: user.id, username: user.username, role: user.role });
});

// 获取当前用户信息
app.get('/me', requireLogin, (req, res) => {
    const user = db.prepare(`SELECT id, username, role FROM users WHERE id = ?`).get(req.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });
    res.json(user);
});

/* ======================================================
   ADMIN API
   ====================================================== */

// 重置用户密码（管理员）
app.post('/admin/users/reset-password', requireLogin, requireAdmin, (req, res) => {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
        return res.status(400).json({ error: "缺少用户名或新密码" });
    }

    const user = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username);
    if (!user) {
        return res.status(404).json({ error: "用户不存在" });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.prepare(`UPDATE users SET password = ? WHERE id = ?`).run(hashed, user.id);
    res.json({ success: true });
});

// 创建普通用户（管理员）
app.post('/admin/users', requireLogin, requireAdmin, (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "缺少用户名或密码" });
    }

    const hashed = bcrypt.hashSync(password, 10);
    try {
        const result = db.prepare(`
            INSERT INTO users (username, password, role)
            VALUES (?, ?, 'user')
        `).run(username, hashed);
        res.json({ success: true, id: result.lastInsertRowid, role: 'user' });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: "用户名已存在" });
        }
        console.error(err);
        res.status(500).json({ error: "创建用户失败" });
    }
});

function requireLogin(req, res, next) {
    if (!req.cookies.session) {
        return res.status(401).json({ error: "未登录" });
    }

    req.userId = parseInt(req.cookies.session); // 👈 保存当前用户ID
    next();
}

function requireAdmin(req, res, next) {
    const user = db.prepare(`SELECT id, role FROM users WHERE id = ?`).get(req.userId);
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: "需要管理员权限" });
    }
    req.currentUser = user;
    next();
}



/* ======================================================
   ACTIVITIES API
   ====================================================== */

// 获取全部活动
// 获取全部活动（动态计算人数）
app.get('/activities', requireLogin, (req, res) => {
    const activities = db.prepare(`
        SELECT
            a.*,
            (
                SELECT COUNT(*)
                FROM persons p
                WHERE p.activity_id = a.id
            ) AS num_people
        FROM activities a
        WHERE a.owner_id = ?
        ORDER BY a.created_at DESC
    `).all(req.userId);

    res.json(activities);
});



// 创建活动
app.post('/activities', requireLogin, (req, res) => {
    const { name } = req.body;

    const stmt = db.prepare(`
        INSERT INTO activities (name, owner_id)
        VALUES (?, ?)
    `);

    const result = stmt.run(name, req.userId);
    res.json({ id: result.lastInsertRowid });
});


// 删除活动（级联删除人员与支出）
app.delete('/activities/:id', requireLogin, (req, res) => {
    const stmt = db.prepare(`
        DELETE FROM activities
        WHERE id = ? AND owner_id = ?
    `);

    const result = stmt.run(req.params.id, req.userId);

    if (result.changes === 0) {
        return res.status(403).json({ error: "无权限删除" });
    }

    res.json({ success: true });
});

// 修改活动名称  <-- 新增接口
app.put('/activities/:id', requireLogin, (req, res) => {
    const { name } = req.body;
    const activityId = req.params.id;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: "活动名称不能为空" });
    }

    const stmt = db.prepare(`
        UPDATE activities
        SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND owner_id = ?
    `);

    const result = stmt.run(name.trim(), activityId, req.userId);

    if (result.changes === 0) {
        return res.status(404).json({ error: "未找到活动或无权限修改" });
    }

    res.json({ success: true });
});


// 获取活动详情（metadata + persons + expenses）
app.get('/activities/:id', requireLogin, (req, res) => {
    const id = req.params.id;

    const activity = db.prepare(`
        SELECT * FROM activities
        WHERE id = ? AND owner_id = ?
    `).get(id, req.userId);

    if (!activity) return res.status(404).json({ error: "Activity not found or no permission" });

    const persons = db.prepare(`
        SELECT * FROM persons WHERE activity_id = ?
    `).all(id);

    const expenses = db.prepare(`
        SELECT * FROM expenses WHERE activity_id = ?
    `).all(id);

    res.json({ activity, persons, expenses });
});

// 创建活动的公开查看链接（指定有效天数）
app.post('/activities/:id/share', requireLogin, (req, res) => {
    const activityId = req.params.id;
    const { validDays } = req.body;
    const days = parseInt(validDays, 10);
    if (!days || days <= 0 || days > 365) {
        return res.status(400).json({ error: "有效期天数必须在 1-365 之间" });
    }

    const owned = db.prepare(`SELECT id FROM activities WHERE id = ? AND owner_id = ?`).get(activityId, req.userId);
    if (!owned) return res.status(403).json({ error: "无权限或活动不存在" });

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    db.prepare(`
        INSERT INTO share_links (activity_id, token, expires_at)
        VALUES (?, ?, ?)
    `).run(activityId, token, expiresAt.toISOString());

    res.json({
        token,
        expires_at: expiresAt.toISOString()
    });
});

// 公共查看：根据 token 返回活动（只读）
app.get('/public/activities/:token', (req, res) => {
    const { token } = req.params;
    const link = db.prepare(`
        SELECT activity_id, expires_at
        FROM share_links
        WHERE token = ?
    `).get(token);

    if (!link) return res.status(404).json({ error: "链接不存在" });

    const now = new Date();
    const expires = new Date(link.expires_at);
    if (isNaN(expires.getTime()) || now > expires) {
        return res.status(410).json({ error: "链接已过期" });
    }

    const activity = db.prepare(`
        SELECT * FROM activities WHERE id = ?
    `).get(link.activity_id);
    if (!activity) return res.status(404).json({ error: "活动不存在" });

    const persons = db.prepare(`SELECT * FROM persons WHERE activity_id = ?`).all(link.activity_id);
    const expenses = db.prepare(`SELECT * FROM expenses WHERE activity_id = ?`).all(link.activity_id);

    res.json({
        activity,
        persons,
        expenses,
        expires_at: link.expires_at
    });
});

/* ======================================================
   CONFIGS (TEMPLATES) API  <-- 新增部分
   ====================================================== */

// 获取所有配置（包含里面的人员列表）
app.get('/configs', requireLogin, (req, res) => {
    // 1. 获取该用户的所有配置
    const configs = db.prepare(`
        SELECT * FROM configs 
        WHERE owner_id = ? 
        ORDER BY created_at DESC
    `).all(req.userId);

    // 2. 为每个配置获取详细人员名单
    // (由于配置数量通常不多，这里用循环查询简单直接)
    const getPersonsStmt = db.prepare(`SELECT * FROM config_persons WHERE config_id = ?`);

    for (const config of configs) {
        config.persons = getPersonsStmt.all(config.id);
    }

    res.json(configs);
});

// 创建新配置
app.post('/configs', requireLogin, (req, res) => {
    const { name, persons } = req.body; // persons 应该是 [{name: 'A', weight: 1}, ...]

    if (!name) return res.status(400).json({ error: "配置名称不能为空" });

    // 使用事务确保同时插入配置和人员
    const createTransaction = db.transaction((configName, personList) => {
        // 1. 插入配置头
        const result = db.prepare(`
            INSERT INTO configs (name, owner_id) VALUES (?, ?)
        `).run(configName, req.userId);
        
        const configId = result.lastInsertRowid;

        // 2. 插入所有人员
        const insertPerson = db.prepare(`
            INSERT INTO config_persons (config_id, name, weight) VALUES (?, ?, ?)
        `);
        
        if (personList && Array.isArray(personList)) {
            for (const p of personList) {
                insertPerson.run(configId, p.name, Number(p.weight) || 1);
            }
        }
        return configId;
    });

    try {
        const newId = createTransaction(name, persons);
        res.json({ id: newId, success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "创建配置失败" });
    }
});

// 删除配置
app.delete('/configs/:id', requireLogin, (req, res) => {
    const stmt = db.prepare(`DELETE FROM configs WHERE id = ? AND owner_id = ?`);
    const result = stmt.run(req.params.id, req.userId);
    
    if (result.changes === 0) return res.status(404).json({ error: "未找到配置或无权限" });
    res.json({ success: true });
});

// 更新配置 (采用全量替换人员的策略)
app.put('/configs/:id', requireLogin, (req, res) => {
    const configId = req.params.id;
    const { name, persons } = req.body;

    // 验证所有权
    const existing = db.prepare(`SELECT id FROM configs WHERE id = ? AND owner_id = ?`).get(configId, req.userId);
    if (!existing) return res.status(404).json({ error: "未找到配置或无权限" });

    const updateTransaction = db.transaction(() => {
        // 1. 更新名称
        db.prepare(`UPDATE configs SET name = ? WHERE id = ?`).run(name, configId);

        // 2. 删除旧的人员 (Wipe)
        db.prepare(`DELETE FROM config_persons WHERE config_id = ?`).run(configId);

        // 3. 插入新的人员 (Replace)
        const insertPerson = db.prepare(`
            INSERT INTO config_persons (config_id, name, weight) VALUES (?, ?, ?)
        `);
        
        if (persons && Array.isArray(persons)) {
            for (const p of persons) {
                insertPerson.run(configId, p.name, Number(p.weight) || 1);
            }
        }
    });

    try {
        updateTransaction();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "更新失败" });
    }
});

/* ======================================================
   BATCH IMPORT API (优化功能)
   ====================================================== */

// 批量添加人员到活动 (用于从配置导入时，一次性写入)
app.post('/activities/:id/persons/batch', requireLogin, (req, res) => {
    const activityId = req.params.id;
    const { persons } = req.body; // Expect: [{name: 'xx', weight: 1}, ...]

    // 验证活动权限
    const activity = db.prepare(`SELECT id FROM activities WHERE id = ? AND owner_id = ?`).get(activityId, req.userId);
    if (!activity) return res.status(403).json({ error: "无权限" });

    if (!persons || !Array.isArray(persons) || persons.length === 0) {
        return res.json({ success: true, count: 0 }); // 没什么可加的
    }

    const batchInsert = db.transaction(() => {
        const stmt = db.prepare(`
            INSERT INTO persons (activity_id, name, weight)
            VALUES (?, ?, ?)
        `);
        for (const p of persons) {
            stmt.run(activityId, p.name, Number(p.weight) || 1);
        }
    });

    try {
        batchInsert();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "批量导入失败" });
    }
});

/* ======================================================
   PERSONS API
   ====================================================== */

// 添加人员
app.post('/activities/:id/persons', requireLogin, (req, res) => {
    const { name, weight = 1 } = req.body;

    const stmt = db.prepare(`
        INSERT INTO persons (activity_id, name, weight)
        VALUES (?, ?, ?)
    `);

    const result = stmt.run(req.params.id, name, weight);
    res.json({ id: result.lastInsertRowid });
});

// 更新人员信息（名字或权重）
app.put('/persons/:id', requireLogin, (req, res) => {
    const { name, weight } = req.body;

    const stmt = db.prepare(`
        UPDATE persons
        SET name = ?, weight = ?
        WHERE id = ?
    `);

    stmt.run(name, weight, req.params.id);
    res.json({ success: true });
});

// 删除人员（级联删除 TA 的支出）
app.delete('/persons/:id', requireLogin, (req, res) => {
    db.prepare(`DELETE FROM persons WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
});

/* ======================================================
   EXPENSES API
   ====================================================== */

// 添加支出
app.post('/activities/:id/expenses', requireLogin, (req, res) => {
    const { person_id, amount, note } = req.body;

    const stmt = db.prepare(`
        INSERT INTO expenses (activity_id, person_id, amount, note)
        VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(req.params.id, person_id, amount, note || "");
    res.json({ id: result.lastInsertRowid });
});

// 删除支出
app.delete('/expenses/:id', requireLogin, (req, res) => {
    db.prepare(`DELETE FROM expenses WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
});

// 修改支出
app.put('/expenses/:id', requireLogin, (req, res) => {
    const expenseId = req.params.id;
    const { person_id, amount, note } = req.body;

    const personIdNum = Number(person_id);
    const amountNum = Number(amount);
    if (!personIdNum || isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: "参数错误" });
    }

    const expense = db.prepare(`
        SELECT e.id, e.activity_id
        FROM expenses e
        JOIN activities a ON a.id = e.activity_id
        WHERE e.id = ? AND a.owner_id = ?
    `).get(expenseId, req.userId);

    if (!expense) {
        return res.status(404).json({ error: "支出不存在或无权限" });
    }

    db.prepare(`
        UPDATE expenses
        SET person_id = ?, amount = ?, note = ?
        WHERE id = ?
    `).run(personIdNum, amountNum, note || "", expenseId);

    res.json({ success: true });
});

/* ======================================================
   STATISTICS API
   ====================================================== */

// 获取某活动的所有统计值（核心）
app.get('/activities/:id/stats', requireLogin, (req, res) => {
    const activity_id = req.params.id;

    const activity = db.prepare(`
        SELECT * FROM activities
        WHERE id = ? AND owner_id = ?
    `).get(activity_id, req.userId);

    if (!activity) return res.status(404).json({ error: "无权限访问" });

    // 获取人员
    const persons = db.prepare(`
        SELECT * FROM persons WHERE activity_id = ?
    `).all(activity_id);

    // 获取支出
    const expenses = db.prepare(`
        SELECT * FROM expenses WHERE activity_id = ?
    `).all(activity_id);

    // 计算个人总支出
    const personTotals = {};
    for (const p of persons) {
        personTotals[p.id] = 0;
    }
    for (const e of expenses) {
        personTotals[e.person_id] += e.amount;
    }

    // 总支出
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

    // 权重总和
    const totalWeight = persons.reduce((s, p) => s + p.weight, 0);

    // 计算每人应支付金额/应收金额
    const results = persons.map((p) => {
        const payShould = totalExpense * (p.weight / totalWeight);
        const personTotal = personTotals[p.id];
        const recvShould = personTotal - payShould;

        return {
            person_id: p.id,
            name: p.name,
            weight: p.weight,
            total_spent: personTotal,
            should_pay: payShould,
            should_receive: recvShould
        };
    });

    res.json({
        totalExpense,
        totalWeight,
        persons: results
    });
});

/* ======================================================
   SERVER START
   ====================================================== */

app.get('/', (req, res) => res.send("Accounting API is running."));

app.listen(3001, () => {
    console.log("Server running at http://localhost:3001");
});
