import test from"node:test";
import assert from"node:assert/strict";
import{FINAL_EXAM_BANK,buildExam,gradeFor}from"../functions/api/academy/n8n-final-exam.js";

test("final exam bank has balanced coverage across all 12 modules",()=>{
 assert.equal(FINAL_EXAM_BANK.length,48);
 for(let module=1;module<=12;module++){
  assert.equal(FINAL_EXAM_BANK.filter(q=>q.module===module).length,4);
 }
});

test("final exam builds 24 server-side questions with two per module and no answer flags",()=>{
 const exam=buildExam();
 assert.equal(exam.questions.length,24);
 assert.equal(Object.keys(exam.answerKey).length,24);
 assert.equal(new Set(exam.questions.map(q=>q.id)).size,24);
 for(let module=1;module<=12;module++){
  assert.equal(exam.questions.filter(q=>q.module===module).length,2);
 }
 for(const question of exam.questions){
  assert.ok(Array.isArray(question.options));
  assert.equal(question.options.length,4);
  assert.equal("correct" in question,false);
  const index=exam.answerKey[question.id];
  assert.equal(Number.isInteger(index),true);
  assert.ok(index>=0&&index<question.options.length);
 }
});

test("next final exam attempt avoids every immediately previous question when fresh alternatives exist",()=>{
 const first=buildExam(),previous=first.questions.map(q=>q.id),second=buildExam(previous);
 const overlap=second.questions.filter(q=>previous.includes(q.id));
 assert.equal(overlap.length,0);
});

test("final exam grade boundaries match BAIS mastery thresholds",()=>{
 assert.equal(gradeFor(92),1);
 assert.equal(gradeFor(81),2);
 assert.equal(gradeFor(67),3);
 assert.equal(gradeFor(50),4);
 assert.equal(gradeFor(49),5);
});
