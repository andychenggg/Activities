const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'db', 'database.sqlite');

// 初始化数据库
const db = new Database(dbPath);

// 读取 schema.sql 并执行
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

function ensureUser({ username, password, role }) {
    const existing = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username);
    if (existing) return;

    const hashed = bcrypt.hashSync(password, 10);
    db.prepare(`
        INSERT INTO users (username, password, role)
        VALUES (?, ?, ?)
    `).run(username, hashed, role);
    console.log(`Initialized default user ${username}/${password} (${role})`);
}

// 初始化默认用户（从外部 JSON 文件导入）
const seedPath = process.env.USERS_SEED_PATH || path.join(__dirname, 'users.seed.json');
if (fs.existsSync(seedPath)) {
    try {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        if (Array.isArray(seedData)) {
            seedData.forEach(item => {
                if (!item || !item.username || !item.password) return;
                ensureUser({
                    username: item.username,
                    password: item.password,
                    role: item.role || 'user'
                });
            });
        } else {
            console.warn(`用户种子文件不是数组: ${seedPath}`);
        }
    } catch (err) {
        console.error(`读取用户种子文件失败: ${seedPath}`, err);
    }
} else {
    console.log(`未找到用户种子文件，跳过初始化: ${seedPath}`);
}


module.exports = db;
