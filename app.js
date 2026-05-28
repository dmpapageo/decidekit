const defaults = {
  decision: "Which project should I build this weekend?",
  criteria: [
    { id: crypto.randomUUID(), name: "Useful", weight: 9 },
    { id: crypto.randomUUID(), name: "Fast to ship", weight: 8 },
    { id: crypto.randomUUID(), name: "Fun", weight: 7 },
    { id: crypto.randomUUID(), name: "Shareable", weight: 6 },
  ],
  options: [
    {
      id: crypto.randomUUID(),
      name: "Decision helper",
      scores: {},
    },
    {
      id: crypto.randomUUID(),
      name: "Invoice generator",
      scores: {},
    },
    {
      id: crypto.randomUUID(),
      name: "Landing page reviewer",
      scores: {},
    },
  ],
};

const demoScores = [
  [8, 10, 7, 8],
  [9, 8, 5, 4],
  [8, 6, 9, 10],
];

let state = hydrateDefaults();

const els = {
  decisionName: document.querySelector("#decisionName"),
  optionsList: document.querySelector("#optionsList"),
  criteriaList: document.querySelector("#criteriaList"),
  resultsList: document.querySelector("#resultsList"),
  winnerLine: document.querySelector("#winnerLine"),
  addOption: document.querySelector("#addOption"),
  addCriterion: document.querySelector("#addCriterion"),
  resetButton: document.querySelector("#resetButton"),
  copyButton: document.querySelector("#copyButton"),
  optionTemplate: document.querySelector("#optionTemplate"),
  criterionTemplate: document.querySelector("#criterionTemplate"),
};

function hydrateDefaults() {
  const copy = structuredClone(defaults);
  copy.options.forEach((option, optionIndex) => {
    copy.criteria.forEach((criterion, criterionIndex) => {
      option.scores[criterion.id] = demoScores[optionIndex][criterionIndex];
    });
  });
  return copy;
}

function normalizeScores() {
  state.options.forEach((option) => {
    state.criteria.forEach((criterion) => {
      if (option.scores[criterion.id] === undefined) option.scores[criterion.id] = 0;
    });
  });
}

