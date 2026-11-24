require('./register.cjs');
const { test } = require('node:test'), assert = require('node:assert/strict');
const { todayCard, weekDates, copyDay } = require('../src/shared/plan-layout.ts');
const { initial } = require('../src/state/persistence.ts');
const { newWorkout, toggleSet } = require('../src/shared/workout.ts');
const { finishSession, localDate } = require('../src/shared/sessions.ts');
const { insertSessionExercise } = require('../src/shared/session-picker.ts');
const e = { id:'bench',name:'Bench Press',muscle:'Chest',equipment:'Barbell',sets:3,reps:8,weight:15,progression:2.5,days:[0] };
test('Today card precedence: running, done, planned, nothing planned', () => {
  const now = new Date(2026,10,23,12), base = {...initial,now,routine:[e]}, planned = {...base,schedule:base.schedule.map((p,i)=>({...p,on:i===0}))};
  assert.equal(todayCard({...base,routine:[{...e,days:[]}]}).kind,'empty');
  assert.equal(todayCard(base).kind,'planned'); // Remind me off never hides assigned exercises.
  assert.equal(todayCard(planned).kind,'planned');
  const w = newWorkout([e],+now), h = finishSession(toggleSet(w,e.id,0,+now),+now+100);
  const done = {...base,history:[h],routine:[]};
  assert.equal(todayCard(done).kind,'done');
  assert.equal(todayCard({...done,workout:w}).kind,'running');
  assert.equal(todayCard({...planned,history:[h,{...h,id:'second'}]}).sessions,2);
});
test('week dates are Monday first with real month/year rollover and offsets', () => {
  const now = new Date(2027,0,3,23);
  assert.deepEqual(weekDates(now).map(localDate),['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']);
  assert.equal(localDate(weekDates(now,1)[0]),'2027-01-04');
  assert.equal(localDate(weekDates(now,-1)[0]),'2026-12-21');
});
test('day copy replaces destination only, preserves source, values and snapshots', () => {
  const routine = [{...e,days:[0,4]},{...e,id:'fly',days:[2,3]}], schedule = initial.schedule.map((p,i)=>({...p,on:i===0,time:i===0?'19:30':'18:00'}));
  const before = JSON.stringify({routine,schedule}), result = copyDay(routine,schedule,0,2);
  assert.deepEqual(result.routine.map(e=>e.days),[[0,2,4],[3]]);
  assert.deepEqual(result.schedule[2],{on:true,time:'19:30'});
  assert.equal(result.routine[0].weight,15);
  assert.equal(JSON.stringify({routine,schedule}),before);
  assert.deepEqual(copyDay(routine,schedule,0,0),{routine,schedule});
  assert.deepEqual(copyDay(routine,schedule,0,9),{routine,schedule});
  assert.ok(initial.schedule.every(p=>!p.on));
});
test('model picker inserts after current, keeps session and set progress, rejects duplicates', () => {
  const w = toggleSet(newWorkout([e,{...e,id:'last'}],1000),e.id,0,1000);
  const added = {...e,id:'new'}, next = insertSessionExercise(w,added,e.id);
  assert.deepEqual(next.exercises.map(e=>e.id),['bench','new','last']);
  assert.equal(next.id,w.id); assert.equal(next.restUntil,w.restUntil);
  assert.deepEqual(next.completed.bench,[0]); assert.deepEqual(next.completed.new,[]);
  assert.equal(insertSessionExercise(next,added,e.id),next);
  added.days.push(3); assert.deepEqual(next.exercises[1].days,[0]);
  assert.equal(w.exercises.length,2);
});
