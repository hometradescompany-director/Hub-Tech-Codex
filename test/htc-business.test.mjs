import assert from 'node:assert/strict';
import test from 'node:test';
import { businessSteps, projectBusiness, recordBusinessEvent, sampleProject, visitWindows } from '../src/htc-business.mjs';
import { defaultDesign, kitchenBlocks } from '../src/htc-scene.mjs';

test('the sample job progresses in order and customer status uses the same events', () => {
  const initial = [];
  let events = initial;
  for (const step of businessSteps) events = recordBusinessEvent(events, step, 'afternoon');
  assert.deepEqual(initial, []);
  assert.ok(events.every((event, index) => event.sequence === index + 1 && event.projectId === sampleProject.id));
  assert.deepEqual(projectBusiness(events), {
    quote: 'Accepted',
    visit: visitWindows.afternoon,
    job: 'Complete',
    invoice: 'Sample payment recorded',
    next: null,
  });
  assert.equal(projectBusiness(events.slice(0, 4)).invoice, 'Awaiting completed work');
});

test('out-of-order actions and invalid visit windows produce no events', () => {
  assert.throws(() => recordBusinessEvent([], 'invoice.issued'), RangeError);
  const events = businessSteps.slice(0, 2).reduce((log, step) => recordBusinessEvent(log, step), []);
  assert.throws(() => recordBusinessEvent(events, 'quote.accepted'), RangeError);
  assert.throws(() => recordBusinessEvent(events, 'job.scheduled', 'toString'), RangeError);
  assert.equal(events.length, 2);
  assert.equal(projectBusiness(events).visit, 'Unscheduled');
});

test('layout and finish choices affect only the proposal scene', () => {
  const customized = { layout: 'island', cabinetry: 'navy', worktop: 'timber' };
  const original = kitchenBlocks(defaultDesign, true);
  assert.deepEqual(kitchenBlocks(customized, true), original);
  assert.notDeepEqual(kitchenBlocks(customized).slice(3), kitchenBlocks(defaultDesign).slice(3));
  assert.throws(() => kitchenBlocks({ ...defaultDesign, cabinetry: 'constructor' }), RangeError);
});
