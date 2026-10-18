import { expect, it } from 'vitest';
import { withLocalPatternSource } from './localPatternSource.js';
it('uses the matching source crop locally without modifying the stored question', () => {
  const question = { image:'https://drive.google.com/example', assessmentMeta:{ importSource:'pattern-pdf-extracted-2026-08',gradeSlug:'6-sinif',pageNumber:8,questionNumber:3 } };
  const local = withLocalPatternSource(question,true);
  expect(local.image).toBe('/uploads/pattern-pdf-source/6-sinif/source-p08-q03.png');
  expect(local.assessmentMeta.imageRole).toBe('full-question');
  expect(question.image).toBe('https://drive.google.com/example');
  expect(withLocalPatternSource(question,false)).toBe(question);
});
it('does not replace images on unrelated questions',()=> {
  const question = {image:'original.png',assessmentMeta:{gradeSlug:'6-sinif',pageNumber:8,questionNumber:3}};
  expect(withLocalPatternSource(question,true)).toBe(question);
});

it('honors replaced images and text mode', () => {
 const meta={importSource:'pattern-pdf-extracted-2026-08',gradeSlug:'6-sinif',pageNumber:8,questionNumber:3};
 for(const extra of [{localSourceDisabled:true},{contentMode:'text'}]) {
   const question={image:'new.png',assessmentMeta:{...meta,...extra}};
   expect(withLocalPatternSource(question,true)).toBe(question);
 }
});
