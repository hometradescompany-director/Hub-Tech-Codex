export function renderSnapshot(container, snapshot) {
  container.querySelector("#phase").textContent = snapshot.phase.replaceAll("_", " ").toUpperCase();
  container.querySelector("#projection-copy").textContent = snapshot.active
    ? `A local fixture session is ${snapshot.phase}. Any shifted timing or choices are part of the simulation only.`
    : snapshot.phase === "verified_exit"
      ? "The session is safely reset. Canonical identity and authority were not changed."
      : snapshot.phase === "refused"
        ? "Participation was refused. Nothing was started."
        : "The participant fixture is outside. Start only with explicit consent.";
  container.querySelector("#modulation").value = String(Math.round(snapshot.modulationLevel * 100));
  container.querySelector("#modulation-value").value = `${Math.round(snapshot.modulationLevel * 100)}%`;
  for (const id of ["modulation", "apply", "choices", "recover", "tick", "cancel", "disconnect", "reset"]) {
    container.querySelector(`#${id}`).disabled = !snapshot.active;
  }
  if (snapshot.modulationLevel === 0) {
    renderChoices(container, {
      choices: ["Listen", "Reflect", "Rest"],
      simulatedDelayMs: 250
    });
  } else {
    container.querySelector("#simulated-delay").textContent =
      `Simulated response timing: ${Math.round(250 * (1 + snapshot.modulationLevel))} ms (not an actual wait)`;
  }
}

export function renderChoices(container, result) {
  const list = container.querySelector("#choice-list");
  list.replaceChildren(...result.choices.map(label => {
    const choice = document.createElement("span");
    choice.className = "choice";
    choice.textContent = label;
    return choice;
  }));
  container.querySelector("#simulated-delay").textContent =
    `Simulated response timing: ${result.simulatedDelayMs} ms (not an actual wait)`;
}
