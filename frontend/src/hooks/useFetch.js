import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const useFetch = (url, autoFetch = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(url);
            // backend sometimes returns { rows, total } directly, sometimes wraps in { data: ... }
            const raw = res.data;
            // Support API shapes: { data: [...] } or { rows: [...], total } or direct array
            const payload = raw && (raw.data !== undefined ? raw.data : (raw.rows !== undefined ? raw.rows : raw));
            setData(payload);
        } catch (err) {
            setError(err.response?.data?.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        if (autoFetch) fetchData();
    }, [fetchData, autoFetch]);

    return { data, loading, error, refetch: fetchData };
};

export default useFetch;