function calculateResults() {
  const totalWeight = state.criteria.reduce((sum, criterion) => sum + criterion.weight, 0) || 1;
  return state.options
    .map((option) => {
      const weighted = state.criteria.reduce((sum, criterion) => {
        return sum + (option.scores[criterion.id] || 0) * criterion.weight;
      }, 0);
      return {
        id: option.id,
        name: option.name.trim() || "Untitled option",
        score: Math.round((weighted / totalWeight) * 10) / 10,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function render() {
  normalizeScores();
  els.decisionName.value = state.decision;
  renderCriteria();
  renderOptions();
  renderResults();
  updateResetState();
}

function renderCriteria() {
  els.criteriaList.replaceChildren();
  state.criteria.forEach((criterion) => {
    const node = els.criterionTemplate.content.firstElementChild.cloneNode(true);
    const name = node.querySelector(".criterion-name");
    const weight = node.querySelector(".criterion-weight");
    const value = node.querySelector(".weight-value");

    name.value = criterion.name;
    weight.value = criterion.weight;
    value.textContent = criterion.weight;

    name.addEventListener("input", () => {
      criterion.name = name.value;
      renderOptions();
      renderResults();
      updateResetState();
    });
    weight.addEventListener("input", () => {
      criterion.weight = Number(weight.value);
      value.textContent = criterion.weight;
      renderResults();
      updateResetState();
    });
    node.querySelector(".remove").addEventListener("click", () => {
      if (state.criteria.length === 1) return;
      state.criteria = state.criteria.filter((item) => item.id !== criterion.id);
      render();
    });

    els.criteriaList.append(node);
  });
}

function renderOptions() {
  els.optionsList.replaceChildren();
  state.options.forEach((option) => {
    const node = els.optionTemplate.content.firstElementChild.cloneNode(true);
    const name = node.querySelector(".option-name");
    const scoreList = node.querySelector(".score-list");
    name.value = option.name;

    name.addEventListener("input", () => {
      option.name = name.value;
      renderResults();
      updateResetState();
    });
    node.querySelector(".remove").addEventListener("click", () => {
      if (state.options.length === 1) return;
      state.options = state.options.filter((item) => item.id !== option.id);
      render();
    });

    state.criteria.forEach((criterion) => {
      const row = document.createElement("label");
      row.className = "score-row";
      row.innerHTML = `
        <span title="${escapeHtml(criterion.name)}">${escapeHtml(criterion.name)}</span>
        <input type="range" min="0" max="10" step="1" value="${option.scores[criterion.id]}">
        <strong>${option.scores[criterion.id]}</strong>
      `;
      const input = row.querySelector("input");
      const value = row.querySelector("strong");
      input.addEventListener("input", () => {
        option.scores[criterion.id] = Number(input.value);
        value.textContent = input.value;
        renderResults();
        updateResetState();
      });
      scoreList.append(row);
    });

    els.optionsList.append(node);
  });
}

function renderResults() {
  const results = calculateResults();
  const best = results[0];
  els.winnerLine.textContent = best
    ? `${best.name} is currently leading with ${best.score}/100.`
    : "";
  els.resultsList.replaceChildren();

  const topScore = Math.max(...results.map((result) => result.score), 1);
  results.forEach((result, index) => {
    const node = document.createElement("article");
    node.className = "result-card";
    node.innerHTML = `
      <span class="rank">${index + 1}</span>
      <span class="result-name">${escapeHtml(result.name)}</span>
      <span class="result-score">${result.score}/100</span>
      <span class="bar"><span style="width: ${(result.score / topScore) * 100}%"></span></span>
    `;
    els.resultsList.append(node);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char];
  });
}

function isClearedState() {
  return state.criteria.every((criterion) => criterion.weight === 0) &&
    state.options.every((option) => {
      return state.criteria.every((criterion) => (option.scores[criterion.id] || 0) === 0);
    });
}

function updateResetState() {
  els.resetButton.textContent = isClearedState() ? "Reset" : "Reset changes";
}

function addOption() {
  const scores = {};
  state.criteria.forEach((criterion) => {
    scores[criterion.id] = 0;
  });
  state.options.push({
    id: crypto.randomUUID(),
    name: `Option ${state.options.length + 1}`,
    scores,
  });
  render();
}

function addCriterion() {
  const criterion = {
    id: crypto.randomUUID(),
    name: `Criterion ${state.criteria.length + 1}`,
    weight: 0,
  };
  state.criteria.push(criterion);
  state.options.forEach((option) => {
    option.scores[criterion.id] = 0;
  });
  render();
}

function resetChanges() {
  state.criteria.forEach((criterion) => {
    criterion.weight = 0;
  });
  state.options.forEach((option) => {
    state.criteria.forEach((criterion) => {
      option.scores[criterion.id] = 0;
    });
  });
}

async function copySummary() {
  const lines = [
    state.decision,
    "",
    ...calculateResults().map((result, index) => {
      return `${index + 1}. ${result.name}: ${result.score}/100`;
    }),
  ];
  await copyText(lines.join("\n"));
  els.copyButton.textContent = "Copied";
  setTimeout(() => {
    els.copyButton.textContent = "Copy summary";
  }, 1300);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

els.decisionName.addEventListener("input", () => {
  state.decision = els.decisionName.value;
  updateResetState();
});
els.addOption.addEventListener("click", addOption);
els.addCriterion.addEventListener("click", addCriterion);
els.resetButton.addEventListener("click", () => {
  resetChanges();
  render();
  els.resetButton.textContent = "Reset done";
  setTimeout(updateResetState, 1100);
});
els.copyButton.addEventListener("click", copySummary);

render();
