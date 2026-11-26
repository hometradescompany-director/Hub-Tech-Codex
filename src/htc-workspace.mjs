import { projectBusiness, recordBusinessEvent, sampleProject, visitWindows } from './htc-business.mjs';
import { defaultDesign, drawKitchen } from './htc-scene.mjs';

const actionLabels = {
  'quote.created': 'Prepare sample quote',
  'quote.accepted': 'Accept sample quote',
  'job.scheduled': 'Schedule sample job',
  'job.completed': 'Complete sample job',
  'invoice.issued': 'Issue sample invoice',
  'invoice.payment-recorded': 'Record sample payment',
};
const eventLabels = {
  'quote.created': 'Sample quote prepared',
  'quote.accepted': 'Sample quote accepted',
  'job.scheduled': 'Sample job scheduled',
  'job.completed': 'Sample job completed',
  'invoice.issued': 'Sample invoice issued',
  'invoice.payment-recorded': 'Sample payment recorded',
};

const element = id => document.getElementById(id);
const nextAction = element('next-action');
const reset = element('reset-project');
const visitWindow = element('visit-window');
const timeline = element('timeline');
const message = element('job-message');
const canvas = element('kitchen-scene');
const angle = element('view-angle');
const settings = Object.keys(defaultDesign);
let events = [];

element('project-id').textContent = sampleProject.id;
element('project-scope').textContent = sampleProject.scope;
element('customer').textContent = sampleProject.customer;
element('property').textContent = sampleProject.property;
element('amount').textContent = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })
  .format(sampleProject.quoteCents / 100);
for (const [id, label] of Object.entries(visitWindows)) visitWindow.add(new Option(label, id));
for (const key of settings) element(key).value = defaultDesign[key];

function renderOperations() {
  const state = projectBusiness(events);
  element('quote-status').textContent = state.quote;
  element('visit-status').textContent = state.visit;
  element('job-status').textContent = state.job;
  element('invoice-status').textContent = state.invoice;
  element('booking').hidden = state.next !== 'job.scheduled';
  element('timeline-empty').hidden = events.length > 0;
  reset.hidden = events.length === 0;
  nextAction.disabled = state.next === null;
  nextAction.textContent = actionLabels[state.next] ?? 'Sample workflow complete';
  timeline.replaceChildren(...events.map(event => {
    const item = document.createElement('li');
    const visit = event.visitWindow ? ' · ' + visitWindows[event.visitWindow] : '';
    item.textContent = eventLabels[event.type] + visit;
    return item;
  }));
}

nextAction.addEventListener('click', () => {
  try {
    const { next } = projectBusiness(events);
    events = recordBusinessEvent(events, next, visitWindow.value);
    renderOperations();
    message.textContent = eventLabels[next] + '.';
    if (next === 'quote.accepted') visitWindow.focus();
    if (nextAction.disabled) reset.focus();
  } catch (error) {
    message.textContent = error.message;
  }
});

reset.addEventListener('click', () => {
  events = [];
  visitWindow.selectedIndex = 0;
  renderOperations();
  message.textContent = 'Sample project reset.';
  nextAction.focus();
});

function proposal() {
  return Object.fromEntries(settings.map(key => [key, element(key).value]));
}

function renderDesign() {
  const before = document.querySelector('input[name="design-view"]:checked').value === 'before';
  const rendered = drawKitchen(canvas, proposal(), { before, angle: Number(angle.value) * Math.PI / 180 });
  element('finish-options').disabled = before;
  const selection = settings.map(key => element(key).selectedOptions[0].text);
  const summary = before ? 'Before · galley layout, original cabinetry and worktop' : 'Proposal · ' + selection.join(' · ');
  element('design-summary').textContent = rendered ? summary : summary + ' · canvas unavailable';
}

for (const control of document.querySelectorAll('#visual-studio select, input[name="design-view"]')) {
  control.addEventListener('change', renderDesign);
}
angle.addEventListener('input', renderDesign);
new ResizeObserver(renderDesign).observe(canvas);

element('download-design').addEventListener('click', () => {
  const configuration = { contract: 'htc-design-preview/v1', projectId: sampleProject.id, ...proposal() };
  const url = URL.createObjectURL(new Blob([JSON.stringify(configuration, null, 2) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'htc-sample-design.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
renderOperations();
renderDesign();
