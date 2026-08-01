import React from 'react';
import { TestToastProvider } from '../../context/ToastContext';
import QuestionFormModal from './QuestionFormModal';

export default {
  title: 'Exams/QuestionFormModal',
  component: QuestionFormModal,
  decorators: [(Story) => <TestToastProvider><Story /></TestToastProvider>],
};

export const NewQuestionWizard = {
  name: 'Yeni soru sihirbazı',
  args: {
    isOpen: true,
    onClose: () => {},
    editingId: null,
    manualForm: null,
    setManualForm: () => {},
    mainImage: null,
    setMainImage: () => {},
    onSave: () => {},
    lockedSubject: 'Matematik',
  },
};
