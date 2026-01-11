/**
 * Generic Entity API Service
 * Tüm CRUD operasyonlarını merkezi yerde yönetir
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const entityApiService = {
  /**
   * Listeyi getir (filtreleme + pagination)
   */
  getAll: async (entityType, params = {}) => {
    try {
      const response = await axios.get(`${API_BASE}/${entityType}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Tek öğe getir
   */
  getById: async (entityType, id) => {
    try {
      const response = await axios.get(`${API_BASE}/${entityType}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Yeni öğe oluştur
   */
  create: async (entityType, data) => {
    try {
      const response = await axios.post(`${API_BASE}/${entityType}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Öğe güncelle
   */
  update: async (entityType, id, data) => {
    try {
      const response = await axios.put(`${API_BASE}/${entityType}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Öğe sil
   */
  delete: async (entityType, id) => {
    try {
      const response = await axios.delete(`${API_BASE}/${entityType}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toplu sil
   */
  deleteMultiple: async (entityType, ids) => {
    try {
      const response = await axios.post(`${API_BASE}/${entityType}/delete-multiple`, { ids });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Arama + Filtreleme
   */
  search: async (entityType, query, filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE}/${entityType}/search`, {
        params: { q: query, ...filters }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toplu güncelleme
   */
  updateMultiple: async (entityType, updates) => {
    try {
      const response = await axios.post(`${API_BASE}/${entityType}/update-multiple`, updates);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
