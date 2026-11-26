export const sampleProject = Object.freeze({
  id: 'HTC-DEMO-01',
  customer: 'Sample household',
  property: 'Sample Brisbane townhouse',
  scope: 'Kitchen refresh',
  quoteCents: 485000,
});

export const visitWindows = Object.freeze({
  morning: '3 December 2026 · 07:30–09:30',
  afternoon: '3 December 2026 · 13:00–15:00',
});

export const businessSteps = Object.freeze([
  'quote.created',
  'quote.accepted',
  'job.scheduled',
  'job.completed',
  'invoice.issued',
  'invoice.payment-recorded',
]);

export function recordBusinessEvent(events, type, visitWindow) {
  if (type !== businessSteps[events.length] || !businessSteps.includes(type)) {
    throw new RangeError('This action is out of order for the sample project.');
  }
  const scheduling = type === 'job.scheduled';
  if (scheduling && !Object.hasOwn(visitWindows, visitWindow)) {
    throw new RangeError('Choose an available visit window.');
  }
  const event = { sequence: events.length + 1, projectId: sampleProject.id, type };
  if (scheduling) event.visitWindow = visitWindow;
  return [...events, Object.freeze(event)];
}

export function projectBusiness(events) {
  const kinds = new Set(events.map(event => event.type));
  const booking = events.find(event => event.type === 'job.scheduled');
  return {
    quote: kinds.has('quote.accepted') ? 'Accepted' : kinds.has('quote.created') ? 'Awaiting acceptance' : 'Ready to prepare',
    visit: booking ? visitWindows[booking.visitWindow] : 'Unscheduled',
    job: kinds.has('job.completed') ? 'Complete' : booking ? 'Scheduled' : 'Awaiting booking',
    invoice: kinds.has('invoice.payment-recorded') ? 'Sample payment recorded' : kinds.has('invoice.issued') ? 'Issued' : 'Awaiting completed work',
    next: businessSteps[events.length] ?? null,
  };
}
