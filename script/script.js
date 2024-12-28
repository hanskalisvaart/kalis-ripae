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
    piggybank.push({
      name: productName,
      amount: 0,
      target: targetAmount,
      targetDate: targetDate,
    });
    document.getElementById("product-name").value = "";
    document.getElementById("target-amount").value = "";
    document.getElementById("target-date").value = "";
    displayPiggybank();
  }
}

function removeProduct(item) {
  piggybank.splice(item, 1);
  displayPiggybank();
}

function saveResults() {
  try {
    // Use local storage to save the results
    localStorage.setItem("piggybank", JSON.stringify(piggybank));

    // Create a Blob containing the JSON data
    const json = JSON.stringify(piggybank);
    const blob = new Blob([json], { type: "application/json" });

    // Create a link to download the Blob
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "piggybank.json";

    // Click the link to download the Blob
    document.body.appendChild(a);
    a.click();

    // Clean up the URL object
    URL.revokeObjectURL(url);

    // Return a success message
    alert("Piggy bank data saved successfully!");
  } catch (error) {
    console.error("Error saving piggy bank data:", error);
    alert(
      "An error occurred while saving piggy bank data. Please try again later."
    );
  }
}

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
  let targetDateElement = document.getElementById("target-date-" + item);
  targetDateElement.value = newDate.toISOString().slice(0, 10);
  targetDateElement.dispatchEvent(new Event("change"));
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

  // Calculate totals outside the loop
  // With this:
  piggybank.forEach((item) => {
    totalAmountSaved += item.amount;
    totalTargetAmount += item.target;
    totalMonthlySavings += item.monthlySavings;
  });

  for (let item in piggybank) {
    // Calculate values for each item
    const targetDate = new Date(piggybank[item].targetDate);
    const monthsToTarget = piggybank[item].monthsToTarget;
    const monthlySavings = piggybank[item].monthlySavings;

    // Build table row with template literals (without function calls in strings)
    tableData += `
      <tr id="${item}">
        <td><span id='product-name-${item}'>${piggybank[item].name}</span></td>
        <td><input type='text' id='amount-${item}' value='${
      piggybank[item].amount
    }'></td>
        <td><input type='text' id='target-amount-${item}' value='${
      piggybank[item].target
    }'></td>
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
          <button title="Move Down" id="move-down-${item}"><span class="iconify" data-icon="material-symbols:arrow-circle-down-outline-rounded"></span></button>
          <button title="Change amounts" id="change-${item}"><span class="iconify" data-icon="material-symbols:currency-exchange"></span></button>
          <button title="Remove Item" id="remove-${item}"><span class="iconify" data-icon="material-symbols:delete-forever-outline"></span></button>
          <input type='date' id='target-date-${item}'>
          <button title="Change Product Name" id="change-name-${item}"><span class="iconify" data-icon="material-symbols:edit"></span></button>
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
    const changeButton = document.getElementById(`change-${item}`);
    const removeButton = document.getElementById(`remove-${item}`);
    const changeNameButton = document.getElementById(`change-name-${item}`);
    changeNameButton.addEventListener("click", function () {
      currentItem = item; // Update the currentItem variable
      toggleChangeNamePopup(item);
    });

    const confirmButton = document.getElementById("confirm-change");
    confirmButton.addEventListener("click", function () {
      const newItemName = document.getElementById("new-product-name").value;
      if (newItemName.trim() !== "") {
        piggybank[currentItem].name = newItemName; // Use currentItem instead of item
        toggleChangeNamePopup(currentItem); // Use currentItem instead of item
        displayPiggybank();
      } else {
        alert("Please enter a product name.");
      }
    });

    const cancelButton = document.getElementById("cancel-change");
    cancelButton.addEventListener("click", function () {
      toggleChangeNamePopup(item);
    });

    // moveUpButton.addEventListener("click", () => moveUp(Number(item)));
    // moveDownButton.addEventListener("click", () => moveDown(Number(item)));
    changeButton.addEventListener("click", () => {
      const amount = document.getElementById(`amount-${item}`).value;
      const targetAmount = document.getElementById(
        `target-amount-${item}`
      ).value;
      changeAmountAndTarget(item, amount, targetAmount);
    });
    removeButton.addEventListener("click", () => removeProduct(item));

    const targetDateElement = document.getElementById(`target-date-${item}`);
    targetDateElement.addEventListener("change", function () {
      changeTargetDate(item, this.value);
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
    <label for="new-product-name">New Product Name:</label>
    <input type="text" id="new-product-name" value="">
    <br>
    <button id="confirm-change">Confirm</button>
    <button id="cancel-change">Cancel</button>
  </div>
`;
document.body.appendChild(popupDiv);

const popup = document.getElementById("change-name-popup");
const newProductNameInput = document.getElementById("new-product-name");

function toggleChangeNamePopup(item) {
  const productNameSpan = document.getElementById(`product-name-${item}`);
  newProductNameInput.value = productNameSpan.textContent; // Set current name as default value in input field
  if (popup.style.display === "none") {
    popup.style.display = "block";
    // Optionally, position the popup relative to the clicked button
  } else {
    popup.style.display = "none";
  }
}

// Display the piggy bank when the page loads
displayPiggybank();

// Add event listeners to buttons
document.getElementById("add-product").addEventListener("click", addProduct);
document.getElementById("save-results").addEventListener("click", saveResults);

function changeCurrency() {
  const currencySelector = document.getElementById("currency-selector");
  const currencySymbolElements = document.querySelectorAll(".currency-symbol");

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

  for (let i = 0; i < currencySymbolElements.length; i++) {
    const currency = currencySelector.value;
    const currencySymbol = currencySymbols[currency];
    currencySymbolElements[i].textContent = currencySymbol;
  }
}

let chart;
function displayChart() {
  const ctx = document.getElementById("piggybank-chart").getContext("2d");
  const labels = Object.values(piggybank).map((item) => item.name);
  const data = Object.values(piggybank).map((item) => item.amount);
  const data2 = Object.values(piggybank).map((item) => item.target);
  // If chart already exists, destroy it
  if (chart) {
    chart.destroy();
  }
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Amount Saved",
          data: data,
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
          borderWidth: 1,
        },
        {
          label: "Target Amount",
          data: data2,
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
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: "#ACACAC",
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
    },
  });
}
