require('./register.cjs');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {hydrateState,parseState}=require('../src/state/persistence.ts');
const exercise={id:'bench',name:'Bench Press',muscle:'Chest',equipment:'Barbell',sets:3,reps:10,weight:20,progression:2.5};
test('migrates legacy routine, notes, recent, preferences and weekly muscle names',()=>{
 const old={routine:[exercise],notes:{'front:chest':'keep'},recent:{'front:chest':100},theme:'neon',mode:'recovery',weeklyPlan:{'1':['Chest']}};
 const state=hydrateState([['fitmap.native.v1',JSON.stringify(old)]]);
 assert.deepEqual(state.routine,[exercise]); assert.deepEqual(state.notes,old.notes); assert.deepEqual(state.recent,old.recent); assert.equal(state.theme,'neon'); assert.equal(state.mode,'recovery');
 assert.deepEqual(state.schedule[1],{enabled:true,hour:18,minute:0,muscles:['chest']});assert.equal(state.reminders.enabled,false);
});
test('versioned keys override legacy without resurrecting removed workouts',()=>{
 const state=hydrateState([['fitmap.native.v1',JSON.stringify({routine:[exercise]})],['fitmap.routine.v1','[]'],['fitmap.prefs.v1',JSON.stringify({reminders:{enabled:true,private:true}})]]);
 assert.deepEqual(state.routine,[]);assert.deepEqual(state.reminders,{enabled:true,private:true});
});
test('invalid JSON falls back safely and stored bodyweight loads as zero',()=>{
 const state=hydrateState([['fitmap.native.v1',JSON.stringify({routine:[{...exercise,equipment:'Bodyweight',weight:30}]})],['fitmap.routine.v1','{broken']]);
 assert.equal(state.routine[0].weight,0);assert.deepEqual(parseState('{broken').routine,[]);
});
