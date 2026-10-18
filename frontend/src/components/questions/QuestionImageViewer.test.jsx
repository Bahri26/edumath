import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import QuestionImageViewer from './QuestionImageViewer.jsx';
it('supports original size, zoom and fit',()=>{
 render(<QuestionImageViewer src="/uploads/test.png" alt="Şekil" onClose={vi.fn()}/>);
 const image=screen.getByAltText('Şekil');
 Object.defineProperties(image,{naturalWidth:{value:1200},naturalHeight:{value:800}});
 fireEvent.load(image);
 fireEvent.click(screen.getByRole('button',{name:'Özgün boyut'}));
 expect(image.style.width).toBe('1200px');
 fireEvent.click(screen.getByRole('button',{name:'Yakınlaştır'}));
 expect(image.style.width).toBe('1500px');
 fireEvent.click(screen.getByRole('button',{name:'Uzaklaştır'}));
 expect(image.style.width).toBe('1200px');
 fireEvent.click(screen.getByRole('button',{name:'Ekrana sığdır'}));
 expect(parseFloat(image.style.width)).toBeLessThan(1200);
});
