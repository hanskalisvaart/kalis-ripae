let piggybank = []; // Initialize an empty array
let currentItem = 0;

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
    displayChart();
  })
  .catch((error) => {
    // Handle the error, and use default data if the file is not found
    console.log(error);
    piggybank = getDefaultData();
    piggybank.forEach((item, index) => {
      calculateMonthsToTargetAndMonthlySavings(index);
    });
    displayPiggybank();
    displayChart();
  });

function getDefaultData() {
  // Define default data
  return [
    { name: "product1", amount: 0, target: 100, targetDate: "2024-01-01" },
    { name: "product2", amount: 0, target: 150, targetDate: "2024-02-01" },
    { name: "product3", amount: 0, target: 200, targetDate: "2024-03-01" },
    { name: "product4", amount: 0, target: 250, targetDate: "2024-04-01" },
    { name: "product5", amount: 0, target: 300, targetDate: "2024-05-01" },
  ];
}

function addProduct() {
  let productName = document.getElementById("product-name").value;
  let targetAmount = parseInt(document.getElementById("target-amount").value);
  let targetDate = new Date(document.getElementById("target-date").value);
  if (productName && targetAmount && targetDate) {
    let newProduct = {
      name: productName,
      amount: 0,
      target: targetAmount,
      targetDate: targetDate,
    };
    piggybank.push(newProduct);
    // Calculate monthsToTarget and monthlySavings for the new product
    calculateMonthsToTargetAndMonthlySavings(piggybank.length - 1);
    document.getElementById("product-name").value = "";
    document.getElementById("target-amount").value = "";
    document.getElementById("target-date").value = "";
    displayPiggybank();
    displayChart();
  }
}

function removeProduct(index) {
  let confirmation = confirm("Are you sure you want to remove this product?");
  if (confirmation) {
    piggybank.splice(index, 1);
    displayPiggybank();
    displayChart();
  }
}

function saveResults() {
  try {
    // Save to server
    fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(piggybank),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to save data");
        }
        alert("Piggy bank data saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving piggy bank data:", error);
        alert(
          "An error occurred while saving piggy bank data. Please try again later."
        );
      });
  } catch (error) {
    console.error("Error saving piggy bank data:", error);
    alert(
      "An error occurred while saving piggy bank data. Please try again later."
    );
  }
}

//backup
document.getElementById("backup-data").addEventListener("click", function () {
  window.location.href = "/api/backup";
});

function changeTargetDate(item, value) {
  let newDate = new Date(value);
  if (newDate) {
    piggybank[item].targetDate = newDate;
    calculateMonthsToTargetAndMonthlySavings(item);
    displayPiggybank();
    displayChart();
  } else {
    alert("Invalid date");
  }
}
function changeAmountAndTarget(item, amount, targetAmount) {
  const newAmount = parseInt(amount);
  const newTargetAmount = parseInt(targetAmount);
  if (isNaN(newAmount) || isNaN(newTargetAmount)) {
    alert("Please enter valid amounts");
  } else {
    piggybank[item].amount = newAmount;
    piggybank[item].target = newTargetAmount;
    calculateMonthsToTargetAndMonthlySavings(item);
    displayPiggybank();
    displayChart();
  }
  document.getElementById("amount-" + item).value = piggybank[item].amount;
  document.getElementById("target-amount-" + item).value =
    piggybank[item].target;
}

function calculateMonthsToTargetAndMonthlySavings(item) {
  const targetDate = new Date(piggybank[item].targetDate);
  const currentDate = new Date();
  piggybank[item].monthsToTarget = Math.round(
    (targetDate - currentDate) / (1000 * 60 * 60 * 24 * 30)
  );
  piggybank[item].monthlySavings = Math.round(
    (piggybank[item].target - piggybank[item].amount) /
      piggybank[item].monthsToTarget
  );
}

