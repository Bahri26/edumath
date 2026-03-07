import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';

const defaultValues = {
  a2Min: 20,
  b1Min: 35,
  b2Min: 50,
  c1Min: 65,
  c2Min: 80
};

const labels = [
  { key: 'a2Min', text: 'A2 başlangıcı' },
  { key: 'b1Min', text: 'B1 başlangıcı' },
  { key: 'b2Min', text: 'B2 başlangıcı' },
  { key: 'c1Min', text: 'C1 başlangıcı' },
  { key: 'c2Min', text: 'C2 başlangıcı' }
];

function isValidThresholds(values) {
  const nums = {
    a2Min: Number(values.a2Min),
    b1Min: Number(values.b1Min),
    b2Min: Number(values.b2Min),
    c1Min: Number(values.c1Min),
    c2Min: Number(values.c2Min)
  };

  const arr = [nums.a2Min, nums.b1Min, nums.b2Min, nums.c1Min, nums.c2Min];
  const invalidRange = arr.some((v) => Number.isNaN(v) || v < 0 || v > 100);
  const ascending = nums.a2Min < nums.b1Min && nums.b1Min < nums.b2Min && nums.b2Min < nums.c1Min && nums.c1Min < nums.c2Min;

  return !invalidRange && ascending;
}

const LevelThresholdsPage = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState(defaultValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/exams/level-thresholds');
        const data = res?.data?.data || defaultValues;
        setValues({
          a2Min: Number(data.a2Min ?? defaultValues.a2Min),
          b1Min: Number(data.b1Min ?? defaultValues.b1Min),
          b2Min: Number(data.b2Min ?? defaultValues.b2Min),
          c1Min: Number(data.c1Min ?? defaultValues.c1Min),
          c2Min: Number(data.c2Min ?? defaultValues.c2Min)
        });
      } catch (err) {
        setError('Eşikler yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const onChange = (key, val) => {
    setSuccess('');
    setError('');
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const onSave = async () => {
    setSuccess('');
    setError('');

    if (!isValidThresholds(values)) {
      setError('Değerler 0-100 aralığında ve artan sırada olmalı: A2 < B1 < B2 < C1 < C2.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        a2Min: Number(values.a2Min),
        b1Min: Number(values.b1Min),
        b2Min: Number(values.b2Min),
        c1Min: Number(values.c1Min),
        c2Min: Number(values.c2Min)
      };
      await api.put('/exams/level-thresholds', payload);
      setSuccess('CEFR eşikleri güncellendi.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Güncelleme başarısız.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 40 }}>Yükleniyor...</div>;
  }

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: 20, fontFamily: 'Segoe UI' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>🎯 CEFR Seviye Eşikleri</h2>
        <Button onClick={() => navigate('/exams')}>Sınavlara Dön</Button>
      </div>

      <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 10, padding: 20 }}>
        <p style={{ marginTop: 0, color: '#555', fontSize: 14 }}>
          Yüzde puanına göre seviye etiketleri bu sınırlarla belirlenir. A1 otomatik olarak A2 sınırının altındaki değerlerdir.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, alignItems: 'center' }}>
          {labels.map((item) => (
            <div key={item.key} style={{ display: 'contents' }}>
              <label style={{ fontWeight: 600, color: '#34495e' }}>{item.text}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={values[item.key]}
                onChange={(e) => onChange(item.key, e.target.value)}
                style={{ border: '1px solid #d0d7de', borderRadius: 8, padding: '8px 10px' }}
              />
            </div>
          ))}
        </div>

        {error && <p style={{ color: '#c0392b', marginTop: 16 }}>{error}</p>}
        {success && <p style={{ color: '#1e8449', marginTop: 16 }}>{success}</p>}

        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <Button onClick={onSave} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          <button
            type="button"
            onClick={() => setValues(defaultValues)}
            style={{ border: '1px solid #d0d7de', background: 'white', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}
          >
            Varsayılanlara Dön
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelThresholdsPage;
