import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import QuestionVisual from './QuestionVisual.jsx';
it('retries a failed inline image and opens zoom controls after loading',()=>{
 render(<QuestionVisual src="https://example.com/test.png" alt="Örüntü şekli"/>);
 fireEvent.error(screen.getByAltText('Örüntü şekli'));
 fireEvent.click(screen.getByRole('button',{name:'Yeniden dene'}));
 fireEvent.load(screen.getByAltText('Örüntü şekli'));
 fireEvent.click(screen.getByRole('button',{name:'Büyüt ve incele'}));
 expect(screen.getByRole('dialog')).toBeInTheDocument();
 fireEvent.keyDown(document,{key:'Escape'});
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('Escape in the viewer does not reach the parent preview Escape handler',()=>{
 const parent=vi.fn();document.addEventListener('keydown',parent);
 render(<QuestionVisual src="https://example.com/test.png"/>);fireEvent.load(screen.getByAltText('Soru görseli'));
 fireEvent.click(screen.getByRole('button',{name:'Büyüt ve incele'}));
 fireEvent.keyDown(document,{key:'Escape'});expect(parent).not.toHaveBeenCalled();
 document.removeEventListener('keydown',parent);
});
