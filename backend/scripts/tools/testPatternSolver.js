const { solvePatternQuestion } = require('../../services/patternQuestionSolver');

const text =
  "Kenar uzunlukları 2 cm olan eşkenar üçgenlerle oluşturulmuş bir örüntü aşağıda verilmiştir. Buna göre örüntünün 5. adımında oluşan şeklin çevre uzunluğu kaç cm'dir?";

console.log(solvePatternQuestion({ text, options: ['11', '17', '22', '28'] }));
