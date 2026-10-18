import React from 'react';import {render,screen,fireEvent} from '@testing-library/react';import {expect,it,vi} from 'vitest';import AiGenerateQuizModal from './AiGenerateQuizModal.jsx';import {TestToastProvider} from '../../context/ToastContext';
it('shows one title, inherits the selected grade and hides implementation details',()=>{
 const onClose=vi.fn();render(<TestToastProvider><AiGenerateQuizModal isOpen onClose={onClose} profile={{branch:'Matematik',branchApproval:'approved'}} filterDefaults={{subject:'Matematik',classLevel:'6. Sınıf'}}/></TestToastProvider>);
 expect(screen.getAllByRole('heading')).toHaveLength(1);expect(screen.getByLabelText('Sınıf')).toHaveValue('6. Sınıf');
 expect(screen.queryByText(/GEMINI_GOOGLE_GROUNDING/)).not.toBeInTheDocument();expect(screen.queryByText(/havuz örneği/)).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Önizlemeyi kapat'}));expect(onClose).toHaveBeenCalledOnce();
});
