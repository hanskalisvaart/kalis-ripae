let piggybank = [];
let currentItem = 0;
let selectedCurrency = "EUR";

fetch("/data/piggybank.json")
  .then((response) => {
    if (!response.ok) throw new Error("JSON file not found");
    return response.json();
  })
  .then((data) => {
    piggybank = data;
    piggybank.forEach((_, index) => calculateMonthsToTargetAndMonthlySavings(index));
    displayPiggybank();
    updateDataTypeOptions();
    displayChart();
  })
  .catch((error) => {
    console.log(error);
    piggybank = getDefaultData();
    piggybank.forEach((_, index) => calculateMonthsToTargetAndMonthlySavings(index));
    displayPiggybank();
    updateDataTypeOptions();
    displayChart();
  });

function getDefaultData() {
  const future = (monthsAhead) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsAhead);
    return d.toISOString().split("T")[0];
  };
  return [
    { name: "product1", amount: 0, target: 100, targetDate: future(3) },
    { name: "product2", amount: 0, target: 150, targetDate: future(6) },
    { name: "product3", amount: 0, target: 200, targetDate: future(9) },
    { name: "product4", amount: 0, target: 250, targetDate: future(12) },
    { name: "product5", amount: 0, target: 300, targetDate: future(15) },
  ];
}

function addProduct() {
  const productName = document.getElementById("product-name").value.trim();
  const targetAmount = parseFloat(document.getElementById("target-amount").value);
  const targetDateValue = document.getElementById("target-date").value;

  if (productName && !isNaN(targetAmount) && targetDateValue) {
    piggybank.push({ name: productName, amount: 0, target: targetAmount, targetDate: targetDateValue });
    calculateMonthsToTargetAndMonthlySavings(piggybank.length - 1);
    document.getElementById("product-name").value = "";
    document.getElementById("target-amount").value = "";
    document.getElementById("target-date").value = "";
    displayPiggybank();
    updateDataTypeOptions();
    displayChart();
  }
}

function removeProduct(index) {
  if (confirm("Are you sure you want to remove this product?")) {
    piggybank.splice(index, 1);
    displayPiggybank();
    updateDataTypeOptions();
    displayChart();
  }
}

function saveResults() {
  fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(piggybank),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to save data");
      alert("Piggy bank data saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving piggy bank data:", error);
      alert("An error occurred while saving. Please try again later.");
    });
}

document.getElementById("backup-data").addEventListener("click", () => {
  window.location.href = "/api/backup";
});

function calculateMonthsToTargetAndMonthlySavings(item) {
  const targetDate = new Date(piggybank[item].targetDate);
  const currentDate = new Date();
  const monthsToTarget = Math.round((targetDate - currentDate) / (1000 * 60 * 60 * 24 * 30));
  piggybank[item].monthsToTarget = monthsToTarget;
  piggybank[item].monthlySavings =
    monthsToTarget <= 0
      ? piggybank[item].target - piggybank[item].amount
      : (piggybank[item].target - piggybank[item].amount) / monthsToTarget;
}

// ── Formatting helpers ────────────────────────────────────────────────────────
const currencySymbols = {
  USD: "$", EUR: "€", JPY: "¥", GBP: "£",
  AUD: "A$", CAD: "C$", CHF: "CHF", CNY: "¥", HKD: "HK$", NZD: "NZ$",
};

