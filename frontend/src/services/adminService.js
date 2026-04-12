import apiClient from './api';

const listResetRequests = async (status = 'pending') => {
  const resp = await apiClient.get(`/admin/password-reset-requests?status=${encodeURIComponent(status)}`);
  return resp.data.items;
};

const approveResetRequest = async (id) => {
  const resp = await apiClient.post(`/admin/password-reset-requests/${id}/approve`);
  return resp.data; // { message, rawToken, expiresAt }
};

const approveResetRequestWithPassword = async (id, newPassword, mustChange = false) => {
  const resp = await apiClient.post(`/admin/password-reset-requests/${id}/approve-set-password`, { newPassword, mustChange });
  return resp.data; // { message }
};

const denyResetRequest = async (id) => {
  const resp = await apiClient.post(`/admin/password-reset-requests/${id}/deny`);
  return resp.data; // { message }
};

export default {
  listResetRequests,
  approveResetRequest,
  approveResetRequestWithPassword,
  denyResetRequest,
  getAdminStats: async () => {
    const resp = await apiClient.get('/admin/stats');
    return resp.data;
  },
  listUsers: async (status = 'pending', role = 'all', q = '', page = 1, limit = 10) => {
    const resp = await apiClient.get(`/admin/users?status=${encodeURIComponent(status)}&role=${encodeURIComponent(role)}&q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`);
    return resp.data;
  },
  approveUser: async (id, tempPassword) => {
    const resp = await apiClient.post(`/admin/users/${id}/approve`, tempPassword ? { tempPassword } : {});
    return resp.data;
  },
  setUserPassword: async (id, newPassword) => {
    const resp = await apiClient.post(`/admin/users/${id}/set-password`, { newPassword });
    return resp.data;
  },
  createUser: async (payload) => {
    const resp = await apiClient.post('/admin/users', payload);
    return resp.data;
  },
  updateUser: async (id, payload) => {
    const resp = await apiClient.patch(`/admin/users/${id}`, payload);
    return resp.data;
  },
  deleteUser: async (id) => {
    const resp = await apiClient.delete(`/admin/users/${id}`);
    return resp.data;
  },
  disableUser: async (id) => {
    const resp = await apiClient.post(`/admin/users/${id}/disable`);
    return resp.data;
  },
  enableUser: async (id) => {
    const resp = await apiClient.post(`/admin/users/${id}/enable`);
    return resp.data;
  }
  ,
  listBranchRequests: async (q = '', page = 1, limit = 10) => {
    const resp = await apiClient.get(`/admin/branch-requests?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`);
    return resp.data; // { items, pagination }
  },
  approveBranch: async (id) => {
    const resp = await apiClient.post(`/admin/branch-requests/${id}/approve`);
    return resp.data; // { message }
  },
  denyBranch: async (id) => {
    const resp = await apiClient.post(`/admin/branch-requests/${id}/deny`);
    return resp.data; // { message }
  }
};