function displayPiggybank() {
  let tableData = "";
  let totalAmountSaved = 0;
  let totalTargetAmount = 0;
  let totalMonthlySavings = 0;

  for (let item in piggybank) {
    // Calculate totals
    totalAmountSaved += piggybank[item].amount;
    totalTargetAmount += piggybank[item].target;
    totalMonthlySavings += piggybank[item].monthlySavings;

    // Calculate values for each item
    const targetDate = new Date(piggybank[item].targetDate);
    const monthsToTarget = piggybank[item].monthsToTarget;
    const monthlySavings = piggybank[item].monthlySavings;

    // Build table row with template literals (without function calls in strings)
    tableData += `
      <tr id="${item}">
      <td><span id='product-name-${item}'>${piggybank[item].name}</span></td>
      <td><span id='amount-${item}'>${piggybank[item].amount}</span></td>
      <td><span id='target-amount-${item}'>${piggybank[item].target}</span></td>
        <td>${targetDate.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        })}</td>
        <td>${monthsToTarget}</td>
        <td><span class='currency-symbol'>€ </span>${monthlySavings.toLocaleString()}</td>
        <td>
          <button title="Move Up" id="move-up-${item}"><span class="iconify" data-icon="material-symbols:arrow-circle-up-outline-rounded"></span></button>
          <button title="Change Product Name" id="change-name-${item}"><span class="iconify" data-icon="material-symbols:edit"></span></button>
          <button title="Move Down" id="move-down-${item}"><span class="iconify" data-icon="material-symbols:arrow-circle-down-outline-rounded"></span></button>
          <button title="Remove Item" id="remove-${item}"><span class="iconify" data-icon="material-symbols:delete-forever-outline"></span></button>      
          </td>
      </tr>
    `;
  }

  // Add the footer row
  const footerRow =
    "<tr><td><strong>Total</strong></td><td><strong><span class='currency-symbol'>€ </span>" +
    totalAmountSaved.toLocaleString() +
    "</strong></td><td><strong><span class='currency-symbol'>€ </span>" +
    totalTargetAmount.toLocaleString() +
    "</strong></td><td></td><td></td><td><strong><span class='currency-symbol'>€ </span>" +
    totalMonthlySavings.toLocaleString() +
    "</strong></td><td></td></tr>";

  document.getElementById("piggybank-table").innerHTML =
    "<thead><tr><th>Product</th><th>Amount Saved<span class='currency-symbol'> €</span></th><th>Target Amount<span class='currency-symbol'> €</span></th><th>Target Date</th><th>Months to Target</th><th>Savings Allocation</th><th>Action</th></tr></thead><tbody>" +
    tableData +
    "</tbody><tfoot>" +
    footerRow +
    "</tfoot>";

  // Add event listeners after building the table
  for (let item in piggybank) {
    const moveUpButton = document.getElementById(`move-up-${item}`);
    moveUpButton.addEventListener("click", moveUp(item));
    const moveDownButton = document.getElementById(`move-down-${item}`);
    moveDownButton.dataset.item = item; // Store the item index in the element
    moveDownButton.addEventListener("click", moveDown);

    const changeNameButton = document.getElementById(`change-name-${item}`);
    changeNameButton.addEventListener("click", function () {
      currentItem = item; // Update the currentItem variable
      productEdit(item);
    });
    const removeButton = document.getElementById(`remove-${item}`);
    removeButton.addEventListener("click", function () {
      removeProduct(Number(item));
    });
  }
}

function moveUp(item) {
  return function () {
    if (item > 0) {
      const temp = piggybank[item];
      piggybank[item] = piggybank[item - 1];
      piggybank[item - 1] = temp;
      displayPiggybank();
      displayChart();
    }
  };
}
function moveDown(event) {
  const item = Number(event.currentTarget.dataset.item); // Retrieve the item index from the element
  if (item < piggybank.length - 1) {
    const temp = piggybank[item];
    piggybank[item] = piggybank[item + 1];
    piggybank[item + 1] = temp;
    displayPiggybank();
    displayChart();
  }
}

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
  const productNameSpan = document.getElementById(`product-name-${item}`);
  newProductNameInput.value = productNameSpan.textContent; // Set current name as default value in input field
  const newAmountSavedInput = document.getElementById("new-amount-saved");
  newAmountSavedInput.value = piggybank[item].amount; // Set current amount saved as default value in input field
  const newTargetAmountInput = document.getElementById("new-target-amount");
  newTargetAmountInput.value = piggybank[item].target; // Set current target amount as default value in input field
  const newTargetDateInput = document.getElementById("new-target-date");
  newTargetDateInput.value = piggybank[item].targetDate; // Set current target date as default value in input field
  if (popup.style.display === "none") {
    popup.style.display = "block";
  } else {
    popup.style.display = "none";
  }
}

