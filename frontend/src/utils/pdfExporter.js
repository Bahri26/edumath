// Lazy-load heavy PDF libraries only when export is invoked

/**
 * 📄 EXAM TO PDF EXPORTER
 * Sınav sorularını print-friendly PDF olarak indirir
 */

/**
 * Sınavı PDF olarak indir
 * @param {Object} exam - Sınav bilgileri { title, description, duration }
 * @param {Array} questions - Soru listesi
 * @param {String} teacherName - Öğretmen adı
 */
import { loadPdfLibs } from './loadPdfLibs';

export const exportExamToPDF = async (exam, questions, teacherName = 'EduMath') => {
    try {
        const libs = await loadPdfLibs();
        const { jsPDF, html2canvas } = libs;
        // 1. Gizli print elementini oluştur
        const printElement = createPrintableExam(exam, questions, teacherName);
        document.body.appendChild(printElement);

        // 2. HTML'i canvas'a çevir
        const canvas = await html2canvas(printElement, {
            scale: 2, // Yüksek kalite
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // 3. Canvas'ı PDF'e dönüştür
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // İlk sayfayı ekle
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Birden fazla sayfa gerekiyorsa
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        // 4. PDF'i indir
        const fileName = `${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        // 5. Temizlik
        document.body.removeChild(printElement);

        return { success: true, fileName };
    } catch (error) {
        console.error('❌ PDF oluşturma hatası:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Print-friendly HTML oluştur
 */
const createPrintableExam = (exam, questions, teacherName) => {
    const container = document.createElement('div');
    container.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 210mm;
        padding: 20mm;
        background: white;
        font-family: Arial, sans-serif;
        color: #000;
    `;

    const currentDate = new Date().toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    container.innerHTML = `
        <style>
            .exam-print {
                font-size: 12pt;
                line-height: 1.6;
            }
            .exam-header {
                text-align: center;
                border-bottom: 3px solid #000;
                padding-bottom: 15px;
                margin-bottom: 25px;
            }
            .exam-title {
                font-size: 20pt;
                font-weight: bold;
                margin-bottom: 8px;
            }
            .exam-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                font-size: 10pt;
                border: 1px solid #ddd;
                padding: 10px;
                background: #f9f9f9;
            }
            .question-block {
                margin-bottom: 25px;
                page-break-inside: avoid;
            }
            .question-header {
                font-weight: bold;
                margin-bottom: 10px;
                font-size: 11pt;
                display: flex;
                justify-content: space-between;
            }
            .question-text {
                margin-bottom: 12px;
                padding: 10px;
                background: #f5f5f5;
                border-left: 3px solid #4F46E5;
            }
            .options {
                margin-left: 20px;
            }
            .option {
                margin-bottom: 8px;
                display: flex;
                align-items: baseline;
            }
            .option-letter {
                font-weight: bold;
                margin-right: 8px;
                min-width: 25px;
            }
            .answer-space {
                margin-top: 15px;
                padding: 10px;
                border: 1px dashed #999;
                min-height: 60px;
            }
            .student-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                border: 2px solid #000;
                padding: 15px;
            }
            .info-field {
                font-size: 11pt;
                border-bottom: 1px solid #000;
                min-width: 200px;
                display: inline-block;
                margin-left: 10px;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 9pt;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 10px;
            }
        </style>

        <div class="exam-print">
            <!-- Header -->
            <div class="exam-header">
                <div style="font-size: 14pt; font-weight: bold; color: #4F46E5;">📐 EduMath - Matematik Değerlendirme Platformu</div>
                <div class="exam-title">${exam.title}</div>
                <div style="font-size: 11pt; color: #666;">${exam.description || ''}</div>
            </div>

            <!-- Student Info -->
            <div class="student-info">
                <div>
                    <strong>👤 Ad Soyad:</strong>
                    <span class="info-field"></span>
                </div>
                <div>
                    <strong>🔢 Numara:</strong>
                    <span class="info-field"></span>
                </div>
                <div>
                    <strong>📅 Tarih:</strong>
                    <span class="info-field">${currentDate}</span>
                </div>
            </div>

            <!-- Exam Info -->
            <div class="exam-info">
                <div><strong>Soru Sayısı:</strong> ${questions.length}</div>
                <div><strong>Süre:</strong> ${exam.duration} dakika</div>
                <div><strong>Hazırlayan:</strong> ${teacherName}</div>
            </div>

            <!-- Questions -->
            ${questions.map((q, index) => `
                <div class="question-block">
                    <div class="question-header">
                        <span>📝 Soru ${index + 1}</span>
                        <span>${q.points || 10} Puan</span>
                    </div>
                    <div class="question-text">
                        ${q.question_text}
                    </div>

                    ${q.option_a ? `
                        <div class="options">
                            <div class="option">
                                <span class="option-letter">A)</span>
                                <span>${q.option_a}</span>
                            </div>
                            <div class="option">
                                <span class="option-letter">B)</span>
                                <span>${q.option_b}</span>
                            </div>
                            <div class="option">
                                <span class="option-letter">C)</span>
                                <span>${q.option_c}</span>
                            </div>
                            <div class="option">
                                <span class="option-letter">D)</span>
                                <span>${q.option_d}</span>
                            </div>
                        </div>
                    ` : `
                        <div class="answer-space">
                            <strong>Cevap:</strong>
                        </div>
                    `}
                </div>
            `).join('')}

            <!-- Footer -->
            <div class="footer">
                <p><strong>BAŞARILAR DİLERİZ! 🎓</strong></p>
                <p>Bu sınav EduMath platformu ile oluşturulmuştur. ${currentDate}</p>
            </div>
        </div>
    `;

    return container;
};
