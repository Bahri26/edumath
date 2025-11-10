// frontend-react/src/components/SimulationPlayer.jsx (HTML YAPISI ENTEGRE EDİLDİ)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../assets/styles/SimulationPlayer.module.css'; 

const API_KEY = 'ANAHTARINIZI_BURAYA_GİRİN'; 
const DURATION_MULTIPLIER = 50; // Simülasyon hızını kontrol etmek için

// --- Sahte TTS Fonksiyonu ---
async function generateAudioForStep(step) {
    const duration = (step.text.length / 15) * 1000 + DURATION_MULTIPLIER;
    return { duration: duration };
}

// --- Dynamic Scenario Helpers ---
const applyDynamicChanges = (step) => {
    // Bu fonksiyon, HTML yapısındaki dinamik görsel değişiklikleri React state'leri yerine 
    // doğrudan DOM üzerinden (veya daha iyisi: state üzerinden) yapmalıdır.
    // Ancak bu örnekte, sadece diyalog ve durum akışını kontrol edeceğiz.
    // Simülasyon yapısı: Bu kısım normalde React State'leri ile yapılmalıdır. 
    // Şimdilik, sadece diyalog ve kontrol akışını tutacağız.
    console.log(`ACTION: ${step.action} - Data:`, step.data);
};

