/**
 * Entity CRUD Konfigürasyonları
 * Her entity tipi için alanları, validasyonları ve UI öğelerini tanımlar
 */

export const ENTITY_CONFIGS = {
  questions: {
    name: 'Sorular',
    singular: 'Soru',
    icon: 'FileText',
    endpoint: '/api/questions',
    fields: [
      {
        name: 'text',
        label: 'Soru Metni',
        type: 'textarea',
        required: true,
        placeholder: 'Soru metnini giriniz...',
        validations: { minLength: 10, maxLength: 500 }
      },
      {
        name: 'subject',
        label: 'Konu',
        type: 'select',
        required: true,
        options: ['Matematik', 'Fen Bilgisi', 'Türkçe', 'İngilizce', 'Tarih', 'Coğrafya']
      },
      {
        name: 'classLevel',
        label: 'Sınıf',
        type: 'select',
        required: true,
        options: ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf']
      },
      {
        name: 'difficulty',
        label: 'Zorluk',
        type: 'select',
        required: true,
        options: ['Kolay', 'Orta', 'Zor']
      },
      {
        name: 'type',
        label: 'Soru Tipi',
        type: 'select',
        required: true,
        options: ['Çoktan Seçmeli', 'Kısa Cevap', 'Doğru/Yanlış', 'Eşleştirme']
      },
      {
        name: 'options',
        label: 'Seçenekler',
        type: 'array',
        required: true,
        itemType: 'text',
        maxItems: 5,
        minItems: 2
      },
      {
        name: 'correctAnswer',
        label: 'Doğru Cevap',
        type: 'text',
        required: true
      },
      {
        name: 'solution',
        label: 'Çözüm',
        type: 'textarea',
        required: false
      }
    ],
    table: {
      columns: [
        { key: 'text', label: 'Soru', width: '40%', ellipsis: true },
        { key: 'subject', label: 'Konu', width: '15%' },
        { key: 'classLevel', label: 'Sınıf', width: '15%' },
        { key: 'difficulty', label: 'Zorluk', width: '15%' },
        { key: 'createdAt', label: 'Tarihi', width: '15%', format: 'date' }
      ]
    }
  },

  exams: {
    name: 'Sınavlar',
    singular: 'Sınav',
    icon: 'BookOpen',
    endpoint: '/api/exams',
    fields: [
      {
        name: 'title',
        label: 'Sınav Başlığı',
        type: 'text',
        required: true,
        placeholder: '2. Dönem Sınavı',
        validations: { minLength: 3, maxLength: 100 }
      },
      {
        name: 'description',
        label: 'Açıklama',
        type: 'textarea',
        required: false,
        placeholder: 'Sınav hakkında bilgi...'
      },
      {
        name: 'classLevel',
        label: 'Sınıf',
        type: 'select',
        required: true,
        options: ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf']
      },
      {
        name: 'subject',
        label: 'Konu',
        type: 'select',
        required: true,
        options: ['Matematik', 'Fen Bilgisi', 'Türkçe', 'İngilizce', 'Tarih', 'Coğrafya']
      },
      {
        name: 'totalQuestions',
        label: 'Toplam Soru Sayısı',
        type: 'number',
        required: true,
        validations: { min: 1, max: 100 }
      },
      {
        name: 'duration',
        label: 'Süre (Dakika)',
        type: 'number',
        required: true,
        validations: { min: 5, max: 240 }
      },
      {
        name: 'startDate',
        label: 'Başlama Tarihi',
        type: 'datetime',
        required: true
      },
      {
        name: 'endDate',
        label: 'Bitiş Tarihi',
        type: 'datetime',
        required: true
      },
      {
        name: 'questions',
        label: 'Sorular',
        type: 'multiselect',
        required: true,
        endpoint: '/api/questions'
      }
    ],
    table: {
      columns: [
        { key: 'title', label: 'Başlık', width: '30%' },
        { key: 'classLevel', label: 'Sınıf', width: '15%' },
        { key: 'subject', label: 'Konu', width: '15%' },
        { key: 'totalQuestions', label: 'Soru', width: '10%' },
        { key: 'duration', label: 'Süre', width: '10%' },
        { key: 'startDate', label: 'Başlama', width: '15%', format: 'datetime' }
      ]
    }
  },

  surveys: {
    name: 'Anketler',
    singular: 'Anket',
    icon: 'ClipboardList',
    endpoint: '/api/surveys',
    fields: [
      {
        name: 'title',
        label: 'Anket Başlığı',
        type: 'text',
        required: true,
        placeholder: 'Ders Memnuniyeti Anketi',
        validations: { minLength: 3, maxLength: 100 }
      },
      {
        name: 'description',
        label: 'Açıklama',
        type: 'textarea',
        required: true,
        placeholder: 'Anket hakkında bilgi...'
      },
      {
        name: 'classLevel',
        label: 'Sınıf',
        type: 'select',
        required: true,
        options: ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf']
      },
      {
        name: 'isAnonymous',
        label: 'Anonim Anket',
        type: 'checkbox',
        required: false
      },
      {
        name: 'startDate',
        label: 'Başlama Tarihi',
        type: 'datetime',
        required: true
      },
      {
        name: 'endDate',
        label: 'Bitiş Tarihi',
        type: 'datetime',
        required: true
      },
      {
        name: 'questions',
        label: 'Sorular',
        type: 'array',
        required: true,
        itemType: 'object',
        fields: [
          { name: 'question', label: 'Soru', type: 'text' },
          { name: 'type', label: 'Soru Tipi', type: 'select', options: ['Açık Uçlu', 'Çoktan Seçmeli', 'Ölçek'] }
        ]
      }
    ],
    table: {
      columns: [
        { key: 'title', label: 'Başlık', width: '35%' },
        { key: 'classLevel', label: 'Sınıf', width: '15%' },
        { key: 'isAnonymous', label: 'Anonim', width: '12%', format: 'boolean' },
        { key: 'responses', label: 'Yanıt', width: '10%' },
        { key: 'startDate', label: 'Başlama', width: '13%', format: 'date' }
      ]
    }
  }
};

/**
 * Field tipine göre input bileşeni döndür
 */
export const getFieldComponent = (fieldType) => {
  const components = {
    text: 'TextInput',
    textarea: 'TextArea',
    number: 'NumberInput',
    select: 'SelectInput',
    multiselect: 'MultiSelectInput',
    checkbox: 'CheckboxInput',
    datetime: 'DateTimeInput',
    array: 'ArrayInput',
    file: 'FileInput'
  };
  return components[fieldType] || 'TextInput';
};

/**
 * Format değerleri görüntülemek için
 */
export const formatValue = (value, format) => {
  switch (format) {
    case 'date':
      return new Date(value).toLocaleDateString('tr-TR');
    case 'datetime':
      return new Date(value).toLocaleString('tr-TR');
    case 'boolean':
      return value ? 'Evet' : 'Hayır';
    default:
      return value;
  }
};
