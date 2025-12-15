import axios from "axios";
//local
// const API_BASE = "http://localhost:3001";
//docker
const API_BASE = "/api";

export const api = {
    // --- 原有活动接口 ---
    login: (username, password) => axios.post(`${API_BASE}/login`, { username, password }, { withCredentials: true }),
    logout: () => axios.post(`${API_BASE}/logout`, {}, { withCredentials: true }),
    checkAuth: () => axios.get(`${API_BASE}/checkAuth`),
    getActivities: () => axios.get(`${API_BASE}/activities`),
    createActivity: (name, num_people) => axios.post(`${API_BASE}/activities`, { name, num_people }),
    deleteActivity: (id) => axios.delete(`${API_BASE}/activities/${id}`),
    getActivityDetail: (id) => axios.get(`${API_BASE}/activities/${id}`),

    // --- 原有人员接口 ---
    addPerson: (activity_id, name, weight) => axios.post(`${API_BASE}/activities/${activity_id}/persons`, { name, weight }),
    updatePerson: (id, data) => axios.put(`${API_BASE}/persons/${id}`, data),
    deletePerson: (id) => axios.delete(`${API_BASE}/persons/${id}`),

    // --- ⭐ 新增：批量导入人员 (用于配置导入) ---
    batchAddPersons: (activity_id, persons) => axios.post(`${API_BASE}/activities/${activity_id}/persons/batch`, { persons }),

    // --- 原有支出接口 ---
    addExpense: (activity_id, person_id, amount, note) => axios.post(`${API_BASE}/activities/${activity_id}/expenses`, { person_id, amount, note }),
    deleteExpense: (id) => axios.delete(`${API_BASE}/expenses/${id}`),

    // --- 原有统计接口 ---
    getStats: (id) => axios.get(`${API_BASE}/activities/${id}/stats`),

    // --- ⭐ 新增：配置(模板)接口 ---
    // ⭐ 新增：更新活动信息 (放在 getActivities 附近即可)
    updateActivity: (id, name) => axios.put(`${API_BASE}/activities/${id}`, { name }),
    getConfigs: () => axios.get(`${API_BASE}/configs`),
    createConfig: (name, persons) => axios.post(`${API_BASE}/configs`, { name, persons }),
    deleteConfig: (id) => axios.delete(`${API_BASE}/configs/${id}`),
    updateConfig: (id, name, persons) => axios.put(`${API_BASE}/configs/${id}`, { name, persons }),

    // --- 管理员接口 ---
    authStatus: () => axios.get(`${API_BASE}/auth/status`, { withCredentials: true }),
    getProfile: () => axios.get(`${API_BASE}/me`),
    adminCreateUser: (username, password) => axios.post(`${API_BASE}/admin/users`, { username, password }),
    adminResetPassword: (username, newPassword) => axios.post(`${API_BASE}/admin/users/reset-password`, { username, newPassword }),

    // --- 活动分享 ---
    createShareLink: (activityId, validDays) => axios.post(`${API_BASE}/activities/${activityId}/share`, { validDays }),
    getSharedActivity: (token) => axios.get(`${API_BASE}/public/activities/${token}`),
};
