require('./register.cjs');
process.env.TZ='America/New_York';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSchedule, planReminders, dateKey, normalizeLog, normalizeSkips, validDateKey } = require('../src/notify/scheduler.ts');
const exercise = { id:'bench',days:[0,1,2,3,4,5,6], name:'Bench Press', muscle:'Chest', equipment:'Barbell', sets:3,reps:10,weight:20,progression:2.5 };
function options() {return { now:new Date(2026,10,21,9), routine:[exercise], schedule:normalizeSchedule(Array.from({length:7},()=>({on:true,time:'18:00'}))), history:[], skips:{}, prefs:{enabled:true,private:false}};}
test('normalizes seven days and rejects malformed times and IDs',()=>{const s=normalizeSchedule([{on:1,time:'25:99'}]);assert.equal(s.length,7);assert.deepEqual(s[0],{on:false,time:'18:00'});});
test('schedules exactly 28 future local dates with unique identifiers',()=>{const p=planReminders(options());assert.equal(p.length,28);assert.equal(new Set(p.map(x=>x.identifier)).size,28);assert.equal(dateKey(p[27].date),'2026-12-18');});
test('omits elapsed times today',()=>{const o=options();o.now.setHours(19);assert.equal(planReminders(o).length,27);});
test('omits logged and skipped days',()=>{const o=options();o.history.push({id:'one',startedAt:o.now.getTime(),endedAt:o.now.getTime(),durationSec:0,weekday:5,exercises:[],migrated:true,muscles:['Chest']});o.skips['2026-11-22']=true;assert.equal(planReminders(o).length,26);});
test('off days and empty routines create no reminders',()=>{const o=options();o.schedule.forEach(d=>d.on=false);assert.equal(planReminders(o).length,0);o.schedule=options().schedule;o.routine=[];assert.equal(planReminders(o).length,0);});
test('master switch disables all reminders',()=>{const o=options();o.prefs.enabled=false;assert.deepEqual(planReminders(o),[]);});
test('privacy hides workout detail and edits change scheduled content',()=>{const o=options();assert.match(planReminders(o)[0].body,/Chest: 1 exercise/);o.prefs.private=true;assert.doesNotMatch(planReminders(o)[0].body,/Chest|Bench/);});
test('calendar dates survive DST windows and malformed stored history is rejected',()=>{const o=options();o.now=new Date(2026,2,1,9);const p=planReminders(o);assert.equal(p.length,28);assert.ok(p.every(x=>x.date.getHours()===18));assert.equal(validDateKey('2026-02-30'),false);assert.deepEqual(normalizeSkips({'bad':true,'2026-11-21':true}),{'2026-11-21':true});assert.deepEqual(normalizeLog({'2026-11-21':{at:'bad',muscles:[]}}),{});});