function formatCurrency(value) {
  const symbol = currencySymbols[selectedCurrency] || "€";
  return `<span class="currency-symbol">${symbol} </span>${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function renderProgressBar(amount, target) {
  const isComplete = amount >= target;
  const pct = target > 0 ? Math.min((amount / target) * 100, 100) : 0;
  const displayPct = Math.round(pct);
  // Interpolate red(0°) → orange(30°) → green(120°)
  const hue = Math.round((pct / 100) * 120);
  const barColor = isComplete ? "#2896c9" : `hsl(${hue}, 70%, 42%)`;

  return `
    <div class="progress-wrap" title="${displayPct}% of target reached">
      <div class="progress-bar" style="width:${pct}%; background:${barColor};">
        <span class="progress-label">${isComplete ? "✓" : displayPct + "%"}</span>
      </div>
    </div>`;
}

// ── Table rendering ───────────────────────────────────────────────────────────
function displayPiggybank() {
  let tableData = "";
  let totalSaved = 0, totalTarget = 0, totalMonthly = 0, totalRemaining = 0;

  for (let item in piggybank) {
    const g = piggybank[item];
    const isComplete = g.amount >= g.target;
    const remaining = Math.max(g.target - g.amount, 0);
    const isPastDue = !isComplete && g.monthsToTarget <= 0;

    totalSaved     += g.amount;
    totalTarget    += g.target;
    totalMonthly   += g.monthlySavings;
    totalRemaining += remaining;

    const targetDate = new Date(g.targetDate);
    const dateStr = targetDate.toLocaleDateString("en-GB", {
      timeZone: "UTC", year: "numeric", month: "short", day: "numeric",
    });

    let rowClass = isComplete ? "goal-complete" : isPastDue ? "past-due" : "";
    let monthsCell = isComplete
      ? `<span class="badge-complete">✓ Complete</span>`
      : isPastDue
      ? `<span class="badge-overdue">⚠ Overdue</span>`
      : g.monthsToTarget;

    tableData += `
      <tr id="row-${item}" ${rowClass ? `class="${rowClass}"` : ""}>
        <td class="td-name">
          <span id="product-name-${item}">${g.name}</span>
          ${renderProgressBar(g.amount, g.target)}
        </td>
        <td data-label="Saved">${formatCurrency(g.amount)}</td>
        <td data-label="Target">${formatCurrency(g.target)}</td>
        <td data-label="Remaining" class="td-remaining">${isComplete ? "—" : formatCurrency(remaining)}</td>
        <td data-label="Target Date">${dateStr}</td>
        <td data-label="Months Left">${monthsCell}</td>
        <td data-label="Monthly">${isComplete ? "—" : formatCurrency(g.monthlySavings)}</td>
        <td class="td-actions">
          <button title="Move Up"    id="move-up-${item}"><span class="iconify" data-icon="material-symbols:arrow-circle-up-outline-rounded"></span></button>
          <button title="Edit"       id="change-name-${item}"><span class="iconify" data-icon="material-symbols:edit"></span></button>
          <button title="Move Down"  id="move-down-${item}"><span class="iconify" data-icon="material-symbols:arrow-circle-down-outline-rounded"></span></button>
          <button title="Remove"     id="remove-${item}"><span class="iconify" data-icon="material-symbols:delete-forever-outline"></span></button>
        </td>
      </tr>`;
  }

  const footerRow = `
    <tr>
      <td><strong>Total</strong></td>
      <td><strong>${formatCurrency(totalSaved)}</strong></td>
      <td><strong>${formatCurrency(totalTarget)}</strong></td>
      <td><strong>${formatCurrency(totalRemaining)}</strong></td>
      <td></td><td></td>
      <td><strong>${formatCurrency(totalMonthly)}</strong></td>
      <td></td>
    </tr>`;

  document.getElementById("piggybank-table").innerHTML = `
    <thead><tr>
      <th>Product</th>
      <th>Amount Saved</th>
      <th>Target</th>
      <th>Remaining</th>
      <th>Target Date</th>
      <th>Months Left</th>
      <th>Monthly Allocation</th>
      <th>Actions</th>
    </tr></thead>
    <tbody>${tableData}</tbody>
    <tfoot>${footerRow}</tfoot>`;

  // Event listeners
  for (let item in piggybank) {
    const idx = Number(item);

    document.getElementById(`move-up-${item}`).addEventListener("click", () => {
      if (idx > 0) {
        [piggybank[idx], piggybank[idx - 1]] = [piggybank[idx - 1], piggybank[idx]];
        displayPiggybank(); updateDataTypeOptions(); displayChart();
      }
    });
    document.getElementById(`move-down-${item}`).addEventListener("click", () => {
      if (idx < piggybank.length - 1) {
        [piggybank[idx], piggybank[idx + 1]] = [piggybank[idx + 1], piggybank[idx]];
        displayPiggybank(); updateDataTypeOptions(); displayChart();
      }
    });
    document.getElementById(`change-name-${item}`).addEventListener("click", () => {
      currentItem = idx;
      productEdit(idx);
    });
    document.getElementById(`remove-${item}`).addEventListener("click", () => {
      removeProduct(idx);
    });
  }
}

// ── Edit popup ────────────────────────────────────────────────────────────────
const popupDiv = document.createElement("div");
popupDiv.id = "change-name-popup";
popupDiv.style.display = "none";
popupDiv.innerHTML = `
  <div id="popup-content">
    <label for="new-product-name">Product Name:</label>
    <input type="text" id="new-product-name">
    <label for="new-amount-saved">Amount Saved:</label>
    <input type="number" id="new-amount-saved">
    <label for="new-target-amount">Target Amount:</label>
    <input type="number" id="new-target-amount">
    <label for="new-target-date">Target Date:</label>
    <input type="date" id="new-target-date">
    <button id="confirm-change">Confirm</button>
    <button id="cancel-change">Cancel</button>
  </div>`;
document.body.appendChild(popupDiv);

const popup = document.getElementById("change-name-popup");

function productEdit(item) {
  document.getElementById("new-product-name").value  = piggybank[item].name;
  document.getElementById("new-amount-saved").value  = piggybank[item].amount;
  document.getElementById("new-target-amount").value = piggybank[item].target;
  document.getElementById("new-target-date").value   =
    typeof piggybank[item].targetDate === "string"
      ? piggybank[item].targetDate.split("T")[0]
      : new Date(piggybank[item].targetDate).toISOString().split("T")[0];
  popup.style.display = popup.style.display === "none" ? "block" : "none";
}

document.getElementById("add-product").addEventListener("click", addProduct);
document.getElementById("save-results").addEventListener("click", saveResults);

document.getElementById("confirm-change").addEventListener("click", () => {
  const name       = document.getElementById("new-product-name").value.trim();
  const amount     = parseFloat(document.getElementById("new-amount-saved").value);
  const target     = parseFloat(document.getElementById("new-target-amount").value);
  const dateVal    = document.getElementById("new-target-date").value;
  const targetDate = dateVal || piggybank[currentItem].targetDate;

  if (name && !isNaN(amount) && !isNaN(target) && targetDate) {
    piggybank[currentItem] = { ...piggybank[currentItem], name, amount, target, targetDate };
    calculateMonthsToTargetAndMonthlySavings(currentItem);
    productEdit(currentItem);
    displayPiggybank();
    updateDataTypeOptions();
    displayChart();
  } else {
    alert("Please enter valid values.");
  }
});

document.getElementById("cancel-change").addEventListener("click", () => productEdit(currentItem));

// ── Currency ──────────────────────────────────────────────────────────────────
function changeCurrency() {
  selectedCurrency = document.getElementById("currency-selector").value;
  displayPiggybank();
}

// ── Chart ─────────────────────────────────────────────────────────────────────
let chart;
const CHART_COLORS = {
  backgroundColor: [
    "rgba(255,0,0,0.4)","rgba(255,165,0,0.4)","rgba(255,255,0,0.4)",
    "rgba(0,128,0,0.4)","rgba(0,0,255,0.4)","rgba(75,0,130,0.4)","rgba(238,130,238,0.4)",
  ],
  borderColor: [
    "rgba(255,0,0,1)","rgba(255,165,0,1)","rgba(255,255,0,1)",
    "rgba(0,128,0,1)","rgba(0,0,255,1)","rgba(75,0,130,1)","rgba(238,130,238,1)",
  ],
};

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  animation: { duration: 250 },
  scales: {
    y: { beginAtZero: true, ticks: { color: "#ACACAC", callback: (v) => v.toLocaleString() } },
    x: { ticks: { color: "#ACACAC" } },
  },
  plugins: {
    zoom: {
      zoom: { wheel: { enabled: true, mode: "y" }, pinch: { enabled: true }, mode: "y", drag: { enabled: true } },
      limits: { y: { min: 0, max: 35000 } },
    },
  },
};

function getChartData(dataType) {
  switch (dataType) {
    case "savings":
      return {
        labels: piggybank.map((i) => i.name),
        datasets: [
          { label: "Amount Saved",  data: piggybank.map((i) => i.amount), backgroundColor: CHART_COLORS.backgroundColor, borderColor: CHART_COLORS.borderColor, borderWidth: 1 },
          { label: "Target Amount", data: piggybank.map((i) => i.target), backgroundColor: CHART_COLORS.backgroundColor, borderColor: CHART_COLORS.borderColor, borderWidth: 1 },
        ],
      };
    case "history": {
      const dates = [...new Set(piggybank.flatMap((i) => i.history?.map((h) => h.date) ?? []))].sort();
      return {
        labels: dates,
        datasets: piggybank.flatMap((item) => [
          { label: `${item.name} - Amount`, data: dates.map((d) => item.history?.find((h) => h.date === d)?.amount ?? null), borderColor: CHART_COLORS.borderColor[piggybank.indexOf(item)], backgroundColor: CHART_COLORS.backgroundColor[piggybank.indexOf(item)], fill: false },
          { label: `${item.name} - Target`, data: dates.map((d) => item.history?.find((h) => h.date === d)?.target ?? null), borderColor: CHART_COLORS.borderColor[piggybank.indexOf(item)], backgroundColor: "transparent", borderDash: [5, 5], fill: false },
        ]),
      };
    }
    default:
      if (dataType.startsWith("goal_")) {
        const goal = piggybank.find((i) => i.name === dataType.replace("goal_", ""));
        if (!goal?.history) return null;
        const dates = goal.history.map((h) => h.date).sort();
        return {
          labels: dates,
          datasets: [
            { label: `${goal.name} - Amount`, data: dates.map((d) => goal.history.find((h) => h.date === d)?.amount ?? null), borderColor: CHART_COLORS.borderColor[0], backgroundColor: CHART_COLORS.backgroundColor[0], fill: false },
            { label: `${goal.name} - Target`, data: dates.map((d) => goal.history.find((h) => h.date === d)?.target ?? null), borderColor: CHART_COLORS.borderColor[0], backgroundColor: "transparent", borderDash: [5, 5], fill: false },
          ],
        };
      }
      return null;
  }
}

function displayChart(dataType = "savings", chartType = "bar") {
  const ctx = document.getElementById("piggybank-chart").getContext("2d");
  const chartData = getChartData(dataType);
  if (!chartData) return;
  if (chart) { chart.data = chartData; chart.config.type = chartType; chart.update("none"); return; }
  chart = new Chart(ctx, { type: chartType, data: chartData, options: CHART_OPTIONS });
}

function switchChartView(dataType, chartType) { displayChart(dataType, chartType); }

function updateDataTypeOptions() {
  const sel = document.getElementById("dataType");
  const prev = sel.value;
  sel.innerHTML = "";
  sel.add(new Option("Savings", "savings"));
  sel.add(new Option("All Goals History", "history"));
  piggybank.forEach((item) => sel.add(new Option(item.name, `goal_${item.name}`)));
  if (sel.querySelector(`option[value="${prev}"]`)) sel.value = prev;
}