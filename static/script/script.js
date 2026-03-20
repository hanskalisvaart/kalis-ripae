let piggybank = [];
let currentItem = 0;
let selectedCurrency = "EUR"; // Persist currency selection

fetch("/data/piggybank.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("JSON file not found");
    }
    return response.json();
  })
  .then((data) => {
    piggybank = data;
    piggybank.forEach((item, index) => {
      calculateMonthsToTargetAndMonthlySavings(index);
    });
    displayPiggybank();
    updateDataTypeOptions();
    displayChart();
  })
  .catch((error) => {
    console.log(error);
    piggybank = getDefaultData();
    piggybank.forEach((item, index) => {
      calculateMonthsToTargetAndMonthlySavings(index);
    });
    displayPiggybank();
    updateDataTypeOptions();
    displayChart();
  });

function getDefaultData() {
  // Use dates relative to today so months-to-target is never immediately negative
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
    const newProduct = {
      name: productName,
      amount: 0,
      target: targetAmount,
      targetDate: targetDateValue, // Store as ISO string
    };
    piggybank.push(newProduct);
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
  const confirmation = confirm("Are you sure you want to remove this product?");
  if (confirmation) {
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
      alert("An error occurred while saving piggy bank data. Please try again later.");
    });
}

document.getElementById("backup-data").addEventListener("click", function () {
  window.location.href = "/api/backup";
});

function changeTargetDate(item, value) {
  if (value) {
    piggybank[item].targetDate = value; // Store as ISO string
    calculateMonthsToTargetAndMonthlySavings(item);
    displayPiggybank();
    updateDataTypeOptions();
    displayChart();
  } else {
    alert("Invalid date");
  }
}

function changeAmountAndTarget(item, amount, targetAmount) {
  const newAmount = parseFloat(amount);
  const newTargetAmount = parseFloat(targetAmount);
  if (isNaN(newAmount) || isNaN(newTargetAmount)) {
    alert("Please enter valid amounts");
  } else {
    piggybank[item].amount = newAmount;
    piggybank[item].target = newTargetAmount;
    calculateMonthsToTargetAndMonthlySavings(item);
    displayPiggybank();
    updateDataTypeOptions();
    displayChart();
  }
  document.getElementById("amount-" + item).value = piggybank[item].amount;
  document.getElementById("target-amount-" + item).value = piggybank[item].target;
}

function calculateMonthsToTargetAndMonthlySavings(item) {
  const targetDate = new Date(piggybank[item].targetDate);
  const currentDate = new Date();
  const monthsToTarget = Math.round(
    (targetDate - currentDate) / (1000 * 60 * 60 * 24 * 30)
  );
  piggybank[item].monthsToTarget = monthsToTarget;

  // Guard against division by zero or negative months
  if (monthsToTarget <= 0) {
    piggybank[item].monthlySavings = piggybank[item].target - piggybank[item].amount;
  } else {
    piggybank[item].monthlySavings =
      (piggybank[item].target - piggybank[item].amount) / monthsToTarget;
  }
}

