import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ExamResultsPage = () => {
    const [results, setResults] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await api.get('/exams/results/all');
                setResults(response.data.data);
            } catch (error) {
                console.error("Sonuçlar yüklenemedi:", error);
            }
        };
        fetchResults();
    }, []);

    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', fontFamily: 'Segoe UI' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#2c3e50' }}>📊 Öğrenci Sınav Sonuçları</h1>
                <button onClick={() => navigate('/teacher-dashboard')} style={{ padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    ← Panele Dön
                </button>
            </div>

            <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#34495e', color: 'white', textAlign: 'left' }}>
                            <th style={thStyle}>Öğrenci Adı</th>
                            <th style={thStyle}>Sınav Başlığı</th>
                            <th style={thStyle}>Puan</th>
                            <th style={thStyle}>Tarih</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>Henüz hiç sınav çözülmemiş.</td>
                            </tr>
                        ) : (
                            results.map((res) => (
                                <tr key={res.attempt_id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tdStyle}>{res.student_name}</td>
                                    <td style={tdStyle}>{res.exam_title}</td>
                                    <td style={{ ...tdStyle, fontWeight: 'bold', color: res.score >= 50 ? '#27ae60' : '#e74c3c' }}>
                                        {res.score}
                                    </td>
                                    <td style={tdStyle}>
                                        {new Date(res.end_time).toLocaleString('tr-TR')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Basit Tablo Stilleri
const thStyle = { padding: '15px', fontWeight: '600' };
const tdStyle = { padding: '15px', color: '#2c3e50' };

export default ExamResultsPage;