// Display the piggy bank when the page loads
displayPiggybank();

// Add event listeners to buttons
document.getElementById("add-product").addEventListener("click", addProduct);
document.getElementById("save-results").addEventListener("click", saveResults);

const confirmButton = document.getElementById("confirm-change");
confirmButton.addEventListener("click", function () {
  const newItemName = document.getElementById("new-product-name").value;
  const newAmountSaved = parseInt(
    document.getElementById("new-amount-saved").value
  );
  const newTargetAmount = parseInt(
    document.getElementById("new-target-amount").value
  );
  let newTargetDateInput = document.getElementById("new-target-date");
  let newTargetDate = newTargetDateInput.value
    ? new Date(newTargetDateInput.value)
    : piggybank[currentItem].targetDate;
  if (
    newItemName.trim() !== "" &&
    !isNaN(newAmountSaved) &&
    !isNaN(newTargetAmount) &&
    newTargetDate
  ) {
    piggybank[currentItem].name = newItemName;
    piggybank[currentItem].amount = newAmountSaved;
    piggybank[currentItem].target = newTargetAmount;
    piggybank[currentItem].targetDate = newTargetDate;
    calculateMonthsToTargetAndMonthlySavings(currentItem); // Add this line
    productEdit(currentItem);
    displayPiggybank();
  } else {
    alert("Please enter valid values.");
  }
});

// Add event listener for the cancel button
const cancelButton = document.getElementById("cancel-change");
cancelButton.addEventListener("click", function () {
  productEdit(currentItem); // Use currentItem instead of item
});

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
  const currencySelector = document.getElementById("currency-selector");
  const currencySymbolElements = document.querySelectorAll(".currency-symbol");

  // Now just reference the constant object
  for (let i = 0; i < currencySymbolElements.length; i++) {
    const currency = currencySelector.value;
    const currencySymbol = currencySymbols[currency];
    currencySymbolElements[i].textContent = currencySymbol;
  }
}

//Chart code:
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
  animation: {
    duration: 250, // Faster animations
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: "#ACACAC",
        callback: (value) => value.toLocaleString(), // Format large numbers
      },
    },
    x: {
      ticks: {
        color: "#ACACAC",
      },
    },
  },
  plugins: {
    zoom: {
      zoom: {
        wheel: {
          enabled: true,
          mode: "y",
        },
        pinch: {
          enabled: true,
        },
        mode: "y",
        drag: {
          enabled: true,
        },
      },
      limits: {
        y: { min: 0, max: 35000 },
      },
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
    case "history":
      // Get all unique dates from all items' histories
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
              const historyEntry = item.history?.find((h) => h.date === date);
              return historyEntry ? historyEntry.amount : null;
            }),
            borderColor: CHART_COLORS.borderColor[piggybank.indexOf(item)],
            backgroundColor:
              CHART_COLORS.backgroundColor[piggybank.indexOf(item)],
            fill: false,
          },
          {
            label: `${item.name} - Target`,
            data: dates.map((date) => {
              const historyEntry = item.history?.find((h) => h.date === date);
              return historyEntry ? historyEntry.target : null;
            }),
            borderColor: CHART_COLORS.borderColor[piggybank.indexOf(item)],
            backgroundColor: "transparent",
            borderDash: [5, 5],
            fill: false,
          },
        ]),
      };
    default:
      return null;
  }
}

function displayChart(dataType = "savings", chartType = "bar") {
  const ctx = document.getElementById("piggybank-chart").getContext("2d");

  const chartData = getChartData(dataType);
  if (!chartData) return;

  if (chart) {
    // Update existing chart
    chart.data = chartData;
    chart.config.type = chartType;
    chart.update("none");
    return;
  }

  // Create new chart if it doesn't exist
  chart = new Chart(ctx, {
    type: chartType,
    data: chartData,
    options: CHART_OPTIONS,
  });
}

// Add a function to switch data/chart type
function switchChartView(dataType, chartType) {
  displayChart(dataType, chartType);
}