// Helper: format a number with the active currency symbol
function formatCurrency(value) {
  const symbol = currencySymbols[selectedCurrency] || " €";
  return `<span class='currency-symbol'>${symbol}</span>${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function displayPiggybank() {
  let tableData = "";
  let totalAmountSaved = 0;
  let totalTargetAmount = 0;
  let totalMonthlySavings = 0;

  for (let item in piggybank) {
    totalAmountSaved += piggybank[item].amount;
    totalTargetAmount += piggybank[item].target;
    totalMonthlySavings += piggybank[item].monthlySavings;

    const targetDate = new Date(piggybank[item].targetDate);
    const monthsToTarget = piggybank[item].monthsToTarget;
    const monthlySavings = piggybank[item].monthlySavings;
    const isPastDue = monthsToTarget <= 0;

    tableData += `
      <tr id="${item}" ${isPastDue ? "class='past-due'" : ""}>
        <td><span id='product-name-${item}'>${piggybank[item].name}</span></td>
        <td>${formatCurrency(piggybank[item].amount)}</td>
        <td>${formatCurrency(piggybank[item].target)}</td>
        <td>${targetDate.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        })}</td>
        <td>${isPastDue ? '<span title="Target date has passed">⚠ ' + monthsToTarget + "</span>" : monthsToTarget}</td>
        <td>${formatCurrency(monthlySavings)}</td>
        <td>
          <button title="Move Up" id="move-up-${item}"><span class="iconify" data-icon="material-symbols:arrow-circle-up-outline-rounded"></span></button>
          <button title="Change Product Name" id="change-name-${item}"><span class="iconify" data-icon="material-symbols:edit"></span></button>
          <button title="Move Down" id="move-down-${item}"><span class="iconify" data-icon="material-symbols:arrow-circle-down-outline-rounded"></span></button>
          <button title="Remove Item" id="remove-${item}"><span class="iconify" data-icon="material-symbols:delete-forever-outline"></span></button>
        </td>
      </tr>
    `;
  }

  const footerRow = `
    <tr>
      <td><strong>Total</strong></td>
      <td><strong>${formatCurrency(totalAmountSaved)}</strong></td>
      <td><strong>${formatCurrency(totalTargetAmount)}</strong></td>
      <td></td><td></td>
      <td><strong>${formatCurrency(totalMonthlySavings)}</strong></td>
      <td></td>
    </tr>`;

  document.getElementById("piggybank-table").innerHTML =
    `<thead><tr>
      <th>Product</th>
      <th>Amount Saved</th>
      <th>Target Amount</th>
      <th>Target Date</th>
      <th>Months to Target</th>
      <th>Savings Allocation</th>
      <th>Action</th>
    </tr></thead><tbody>${tableData}</tbody><tfoot>${footerRow}</tfoot>`;

  // Attach event listeners — consistent pattern for both moveUp and moveDown
  for (let item in piggybank) {
    const idx = Number(item);

    document.getElementById(`move-up-${item}`).addEventListener("click", function () {
      if (idx > 0) {
        [piggybank[idx], piggybank[idx - 1]] = [piggybank[idx - 1], piggybank[idx]];
        displayPiggybank();
        updateDataTypeOptions();
        displayChart();
      }
    });

    document.getElementById(`move-down-${item}`).addEventListener("click", function () {
      if (idx < piggybank.length - 1) {
        [piggybank[idx], piggybank[idx + 1]] = [piggybank[idx + 1], piggybank[idx]];
        displayPiggybank();
        updateDataTypeOptions();
        displayChart();
      }
    });

    document.getElementById(`change-name-${item}`).addEventListener("click", function () {
      currentItem = idx;
      productEdit(idx);
    });

    document.getElementById(`remove-${item}`).addEventListener("click", function () {
      removeProduct(idx);
    });
  }
}

// ── Popup ────────────────────────────────────────────────────────────────────
const popupDiv = document.createElement("div");
popupDiv.id = "change-name-popup";
popupDiv.style.display = "none";
popupDiv.innerHTML = `
  <div id="popup-content">
    <label for="new-product-name">Product Name:</label>
    <input type="text" id="new-product-name" value="">
    <label for="new-amount-saved">Amount Saved:</label>
    <input type="number" id="new-amount-saved" value="">
    <label for="new-target-amount">Target Amount:</label>
    <input type="number" id="new-target-amount" value="">
    <label for="new-target-date">Target Date:</label>
    <input type="date" id="new-target-date" value="">
    <button id="confirm-change">Confirm</button>
    <button id="cancel-change">Cancel</button>
  </div>
