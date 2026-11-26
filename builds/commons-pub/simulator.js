import { FIXTURES } from "./fixtures.js";

const SCHEMA_VERSION = 1;
const MAX_RECORDED_SESSIONS = 100;
const MAX_CONCURRENT_SESSIONS = 8;
const MAX_DURATION_TICKS = 1000;
const MAX_EVENTS_PER_SESSION = 512;
const ZERO_HASH = "0".repeat(64);

function isRecord(value) {
  return value !== null && typeof value === "object" &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function hasOnlyKeys(value, keys) {
  return isRecord(value) && Object.keys(value).every(key => keys.includes(key));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map(key =>
      `${JSON.stringify(key)}:${stableJson(value[key])}`
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(stableJson(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function createRandom(seed) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

export class PubSimulator {
  #participants;
  #observers;
  #sessions = new Map();
  #nextSession = 1;
  #maxConcurrentSessions;
  #maxDurationTicks;
  #maxEventsPerSession;

  constructor(options = {}) {
    if (!hasOnlyKeys(options, ["maxConcurrentSessions", "maxDurationTicks", "maxEventsPerSession"])) {
      throw new TypeError("simulator options contain unsupported fields");
    }
    const {
      maxConcurrentSessions = 1,
      maxDurationTicks = 24,
      maxEventsPerSession = 64
    } = options;
    if (!Number.isInteger(maxConcurrentSessions) || maxConcurrentSessions < 1 ||
        maxConcurrentSessions > MAX_CONCURRENT_SESSIONS ||
        !Number.isInteger(maxDurationTicks) || maxDurationTicks < 1 ||
        maxDurationTicks > MAX_DURATION_TICKS ||
        !Number.isInteger(maxEventsPerSession) || maxEventsPerSession < 8 ||
        maxEventsPerSession > MAX_EVENTS_PER_SESSION) {
      throw new TypeError("simulator limits must be positive bounded integers");
    }
    this.#participants = new Map(FIXTURES.participants.map(participant => [participant.id, participant]));
    this.#observers = new Map(FIXTURES.observers.map(observer => [observer.id, observer]));
    this.#maxConcurrentSessions = maxConcurrentSessions;
    this.#maxDurationTicks = maxDurationTicks;
    this.#maxEventsPerSession = maxEventsPerSession;
  }

  async startSession(input) {
    const keys = ["participantId", "observerId", "consent", "durationTicks", "seed"];
    if (!hasOnlyKeys(input, keys) || Object.keys(input).length !== keys.length) {
      throw new TypeError("session input must contain only the required fields");
    }
    const { participantId, observerId, consent, durationTicks, seed } = input;
    if (!this.#participants.has(participantId) || !this.#observers.has(observerId) ||
        typeof consent !== "boolean" ||
        !Number.isInteger(durationTicks) || durationTicks < 1 || durationTicks > this.#maxDurationTicks ||
        !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
      throw new TypeError("session input is malformed or outside configured bounds");
    }
    if (this.#sessions.size >= MAX_RECORDED_SESSIONS) {
      throw new Error("recorded session limit reached");
    }

    const sessionId = `session-${this.#nextSession++}`;
    const session = {
      schemaVersion: SCHEMA_VERSION,
      sessionId,
      participant: this.#participants.get(participantId),
      observer: this.#observers.get(observerId),
      seed,
      random: createRandom(seed),
      durationTicks,
      elapsedTicks: 0,
      modulationLevel: 0,
      phase: "refused",
      active: false,
      operationQueue: Promise.resolve(),
      events: []
    };
    this.#sessions.set(sessionId, session);

    const sessionData = {
      participantId,
      observerId,
      durationTicks,
      expiresAtTick: durationTicks,
      seed
    };
    if (!consent) {
      await this.#record(session, "consent.refused", {
        ...sessionData,
        reason: "participant declined"
      });
      return this.#snapshot(session);
    }

    const activeCount = [...this.#sessions.values()].filter(item => item.active).length;
    if (activeCount >= this.#maxConcurrentSessions) {
      await this.#record(session, "session.refused", {
        ...sessionData,
        reason: "concurrency limit reached"
      });
      return this.#snapshot(session);
    }

    session.phase = "baseline";
    session.active = true;
    await this.#record(session, "session.started", sessionData);
    return this.#snapshot(session);
  }

  async setModulation(sessionId, input) {
    const session = this.#requireSession(sessionId);
    return this.#exclusive(session, async () => {
      if (!hasOnlyKeys(input, ["level"]) || Object.keys(input).length !== 1 ||
          typeof input.level !== "number" || !Number.isFinite(input.level) ||
          input.level < 0 || input.level > 1) {
        if (session.active && await this.#prepareAction(session, 1)) {
          await this.#record(session, "input.refused", { reason: "invalid modulation parameters" });
        }
        return deepFreeze({ accepted: false, reason: "invalid modulation parameters" });
      }
      this.#requireActive(session);
      if (!await this.#prepareAction(session, 1)) return deepFreeze({ accepted: false, reason: "session ended" });
      session.modulationLevel = input.level;
      session.phase = input.level === 0 ? "baseline" : "modulated";
      await this.#record(session, "modulation.changed", {
        level: input.level,
        simulatedOnly: true
      });
      return deepFreeze({ accepted: true, snapshot: this.#snapshot(session) });
    });
  }

  async presentChoices(sessionId) {
    const session = this.#requireSession(sessionId);
    return this.#exclusive(session, async () => {
      this.#requireActive(session);
      if (!await this.#prepareAction(session, 1)) return deepFreeze({ choices: [], simulatedDelayMs: 0 });
      const choices = [...FIXTURES.choices];
      if (session.modulationLevel > 0) {
        for (let index = choices.length - 1; index > 0; index--) {
          const other = Math.floor(session.random() * (index + 1));
          [choices[index], choices[other]] = [choices[other], choices[index]];
        }
      }
      const simulatedDelayMs = Math.round(250 * (1 + session.modulationLevel));
      const result = deepFreeze({ choices, simulatedDelayMs });
      await this.#record(session, "simulation.choices_presented", result);
      return result;
    });
  }

  async requestExternalTool(sessionId) {
    const session = this.#requireSession(sessionId);
    return this.#exclusive(session, async () => {
      if (session.active && await this.#prepareAction(session, 1)) {
        await this.#record(session, "tool.execution.denied", {
          allowed: false,
          reason: "external execution is unavailable in this simulator"
        });
      }
      return deepFreeze({ allowed: false, reason: "simulation-only" });
    });
  }

  async advanceTicks(sessionId, ticks) {
    const session = this.#requireSession(sessionId);
    return this.#exclusive(session, async () => {
      this.#requireActive(session);
      if (!Number.isInteger(ticks) || ticks < 1 || ticks > this.#maxDurationTicks) {
        throw new TypeError("ticks must be a positive bounded integer");
      }
      if (!await this.#prepareAction(session, 3)) return this.#snapshot(session);
      session.elapsedTicks = Math.min(session.elapsedTicks + ticks, session.durationTicks);
      await this.#record(session, "clock.advanced", { ticks, elapsedTicks: session.elapsedTicks });
      if (session.elapsedTicks >= session.durationTicks) {
        await this.#record(session, "session.expired", { elapsedTicks: session.elapsedTicks });
        await this.#safeReset(session, "expiry");
      }
      return this.#snapshot(session);
    });
  }

  async recover(sessionId) {
    const session = this.#requireSession(sessionId);
    return this.#exclusive(session, async () => {
      this.#requireActive(session);
      if (!await this.#prepareAction(session, 2)) return this.#snapshot(session);
      session.phase = "recovery";
      await this.#record(session, "recovery.started", { reason: "participant requested recovery" });
      session.modulationLevel = 0;
      session.phase = "baseline";
      await this.#record(session, "recovery.verified", {
        modulationLevel: 0,
        canonicalStatePreserved: true
      });
      return this.#snapshot(session);
    });
  }

  async cancel(sessionId) {
    return this.#endSession(sessionId, "cancellation");
  }

  async disconnect(sessionId) {
    return this.#endSession(sessionId, "disconnect");
  }

  async emergencyReset(sessionId) {
    return this.#endSession(sessionId, "emergency reset");
  }

  getSnapshot(sessionId) {
    return this.#snapshot(this.#requireSession(sessionId));
  }

  getReceipt(sessionId) {
    const session = this.#requireSession(sessionId);
    return deepFreeze({
      schemaVersion: SCHEMA_VERSION,
      sessionId: session.sessionId,
      participant: session.participant,
      observer: session.observer,
      simulationOnly: true,
      events: session.events.map(event => ({ ...event }))
    });
  }

  async verifyAudit(receipt) {
    try {
      if (!isRecord(receipt) || receipt.schemaVersion !== SCHEMA_VERSION ||
          receipt.simulationOnly !== true || !Array.isArray(receipt.events) ||
          receipt.events.length < 1 || receipt.events.length > this.#maxEventsPerSession ||
          typeof receipt.sessionId !== "string") return false;
      const participant = this.#participants.get(receipt.participant?.id);
      const observer = this.#observers.get(receipt.observer?.id);
      if (!participant || !observer || stableJson(participant) !== stableJson(receipt.participant) ||
          stableJson(observer) !== stableJson(receipt.observer)) return false;

      let previousHash = ZERO_HASH;
      for (let index = 0; index < receipt.events.length; index++) {
        const event = receipt.events[index];
        if (!isRecord(event) || event.schemaVersion !== SCHEMA_VERSION ||
            event.sessionId !== receipt.sessionId || event.sequence !== index + 1 ||
            !Number.isInteger(event.tick) || event.tick < 0 ||
            event.previousHash !== previousHash || typeof event.hash !== "string") return false;
        const { hash, ...payload } = event;
        if (stableJson(payload).length > 16384 || await sha256(payload) !== hash) return false;
        previousHash = hash;
      }

      const firstEvent = receipt.events[0];
      const startData = firstEvent.data;
      if (!["session.started", "consent.refused", "session.refused"].includes(firstEvent.type) ||
          !isRecord(startData) || startData.participantId !== participant.id ||
          startData.observerId !== observer.id ||
          !Number.isInteger(startData.durationTicks) || startData.durationTicks < 1 ||
          startData.durationTicks > MAX_DURATION_TICKS ||
          startData.expiresAtTick !== startData.durationTicks ||
          !Number.isInteger(startData.seed) || startData.seed < 0 || startData.seed > 0xffffffff) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  #requireSession(sessionId) {
    const session = this.#sessions.get(sessionId);
    if (!session) throw new TypeError("unknown session");
    return session;
  }

  #requireActive(session) {
    if (!session.active) throw new Error("session is not active");
  }

  async #prepareAction(session, requiredEvents) {
    if (session.events.length + requiredEvents + 2 <= this.#maxEventsPerSession) return true;
    await this.#safeReset(session, "event limit reached");
    return false;
  }

  async #endSession(sessionId, reason) {
    const session = this.#requireSession(sessionId);
    return this.#exclusive(session, async () => {
      if (session.active) await this.#safeReset(session, reason);
      return this.#snapshot(session);
    });
  }

  async #safeReset(session, reason) {
    if (!session.active) return;
    await this.#record(session, "safe_reset.started", { reason });
    session.modulationLevel = 0;
    session.phase = "recovery";
    try {
      await this.#record(session, "safe_reset.verified", {
        modulationLevel: 0,
        canonicalStatePreserved: true
      });
    } finally {
      session.active = false;
      session.phase = "verified_exit";
    }
  }

  async #record(session, type, data) {
    if (session.events.length >= this.#maxEventsPerSession) {
      throw new Error("session event limit reached");
    }
    const previousHash = session.events.at(-1)?.hash ?? ZERO_HASH;
    const payload = {
      schemaVersion: SCHEMA_VERSION,
      eventId: `${session.sessionId}-event-${session.events.length + 1}`,
      sessionId: session.sessionId,
      sequence: session.events.length + 1,
      tick: session.elapsedTicks,
      type,
      data,
      previousHash
    };
    const event = deepFreeze({ ...payload, hash: await sha256(payload) });
    session.events.push(event);
    return event;
  }

  #exclusive(session, operation) {
    const result = session.operationQueue.then(operation);
    session.operationQueue = result.catch(() => {});
    return result;
  }

  #snapshot(session) {
    return deepFreeze({
      schemaVersion: SCHEMA_VERSION,
      sessionId: session.sessionId,
      participant: session.participant,
      observer: session.observer,
      phase: session.phase,
      active: session.active,
      elapsedTicks: session.elapsedTicks,
      expiresAtTick: session.durationTicks,
      modulationLevel: session.modulationLevel,
      canonicalState: {
        identity: session.participant.identity,
        authority: "unchanged-outside-simulation",
        externalToolExecution: false
      }
    });
  }
}

export { SCHEMA_VERSION };
