const { solvePatternQuestion } = require('../../services/patternQuestionSolver');

const text =
  'Birim küplerle oluşturulmuş bir örüntünün ilk üç adımı aşağıda verilmiştir. Buna göre örüntünün kuralı aşağıdakilerden hangisidir?';

const options = [
  '4 x (Adım Sayısı)',
  '2 x (Adım Sayısı) + 2',
  '5 x (Adım Sayısı) − 1',
  '3 x (Adım Sayısı)',
];

console.log(solvePatternQuestion({ text, options }));
