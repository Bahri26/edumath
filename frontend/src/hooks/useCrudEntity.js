import { useState, useCallback, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * Generic CRUD Hook - Exam, Question, Survey gibi varlıklar için
 * @param {Object} config - Entity konfigürasyonu
 * @param {string} config.entityName - 'questions', 'exams', 'surveys'
 * @param {Function} config.apiService - API çağrılarını yapan servis
 * @param {Function} config.onRefresh - Veri yenilendiğinde çağrılacak callback
 */
export const useCrudEntity = ({ entityName, apiService, onRefresh }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({});

  // Veri Listesi Getir
  const fetchItems = useCallback(async (page = 1, filterParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getAll(entityName, {
        page,
        limit: pagination.limit,
        ...filterParams
      });

      setItems(response.data || []);
      setPagination(prev => ({
        ...prev,
        page,
        total: response.total,
        totalPages: response.totalPages
      }));
    } catch (err) {
      const message = err.response?.data?.message || `${entityName} yüklenemedi`;
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [entityName, apiService, pagination.limit, showToast]);

  // Tek Öğe Getir
  const fetchItemById = useCallback(async (id) => {
    try {
      const response = await apiService.getById(entityName, id);
      return response.data;
    } catch (err) {
      showToast('Veri yüklenemedi', 'error');
      throw err;
    }
  }, [entityName, apiService, showToast]);

  // Yeni Öğe Oluştur
  const createItem = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await apiService.create(entityName, data);
      showToast(`${entityName} başarıyla oluşturuldu`, 'success');
      
      // Yeni öğeyi listeye ekle
      setItems(prev => [response.data, ...prev]);
      onRefresh?.();
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Oluşturma başarısız';
      showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [entityName, apiService, showToast, onRefresh]);

  // Öğe Güncelle
  const updateItem = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await apiService.update(entityName, id, data);
      showToast(`${entityName} başarıyla güncellendi`, 'success');
      
      // Listedeki öğeyi güncelle
      setItems(prev => prev.map(item => 
        item._id === id ? response.data : item
      ));
      onRefresh?.();
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Güncelleme başarısız';
      showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [entityName, apiService, showToast, onRefresh]);

  // Öğe Sil
  const deleteItem = useCallback(async (id) => {
    if (!window.confirm('Silmek istediğinizden emin misiniz?')) return false;
    
    setLoading(true);
    try {
      await apiService.delete(entityName, id);
      showToast(`${entityName} başarıyla silindi`, 'success');
      
      // Listeden kaldır
      setItems(prev => prev.filter(item => item._id !== id));
      onRefresh?.();
      
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Silme başarısız';
      showToast(message, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [entityName, apiService, showToast, onRefresh]);

  // Toplu Sil
  const deleteMultiple = useCallback(async (ids) => {
    if (!window.confirm(`${ids.length} öğe silinecek. Emin misiniz?`)) return false;

    setLoading(true);
    try {
      await apiService.deleteMultiple(entityName, ids);
      showToast('Öğeler başarıyla silindi', 'success');
      
      setItems(prev => prev.filter(item => !ids.includes(item._id)));
      onRefresh?.();
      
      return true;
    } catch (err) {
      showToast('Silme başarısız', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [entityName, apiService, showToast, onRefresh]);

  // Filtre Uygula
  const applyFilters = useCallback(async (newFilters) => {
    setFilters(newFilters);
    await fetchItems(1, newFilters);
  }, [fetchItems]);

  // Sayfa Değiştir
  const changePage = useCallback((page) => {
    fetchItems(page, filters);
  }, [fetchItems, filters]);

  // İlk yükleme
  useEffect(() => {
    fetchItems(1, filters);
  }, []);

  return {
    // State
    items,
    loading,
    error,
    pagination,
    filters,
    
    // Actions
    fetchItems,
    fetchItemById,
    createItem,
    updateItem,
    deleteItem,
    deleteMultiple,
    applyFilters,
    changePage,
    
    // Utilities
    refetch: () => fetchItems(pagination.page, filters)
  };
};
