import React from 'react';
import { TestToastProvider } from '../../context/ToastContext';
import AiGenerateQuizModal from './AiGenerateQuizModal';

export default {
  title: 'Exams/AiGenerateQuizModal',
  component: AiGenerateQuizModal,
  decorators: [(Story) => <TestToastProvider><Story /></TestToastProvider>],
};

export const FormStep = {
  name: 'Form adımı',
  args: {
    isOpen: true,
    onClose: () => {},
    profile: { branchApproval: 'approved', branch: 'Matematik' },
    filterDefaults: {},
    onSaved: () => {},
  },
};
