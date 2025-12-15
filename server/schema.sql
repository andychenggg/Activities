-- 活动表
CREATE TABLE IF NOT EXISTS activities (
                                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          name TEXT NOT NULL,
                                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                          owner_id INTEGER NOT NULL
);


-- 每个活动中的每个人
CREATE TABLE IF NOT EXISTS persons (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       activity_id INTEGER NOT NULL,
                                       name TEXT NOT NULL,
                                       weight REAL DEFAULT 1.0,
                                       FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- 支出记录（可以无限扩展列，只需插入更多行）
CREATE TABLE IF NOT EXISTS expenses (
                                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                                        activity_id INTEGER NOT NULL,
                                        person_id INTEGER NOT NULL,
                                        amount REAL NOT NULL,
                                        note TEXT,
                                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                        FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE,
                                        FOREIGN KEY(person_id) REFERENCES persons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     username TEXT UNIQUE NOT NULL,
                                     password TEXT NOT NULL,
                                     role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- schema.sql (追加内容)

-- 配置（模板）表
CREATE TABLE IF NOT EXISTS configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 配置中的人员详情
CREATE TABLE IF NOT EXISTS config_persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    FOREIGN KEY(config_id) REFERENCES configs(id) ON DELETE CASCADE
);

-- 活动分享链接（公开只读）
CREATE TABLE IF NOT EXISTS share_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE
);