const SimulationPlayer = ({ questionData }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [statusText, setStatusText] = useState(API_KEY ? 'Sesler yükleniyor...' : 'Simülasyon Hızı Kullanılıyor.');
    const [scenario, setScenario] = useState([]);
    const [screenContent, setScreenContent] = useState('');
    const audioPlayerRef = useRef(new Audio());
    
    // --- Fonksiyon: Dinamik Senaryo Oluşturma ---
    const createScenarioFromData = useCallback((data) => {
        // Bu fonksiyon, QuestionPool'dan gelen veriyi kullanarak 
        // HTML dosyasındaki sabit 'scenario' dizisine benzer bir dizi oluşturur.
        const newScenario = [];
        newScenario.push({ speaker: 'Can', text: `Merhaba Zeynep! ${data.classLevel} dersinde, '${data.topic}' konusundaki bu sorunun çözümüne bakacağız.`, action: 'show_question' });
        
        const solutionSteps = (data.solutionText || data.text).split(/[.?!]/).filter((s) => s.trim().length > 5);

        let isTeachersTurn = false; // Zeynep'ten başlasın
        solutionSteps.forEach((step, index) => {
             newScenario.push({
                speaker: isTeachersTurn ? 'Can' : 'Zeynep',
                text: `(Adım ${index + 1}) ${step.trim()}.`,
                action: 'update_solution',
            });
            isTeachersTurn = !isTeachersTurn;
        });

        newScenario.push({ speaker: 'Can', text: "İşte bu kadar! Görüşmek üzere!", action: 'end' });
        return newScenario;
    }, []);

    // --- Effect: Senaryo ve Simülasyon Hazırlığı ---
    useEffect(() => {
        if (!questionData) return;
        const newScenario = createScenarioFromData(questionData);
        setScenario(newScenario);
        if (!API_KEY) { setStatusText('Simülasyon Hızı Kullanılıyor. Oynatabilirsiniz.'); }
    }, [questionData, createScenarioFromData]);

    // --- Fonksiyon: Adımı Oynatma ---
    const playStep = useCallback(async () => {
        if (stepIndex >= scenario.length) { setIsPlaying(false); return; }

        const currentStep = scenario[stepIndex];
        
        // Simülasyon akışı:
        applyDynamicChanges(currentStep); // Görsel değişiklikleri uygula (Şimdilik Console Log)
        
        const { duration } = await generateAudioForStep(currentStep);

        const timeoutId = setTimeout(() => { setStepIndex((prevIndex) => prevIndex + 1); }, duration);
        return () => clearTimeout(timeoutId);
    }, [scenario, stepIndex]);

    // --- Effect: Adım İlerlemesi ---
    useEffect(() => {
        if (isPlaying && scenario.length > 0) { playStep(); }
    }, [isPlaying, stepIndex, scenario, playStep]);
    
    // --- Fonksiyon: Oynatmayı Başlat/Durdur ---
    const togglePlayback = () => {
        if (scenario.length === 0) return;
        if (isPlaying) { setIsPlaying(false); setStepIndex(stepIndex); } 
        else {
            if (stepIndex >= scenario.length) { setStepIndex(0); }
            setIsPlaying(true);
        }
    };
    
    // --- JSX Rendering Değerleri ---
    const currentStep = scenario[stepIndex] || { speaker: 'Can', text: 'Simülasyon Başlatılmaya Hazır.', action: 'none' };
    const currentSpeaker = currentStep.speaker;
    
    let dialogText = currentStep.text.replace(/\*\*(.*?)\*\*/g, `<span class="${styles.highlight}">$1</span>`);
    
    const isCompleted = stepIndex >= scenario.length;
    const isReady = scenario.length > 0;

    // EKRAN İÇERİĞİNİ DİNAMİK OLARAK OLUŞTURAN FONKSİYON
    const renderScreenContent = () => {
        if (isCompleted) {
            return (
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <p className="text-4xl font-extrabold text-[#10b981] text-center mt-20">Ders Tamamlandı! Cevap: {questionData.correctAnswer || 'Bilgi Yok'}</p>
                </div>
            );
        }
        
        // Adımları topluyoruz
        const steps = scenario
            .filter((step, index) => index < stepIndex && step.action === 'update_solution')
            .map((step) => step.text.replace(/\(Adım \d+\)/, ''));

        return (
            <div id="screenContent" className={styles.dynamicContent}>
                <h3 className="text-2xl font-extrabold text-yellow-400 mb-4">{questionData?.topic} ({questionData?.classLevel})</h3>
                
                {/* Soru Metni - Sizin görseldeki gibi */}
                <p className={styles.questionTextDisplay}>
                    <strong className="text-yellow-200">Soru:</strong> {questionData?.text || "Soru metni yüklenemedi."}
                </p>
                
                {/* Çözüm Akışı */}
                <h4 className="text-xl font-bold text-green-400 mb-2 mt-4">Çözüm Akışı:</h4>
                <div id="solutionSteps" className={styles.solutionSteps}>
                    {steps.map((text, index) => (
                        <p key={index} className={`${styles.solutionStep} ${styles.solutionStepVisible} text-white`}>
                            {text}
                        </p>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.videoContainer}>
            {/* Video Ekranı / Simülasyon Alanı */}
            <div id="videoScreen" className={styles.screen}>
                {renderScreenContent()}
            </div>

            {/* Karakter ve Diyalog Alanı */}
            <div className="p-5 flex flex-col">
                <div className={styles.avatarContainer}>
                    {/* Öğretmen Avatarları (Sol) */}
                    <img id="teacherAvatar" src="avatar-men.jpg" alt="Can Bey Öğretmen" 
                        className={`${styles.avatar} ${styles.teacher} ${currentSpeaker === 'Can' && isPlaying ? styles.avatarActive : ''}`}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/22c55e/ffffff?text=Can'; }}
                    />
                    {/* Öğrenci Avatarları (Sağ) */}
                    <img id="studentAvatar" src="avatar-woman.jpg" alt="Zeynep Öğrenci" 
                        className={`${styles.avatar} ${styles.student} ${currentSpeaker === 'Zeynep' && isPlaying ? styles.avatarActive : ''}`}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/ef4444/ffffff?text=Zeynep'; }}
                    />
                </div>

                {/* Diyalog Kutusu */}
                <div id="dialogBox" className={styles.dialogBox} style={{ opacity: isPlaying || isCompleted ? 1 : 0 }}>
                    <strong className="font-extrabold">{currentSpeaker === 'Can' ? 'Can Bey' : 'Zeynep'}: </strong>
                    <span dangerouslySetInnerHTML={{ __html: dialogText }}></span>
                </div>

                {/* Kontrol Butonları ve Durum */}
                <div className={styles.controlArea}>
                    <p id="statusText" className={styles.statusText}>{statusText}</p>
                    <button id="playButton" className={styles.controlButton} onClick={togglePlayback} disabled={!isReady && !isPlaying && !isCompleted}>
                        {isCompleted ? (<i className="fas fa-redo me-2"></i>) : isPlaying ? (<i className="fas fa-pause me-2"></i>) : (<i className="fas fa-play me-2"></i>)}
                        {isCompleted ? 'Baştan Başlat' : isPlaying ? 'Durdur' : 'Sesli Dersi Başlat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimulationPlayer;