import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import QuestionThumbnail from './QuestionThumbnail.jsx';
const imported={assessmentMeta:{importSource:'pattern-pdf-extracted-2026-08',gradeSlug:'6-sinif',pageNumber:8,questionNumber:3},image:'https://drive.google.com/uc?export=view&id=example'};
it('uses the bundled source in a production build and resolves the API image origin',()=>{
 vi.stubEnv('DEV',false);
 render(<QuestionThumbnail question={imported}/>);
 expect(screen.getByRole('img').getAttribute('src')).toContain('/uploads/pattern-pdf-source/6-sinif/source-p08-q03.png');
 expect(screen.getByRole('img').getAttribute('src')).not.toContain('drive.google.com');
 vi.unstubAllEnvs();
});
it('renders a neutral placeholder without exposing the question text',()=>{
 render(<QuestionThumbnail question={{text:'Bu metin kartta görünmemeli'}}/>);
 expect(screen.queryByText(/Bu metin/)).not.toBeInTheDocument();expect(screen.getByText('Metin sorusu')).toBeInTheDocument();
});
it('shows an explicit failure state rather than an empty thumbnail',()=>{
 render(<QuestionThumbnail question={{image:'https://example.com/test.png'}}/>);
 fireEvent.error(screen.getByRole('img'));expect(screen.getByText('Görsel açılamadı')).toBeInTheDocument();
});
