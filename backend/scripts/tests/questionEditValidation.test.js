const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateQuestionEdit } = require('../../utils/questionEditValidation');
const base = {text:'Soru', type:'multiple-choice', options:['1','2','3','4','5'], correctAnswer:'E'};
test('allows five options and an E answer', () => assert.equal(validateQuestionEdit(base), ''));
test('rejects an answer outside the current options', () => assert.ok(validateQuestionEdit({...base,options:['1','2']})));
test('rejects duplicate and blank choices', () => {
  assert.ok(validateQuestionEdit({...base,options:['1','1']}));
  assert.ok(validateQuestionEdit({...base,options:['1','']}));
});
