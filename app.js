let chart;

// Show role
document.getElementById("roleDisplay").textContent = JSON.parse(localStorage.getItem("loggedInUser")).role;

// LOGOUT
function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

// ADD RECORD
function addRecord() {
  const sales = Number(document.getElementById("sales").value);
  const expenditure = Number(document.getElementById("expenditure").value);

  if (!sales) return alert("Enter sales amount");

  const today = new Date();
  const date = today.toISOString().split("T")[0];
  const month = date.slice(0, 7);

  const record = { date, sales, expenditure, profit: sales - expenditure, month };

  const records = JSON.parse(localStorage.getItem("records")) || [];
  records.push(record);
  localStorage.setItem("records", JSON.stringify(records));

  loadTable();
  loadWeeklySummary();
  updateMonthDropdown();
  updateDashboard();
}

// LOAD TABLE
function loadTable() {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  const tbody = document.querySelector("#recordsTable tbody");
  tbody.innerHTML = "";

  const role = JSON.parse(localStorage.getItem("loggedInUser")).role;

  records.forEach((r, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.date}</td>
      <td>${r.sales}</td>
      <td>${r.expenditure}</td>
      <td>${r.profit}</td>
      <td>
        ${role === "admin" ? `<button onclick="editRecord(${index})">Edit</button>
        <button onclick="deleteRecord(${index})">Delete</button>` : ''}
      </td>
    `;
    tbody.appendChild(row);
  });
}

// EDIT/DELETE RECORDS
function editRecord(index) {
  const records = JSON.parse(localStorage.getItem("records"));
  const r = records[index];
  document.getElementById("sales").value = r.sales;
  document.getElementById("expenditure").value = r.expenditure;
  records.splice(index, 1);
  localStorage.setItem("records", JSON.stringify(records));
  loadTable();
  loadWeeklySummary();
  updateDashboard();
}

function deleteRecord(index) {
  const records = JSON.parse(localStorage.getItem("records"));
  if (confirm("Are you sure you want to delete this record?")) {
    records.splice(index, 1);
    localStorage.setItem("records", JSON.stringify(records));
    loadTable();
    loadWeeklySummary();
    updateDashboard();
  }
}

// MONTH DROPDOWN
function updateMonthDropdown() {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  const months = [...new Set(records.map(r => r.month))];
  const select = document.getElementById("monthSelect");
  select.innerHTML = "";
  months.forEach(m => {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = m;
    select.appendChild(option);
  });
}

// DASHBOARD KPIs
function updateDashboard() {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  const month = document.getElementById("monthSelect").value;

  const filtered = records.filter(r => r.month === month);

  const totalSales = filtered.reduce((s, r) => s + r.sales, 0);
  const totalExpense = filtered.reduce((s, r) => s + r.expenditure, 0);
  const profit = totalSales - totalExpense;

  document.getElementById("totalSales").textContent = totalSales;
  document.getElementById("totalExpense").textContent = totalExpense;
  document.getElementById("profit").textContent = profit;

  drawChart(records);
}

// CHART
function drawChart(records) {
  const grouped = {};
  records.forEach(r => {
    if (!grouped[r.month]) grouped[r.month] = { sales: 0, profit: 0 };
    grouped[r.month].sales += r.sales;
    grouped[r.month].profit += r.profit;
  });

  const labels = Object.keys(grouped);
  const salesData = labels.map(m => grouped[m].sales);
  const profitData = labels.map(m => grouped[m].profit);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Sales", data: salesData },
        { label: "Profit", data: profitData, type: "line" }
      ]
    }
  });
}

// WEEKLY SUMMARY
function loadWeeklySummary() {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  const weeks = {};

  records.forEach(r => {
    const date = new Date(r.date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date.setDate(diff)).toISOString().split("T")[0];

    if (!weeks[weekStart]) weeks[weekStart] = { sales: 0, expenditure: 0 };
    weeks[weekStart].sales += r.sales;
    weeks[weekStart].expenditure += r.expenditure;
  });

  const tbody = document.querySelector("#weeklyTable tbody");
  tbody.innerHTML = "";

  Object.keys(weeks).forEach(start => {
    const sales = weeks[start].sales;
    const expenditure = weeks[start].expenditure;
    const profit = sales - expenditure;
    const endDate = new Date(new Date(start).getTime() + 6*24*60*60*1000).toISOString().split("T")[0];

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${start}</td>
      <td>${endDate}</td>
      <td>${sales}</td>
      <td>${expenditure}</td>
      <td>${profit}</td>
    `;
    tbody.appendChild(row);
  });
}

// EXPORT
function exportExcel() {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  let csv = "Date,Sales,Expenditure,Profit\n";
  records.forEach(r => csv += `${r.date},${r.sales},${r.expenditure},${r.profit}\n`);

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "coffee_records.csv";
  a.click();
}

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Coffee Business Daily Records", 14, 15);
  const records = JSON.parse(localStorage.getItem("records")) || [];
  let y = 25;
  records.forEach(r => {
    doc.text(`${r.date} | Sales: ${r.sales} | Expenditure: ${r.expenditure} | Profit: ${r.profit}`, 14, y);
    y += 8;
  });
  doc.save("coffee_records.pdf");
}

// INITIAL LOAD
loadTable();
loadWeeklySummary();
updateMonthDropdown();
updateDashboard();