`;
document.body.appendChild(popupDiv);

const popup = document.getElementById("change-name-popup");
const newProductNameInput = document.getElementById("new-product-name");

function productEdit(item) {
  newProductNameInput.value = piggybank[item].name;
  document.getElementById("new-amount-saved").value = piggybank[item].amount;
  document.getElementById("new-target-amount").value = piggybank[item].target;
  // targetDate is always an ISO string now, safe to set directly
  document.getElementById("new-target-date").value =
    typeof piggybank[item].targetDate === "string"
      ? piggybank[item].targetDate.split("T")[0]
      : new Date(piggybank[item].targetDate).toISOString().split("T")[0];

  popup.style.display = popup.style.display === "none" ? "block" : "none";
}

document.getElementById("add-product").addEventListener("click", addProduct);
document.getElementById("save-results").addEventListener("click", saveResults);

document.getElementById("confirm-change").addEventListener("click", function () {
  const newItemName = document.getElementById("new-product-name").value.trim();
  const newAmountSaved = parseFloat(document.getElementById("new-amount-saved").value);
  const newTargetAmount = parseFloat(document.getElementById("new-target-amount").value);
  const newTargetDateValue = document.getElementById("new-target-date").value;
  const newTargetDate = newTargetDateValue || piggybank[currentItem].targetDate;

  if (newItemName !== "" && !isNaN(newAmountSaved) && !isNaN(newTargetAmount) && newTargetDate) {
    piggybank[currentItem].name = newItemName;
    piggybank[currentItem].amount = newAmountSaved;
    piggybank[currentItem].target = newTargetAmount;
    piggybank[currentItem].targetDate = newTargetDate; // ISO string
    calculateMonthsToTargetAndMonthlySavings(currentItem);
    productEdit(currentItem);
    displayPiggybank();
    updateDataTypeOptions();
    displayChart();
  } else {
    alert("Please enter valid values.");
  }
});

document.getElementById("cancel-change").addEventListener("click", function () {
  productEdit(currentItem);
});

// ── Currency ─────────────────────────────────────────────────────────────────
const currencySymbols = {
  USD: " $",
  EUR: " €",
  JPY: " ¥",
  GBP: " £",
  AUD: " A$",
  CAD: " C$",
  CHF: " CHF",
  CNY: " ¥",
  HKD: " HK$",
  NZD: " NZ$",
};

function changeCurrency() {
  selectedCurrency = document.getElementById("currency-selector").value;
  // Re-render the table so all currency symbols update correctly
  displayPiggybank();
}

// ── Chart ─────────────────────────────────────────────────────────────────────
let chart;
const CHART_COLORS = {
  backgroundColor: [
    "rgba(255, 0, 0, 0.4)",
    "rgba(255, 165, 0, 0.4)",
    "rgba(255, 255, 0, 0.4)",
    "rgba(0, 128, 0, 0.4)",
    "rgba(0, 0, 255, 0.4)",
    "rgba(75, 0, 130, 0.4)",
    "rgba(238, 130, 238, 0.4)",
  ],
  borderColor: [
    "rgba(255, 0, 0, 1)",
    "rgba(255, 165, 0, 1)",
    "rgba(255, 255, 0, 1)",
    "rgba(0, 128, 0, 1)",
    "rgba(0, 0, 255, 1)",
    "rgba(75, 0, 130, 1)",
    "rgba(238, 130, 238, 1)",
  ],
};

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  animation: { duration: 250 },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: "#ACACAC",
        callback: (value) => value.toLocaleString(),
      },
    },
    x: { ticks: { color: "#ACACAC" } },
  },
  plugins: {
    zoom: {
      zoom: {
        wheel: { enabled: true, mode: "y" },
        pinch: { enabled: true },
        mode: "y",
        drag: { enabled: true },
      },
      limits: { y: { min: 0, max: 35000 } },
    },
  },
};

function getChartData(dataType) {
  switch (dataType) {
    case "savings":
      return {
        labels: piggybank.map((item) => item.name),
        datasets: [
          {
            label: "Amount Saved",
            data: piggybank.map((item) => item.amount),
            backgroundColor: CHART_COLORS.backgroundColor,
            borderColor: CHART_COLORS.borderColor,
            borderWidth: 1,
          },
          {
            label: "Target Amount",
            data: piggybank.map((item) => item.target),
            backgroundColor: CHART_COLORS.backgroundColor,
            borderColor: CHART_COLORS.borderColor,
            borderWidth: 1,
          },
        ],
      };
    case "history": {
      const dates = [
        ...new Set(
          piggybank.flatMap((item) =>
            item.history ? item.history.map((h) => h.date) : []
          )
        ),
      ].sort();

      return {
        labels: dates,
        datasets: piggybank.flatMap((item) => [
          {
            label: `${item.name} - Amount`,
            data: dates.map((date) => {
              const h = item.history?.find((h) => h.date === date);
              return h ? h.amount : null;
            }),
            borderColor: CHART_COLORS.borderColor[piggybank.indexOf(item)],
            backgroundColor: CHART_COLORS.backgroundColor[piggybank.indexOf(item)],
            fill: false,
          },
          {
            label: `${item.name} - Target`,
            data: dates.map((date) => {
              const h = item.history?.find((h) => h.date === date);
              return h ? h.target : null;
            }),
            borderColor: CHART_COLORS.borderColor[piggybank.indexOf(item)],
            backgroundColor: "transparent",
            borderDash: [5, 5],
            fill: false,
          },
        ]),
      };
    }
    default:
      if (dataType.startsWith("goal_")) {
        const goalName = dataType.replace("goal_", "");
        const goal = piggybank.find((item) => item.name === goalName);
        if (!goal || !goal.history) return null;

        const dates = goal.history.map((h) => h.date).sort();
        return {
          labels: dates,
          datasets: [
            {
              label: `${goal.name} - Amount`,
              data: dates.map((date) => {
                const h = goal.history.find((h) => h.date === date);
                return h ? h.amount : null;
              }),
              borderColor: CHART_COLORS.borderColor[0],
              backgroundColor: CHART_COLORS.backgroundColor[0],
              fill: false,
            },
            {
              label: `${goal.name} - Target`,
              data: dates.map((date) => {
                const h = goal.history.find((h) => h.date === date);
                return h ? h.target : null;
              }),
              borderColor: CHART_COLORS.borderColor[0],
              backgroundColor: "transparent",
              borderDash: [5, 5],
              fill: false,
            },
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

  if (chart) {
    chart.data = chartData;
    chart.config.type = chartType;
    chart.update("none");
    return;
  }

  chart = new Chart(ctx, {
    type: chartType,
    data: chartData,
    options: CHART_OPTIONS,
  });
}

function switchChartView(dataType, chartType) {
  displayChart(dataType, chartType);
}

function updateDataTypeOptions() {
  const dataTypeSelect = document.getElementById("dataType");
  const currentValue = dataTypeSelect.value;

  dataTypeSelect.innerHTML = "";
  dataTypeSelect.add(new Option("Savings", "savings"));
  dataTypeSelect.add(new Option("All Goals History", "history"));

  piggybank.forEach((item) => {
    dataTypeSelect.add(new Option(`${item.name}`, `goal_${item.name}`));
  });

  if (dataTypeSelect.querySelector(`option[value="${currentValue}"]`)) {
    dataTypeSelect.value = currentValue;
  }
}