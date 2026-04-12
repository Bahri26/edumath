// src/hooks/useCrud.js
import { useState, useCallback } from 'react';
import apiClient from '../services/api';

const useCrud = (endpoint) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. GET (Verileri Çek)
    const getAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(endpoint);
            setData(response.data);
        } catch (err) {
            setError(err.message || 'Veri çekilirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    // 2. POST (Yeni Ekle)
    const createItem = async (newItem) => {
        setLoading(true);
        try {
            const response = await apiClient.post(endpoint, newItem);
            // Listeyi güncelle (tekrar fetch yapmadan)
            setData((prev) => [...prev, response.data]); 
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // 3. PUT (Güncelle)
    const updateItem = async (id, updatedFields) => {
        setLoading(true);
        try {
            const response = await apiClient.put(`${endpoint}/${id}`, updatedFields);
            setData((prev) => prev.map(item => item._id === id ? response.data : item));
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    // 4. DELETE (Sil)
    const deleteItem = async (id) => {
        setLoading(true);
        try {
            await apiClient.delete(`${endpoint}/${id}`);
            setData((prev) => prev.filter(item => item._id !== id));
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, getAll, createItem, updateItem, deleteItem };
};

export default useCrud;