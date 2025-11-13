// frontend-react/src/components/AssignmentModal.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker'; // react-datepicker kütüphanesinin kurulu olduğu varsayılır
import "react-datepicker/dist/react-datepicker.css";

// Kullanıcıdan alınan verileri simüle etmek için 
// Normalde bu veriler, TeacherExamsPage yüklenirken çekilmelidir.
const mockClasses = [
    { _id: 'class101', name: '10-A Sınıfı' },
    { _id: 'class102', name: '10-B Sınıfı' },
];

const mockStudents = [
    { _id: 'student101', name: 'Ali Yılmaz' },
    { _id: 'student102', name: 'Buse Demir' },
    { _id: 'student103', name: 'Can Kaya' },
];

const AssignmentModal = ({ show, handleClose, examId, examTitle }) => {
    const [targetType, setTargetType] = useState('Class'); // 'Class' veya 'Student'
    const [targetId, setTargetId] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Mock data - gerçek uygulamada API'den çekilmeli
    const classes = mockClasses;
    const students = mockStudents;

    useEffect(() => {
        // Modal her açıldığında hata/başarı mesajlarını temizle
        if (show) {
            setError(null);
            setSuccess(null);
        }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        // Tarihi ISO formatına çevir
        const assignmentDate = dueDate.toISOString();

        try {
            // Örnek: axios.post('/api/assignments', ...)
            await axios.post('/api/assignments', {
                examId,
                targetType,
                targetId,
                dueDate: assignmentDate,
            }, {
                // Varsayımsal olarak token'ı başlıkta gönderiyoruz
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setSuccess(`'${examTitle}' sınavı başarıyla atandı!`);
            setLoading(false);
            
            // Başarılı atamadan sonra modalı kapatabiliriz (isteğe bağlı)
            // setTimeout(() => handleClose(), 2000); 

        } catch (err) {
            console.error("Atama Hatası:", err);
            const message = err.response?.data?.message || "Sınav atama işlemi sırasında bir hata oluştu.";
            setError(message);
            setLoading(false);
        }
    };

    const targetData = targetType === 'Class' ? classes : students;
    const targetLabel = targetType === 'Class' ? 'Sınıf Seçin' : 'Öğrenci Seçin';

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{examTitle} Sınavını Ata</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {success && <Alert variant="success">{success}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                    
                    {/* Atama Tipi Seçimi */}
                    <Form.Group controlId="targetType" className="mb-3">
                        <Form.Label>Atama Hedefi</Form.Label>
                        <Form.Select 
                            value={targetType} 
                            onChange={(e) => {
                                setTargetType(e.target.value);
                                setTargetId(''); // Hedef tipi değişince seçimi sıfırla
                            }}
                        >
                            <option value="Class">Sınıfa Ata</option>
                            <option value="Student">Bireysel Öğrenciye Ata</option>
                        </Form.Select>
                    </Form.Group>
                    
                    {/* Hedef Seçimi (Sınıf/Öğrenci) */}
                    <Form.Group controlId="targetId" className="mb-3">
                        <Form.Label>{targetLabel}</Form.Label>
                        <Form.Select 
                            value={targetId} 
                            onChange={(e) => setTargetId(e.target.value)} 
                            required
                        >
                            <option value="">Seçiniz...</option>
                            {targetData.map((item) => (
                                // TargetId hem Class hem de Student modelleri için ID alanını temsil eder
                                <option key={item._id} value={item._id}>
                                    {item.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    
                    {/* Teslim Tarihi Seçimi */}
                    <Form.Group controlId="dueDate" className="mb-3">
                        <Form.Label className="d-block">Son Teslim Tarihi</Form.Label>
                        <DatePicker
                            selected={dueDate}
                            onChange={(date) => setDueDate(date)}
                            showTimeSelect
                            dateFormat="dd/MM/yyyy HH:mm"
                            minDate={new Date()} // Geçmiş bir tarihi seçmeyi engelle
                            className="form-control"
                            required
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit" disabled={loading || !targetId}>
                        {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Sınavı Ata'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AssignmentModal;