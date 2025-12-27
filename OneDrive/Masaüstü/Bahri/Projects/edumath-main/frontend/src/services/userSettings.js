import apiClient from '../services/api';

export const getUserSettings = async () => {
  try {
    const res = await apiClient.get('/users/profile');
    return {
      theme: res.data.theme || 'light',
      language: res.data.language || 'TR',
      notifications: typeof res.data.notifications === 'boolean' ? res.data.notifications : true,
    };
  } catch (error) {
    console.warn('getUserSettings hatası:', error.response?.status, error.message);
    // Hata durumunda default değerler dön
    return {
      theme: 'light',
      language: 'TR',
      notifications: true,
    };
  }
};

export const updateUserSettings = async (settings) => {
  try {
    console.log('Sending settings to backend:', settings);
    await apiClient.put('/users/profile', settings);
  } catch (error) {
    console.error('updateUserSettings hatası:', error.response?.status, error.message);
    console.error('Backend response:', error.response?.data);
    // Silent fail - hatayı log et ama uygulamayı çökertme
  }
};
