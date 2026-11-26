function requiredFinite(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${field} must be a finite number`);
  }
  return value;
}

function nonNegative(value, field) {
  requiredFinite(value, field);
  if (value < 0) throw new TypeError(`${field} must be >= 0`);
  return value;
}

function boundedRatio(value, field) {
  requiredFinite(value, field);
  if (value < 0 || value > 1) {
    throw new TypeError(`${field} must be between 0 and 1`);
  }
  return value;
}

/**
 * Summarise already-observed corridor intervals.
 *
 * This function is deliberately descriptive. It does not infer that a posted
 * speed limit caused any observed outcome. Causal evaluation requires matched
 * or otherwise controlled field evidence.
 */
export function summarizeCorridorScenario(intervals) {
  if (!Array.isArray(intervals) || intervals.length === 0) {
    throw new TypeError("intervals must be a non-empty array");
  }

  let flowVehicleHours = 0;
  let queueVehicleMinutes = 0;
  let travelTimeVehicleMinutes = 0;
  let mergeAttempts = 0;
  let mergeSuccesses = 0;
  let durationHours = 0;
  const postedSpeedLimits = new Set();

  for (const [index, row] of intervals.entries()) {
    if (!row || typeof row !== "object") {
      throw new TypeError(`intervals[${index}] must be an object`);
    }

    const durationMinutes = nonNegative(row.durationMinutes, `intervals[${index}].durationMinutes`);
    if (durationMinutes === 0) {
      throw new TypeError(`intervals[${index}].durationMinutes must be > 0`);
    }

    const flowVph = nonNegative(row.flowVph, `intervals[${index}].flowVph`);
    const queueVehicles = nonNegative(row.queueVehicles, `intervals[${index}].queueVehicles`);
    const meanTravelTimeMinutes = nonNegative(
      row.meanTravelTimeMinutes,
      `intervals[${index}].meanTravelTimeMinutes`
    );
    const attempts = nonNegative(row.mergeAttempts, `intervals[${index}].mergeAttempts`);
    const successRatio = boundedRatio(
      row.mergeSuccessRatio,
      `intervals[${index}].mergeSuccessRatio`
    );
    const postedSpeedKph = nonNegative(
      row.postedSpeedKph,
      `intervals[${index}].postedSpeedKph`
    );

    const hours = durationMinutes / 60;
    durationHours += hours;
    flowVehicleHours += flowVph * hours;
    queueVehicleMinutes += queueVehicles * durationMinutes;
    travelTimeVehicleMinutes += meanTravelTimeMinutes * flowVph * hours;
    mergeAttempts += attempts;
    mergeSuccesses += attempts * successRatio;
    postedSpeedLimits.add(postedSpeedKph);
  }

  const throughputVehicles = flowVehicleHours;
  const weightedMeanTravelTimeMinutes =
    throughputVehicles === 0 ? null : travelTimeVehicleMinutes / throughputVehicles;
  const meanQueueVehicles =
    durationHours === 0 ? null : queueVehicleMinutes / (durationHours * 60);
  const mergeSuccessRatio = mergeAttempts === 0 ? null : mergeSuccesses / mergeAttempts;

  return Object.freeze({
    intervalCount: intervals.length,
    durationMinutes: durationHours * 60,
    postedSpeedLimitsKph: Object.freeze([...postedSpeedLimits].sort((a, b) => a - b)),
    throughputVehicles,
    meanFlowVph: durationHours === 0 ? null : throughputVehicles / durationHours,
    meanQueueVehicles,
    weightedMeanTravelTimeMinutes,
    mergeAttempts,
    mergeSuccessRatio,
  });
}

/**
 * Compare two descriptive summaries without declaring causality.
 * Positive throughputDeltaVehicles means candidate moved more vehicles.
 * Negative queue/travel-time deltas mean candidate was better on those metrics.
 */
export function compareCorridorScenarios(reference, candidate) {
  if (!reference || !candidate) {
    throw new TypeError("reference and candidate summaries are required");
  }
  const optionalDelta = (field) =>
    reference[field] === null || candidate[field] === null
      ? null
      : candidate[field] - reference[field];

  return Object.freeze({
    throughputDeltaVehicles:
      candidate.throughputVehicles - reference.throughputVehicles,
    meanFlowDeltaVph:
      candidate.meanFlowVph - reference.meanFlowVph,
    meanQueueDeltaVehicles:
      candidate.meanQueueVehicles - reference.meanQueueVehicles,
    travelTimeDeltaMinutes:
      optionalDelta("weightedMeanTravelTimeMinutes"),
    mergeSuccessDelta:
      optionalDelta("mergeSuccessRatio"),
    causalConclusion: "not-established",
  });
}
