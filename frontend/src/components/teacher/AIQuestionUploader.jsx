import React, { useState } from 'react';
import api from '../../services/api';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };
        image.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            reject(err);
        };
        image.src = objectUrl;
    });
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Görsel dönüştürülemedi.'));
            resolve(blob);
        }, type, quality);
    });
}

async function optimizeImageFile(file) {
    // Keep tiny files as-is.
    if (file.size <= MAX_IMAGE_SIZE_BYTES) {
        return { file, compressed: false, originalSize: file.size, optimizedSize: file.size };
    }

    const image = await loadImage(file);
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    const targetWidth = Math.max(1, Math.round(image.width * ratio));
    const targetHeight = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    let blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);

    // If still large, second pass with lower quality.
    if (blob.size > MAX_IMAGE_SIZE_BYTES) {
        blob = await canvasToBlob(canvas, 'image/jpeg', 0.65);
    }

    const normalizedName = String(file.name || 'question-image').replace(/\.[a-zA-Z0-9]+$/, '');
    const optimized = new File([blob], `${normalizedName}.jpg`, { type: 'image/jpeg' });
    return { file: optimized, compressed: true, originalSize: file.size, optimizedSize: optimized.size };
}

const AIQuestionUploader = ({ onQuestionCreated }) => {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Lütfen bir resim dosyası seçin.');
                return;
            }

            (async () => {
                try {
                    const optimized = await optimizeImageFile(file);
                    setImage(optimized.file);
                    setPreview(URL.createObjectURL(optimized.file));
                    if (optimized.compressed) {
                        const oldMb = (optimized.originalSize / (1024 * 1024)).toFixed(2);
                        const newMb = (optimized.optimizedSize / (1024 * 1024)).toFixed(2);
                        setInfo(`Görsel optimize edildi: ${oldMb}MB -> ${newMb}MB`);
                    } else {
                        setInfo('');
                    }
                    setError(null);
                } catch (err) {
                    console.error(err);
                    setError('Görsel işlenirken hata oluştu. Lütfen başka bir dosya deneyin.');
                }
            })();
        }
    };

    const handleAnalyze = async () => {
        if (!image) {
            setError('Lütfen bir resim seçin.');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const toBase64 = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const full = String(reader.result || '');
                    const base64 = full.includes(',') ? full.split(',')[1] : full;
                    resolve(base64);
                };
                reader.onerror = reject;
            });

            const imageBase64 = await toBase64(image);
            const res = await api.post('/ai/analyze-vision', {
                imageBase64,
                mimeType: image.type || 'image/jpeg'
            });
            
            // Analiz sonucunu üst bileşene (Forma) gönderiyoruz
            if (onQuestionCreated && res.data.data) {
                onQuestionCreated(res.data.data);
            }
            
            setImage(null);
            setPreview(null);
            setInfo('');
        } catch (error) {
            console.error("Analiz hatası:", error);
            setError(error.response?.data?.message || "Analiz başarısız oldu. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 mb-8 shadow-sm">
            <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
                🤖 Fotoğraftan Soru Üret (AI)
            </h3>
            
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
                {/* Yükleme Alanı */}
                <div className="w-full md:w-1/2">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-indigo-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-indigo-50 transition-colors duration-200">
                        {preview ? (
                            <div className="relative w-full h-full p-2">
                                <img src={preview} alt="Önizleme" loading="lazy" decoding="async" className="h-full w-full object-contain" />
                                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-2xl transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                    <span className="text-white text-sm font-bold">Başka resim seç</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <span className="text-4xl mb-2">📸</span>
                                <p className="text-sm text-gray-600 font-medium">Fotoğraf yüklemek için tıkla</p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (Max 10MB)</p>
                            </div>
                        )}
                        <input 
                            type="file" 
                            className="hidden" 
                            onChange={handleImageChange} 
                            accept="image/*"
                            disabled={loading}
                        />
                    </label>
                </div>

                {/* Buton ve Açıklama */}
                <div className="w-full md:w-1/2 space-y-4 flex flex-col justify-between">
                    <div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Sorunun fotoğrafını yükleyin. Yapay zeka:
                        </p>
                        <ul className="text-xs text-gray-600 mt-2 space-y-1 ml-4">
                            <li>✓ Metni (OCR) kusursuz çıkaracak</li>
                            <li>✓ Şıkları otomatik ayıracak</li>
                            <li>✓ Doğru cevabı bulacak</li>
                            <li>✓ Zorluk seviyesini belirleyecek</li>
                            <li>✓ Konu ve ipucu ekleyecek</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                                ⚠️ {error}
                            </div>
                        )}

                        {info && !error && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                                ℹ️ {info}
                            </div>
                        )}
                        
                        <button 
                            onClick={handleAnalyze}
                            disabled={loading || !image}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Analiz Ediliyor...
                                </>
                            ) : (
                                <>✨ Soruyu Analiz Et</>
                            )}
                        </button>

                        {preview && !loading && (
                            <button
                                onClick={() => {
                                    setImage(null);
                                    setPreview(null);
                                    setInfo('');
                                }}
                                className="w-full py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all duration-200"
                            >
                                Sıfırla
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIQuestionUploader;
