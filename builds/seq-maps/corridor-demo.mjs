import { summarizeCorridorScenario } from './variable-speed-proof.mjs';

const table = document.querySelector('#corridor-metrics');
const status = document.querySelector('#corridor-status');
const number = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 });
const percentage = new Intl.NumberFormat('en-AU', { style: 'percent', maximumFractionDigits: 1 });

try {
  const response = await fetch(new URL('./m1-variable-speed.synthetic.json', import.meta.url));
  if (!response.ok) throw new Error('The bundled fixture is unavailable');
  const fixture = await response.json();
  if (fixture.standing !== 'synthetic-illustrative-only') {
    throw new Error('A synthetic fixture is required');
  }
  const scenarios = [fixture.scenarios.posted_60, fixture.scenarios.posted_80]
    .map(summarizeCorridorScenario);
  const metrics = [
    ['Throughput (vehicles)', 'throughputVehicles', number],
    ['Mean queue (vehicles)', 'meanQueueVehicles', number],
    ['Weighted mean travel time (minutes)', 'weightedMeanTravelTimeMinutes', number],
    ['Merge success rate', 'mergeSuccessRatio', percentage],
  ];

  for (const [label, key, formatter] of metrics) {
    const row = table.tBodies[0].insertRow();
    const heading = document.createElement('th');
    heading.scope = 'row';
    heading.textContent = label;
    row.append(heading);
    for (const scenario of scenarios) {
      const value = scenario[key];
      row.insertCell().textContent = value === null ? 'Unavailable' : formatter.format(value);
    }
  }
  table.hidden = false;
  status.textContent = 'Comparison ready.';
} catch {
  status.textContent = 'The bundled fixture could not be evaluated.';
}
