
const API_URL = "http://127.0.0.1:8000";

// ---------- HTML ELEMENTS ----------

const expenseForm = document.getElementById("expenseForm");

const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const noteInput = document.getElementById("note");
const dateInput = document.getElementById("date");

const filterCategory = document.getElementById("filterCategory");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");

const getExpensesBtn = document.getElementById("getExpensesBtn");
const getSummaryBtn = document.getElementById("getSummaryBtn");

const addMessage = document.getElementById("addMessage");
const expenseMessage = document.getElementById("expenseMessage");
const summaryMessage = document.getElementById("summaryMessage");

const expensesSection = document.getElementById("expensesSection");
const expensesGrid = document.getElementById("expensesGrid");

const summarySection = document.getElementById("summarySection");
const totalSpend = document.getElementById("totalSpend");
const previousSpend = document.getElementById("previousSpend");
const momChange = document.getElementById("momChange");
const summaryGrid = document.getElementById("summaryGrid");


// ---------- HELPER FUNCTIONS ----------

// Set today's date using local time
function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Default expense date
dateInput.value = getToday();


// Format amount in Indian Rupees
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(Number(amount) || 0);
}


// Show messages
function showMessage(element, text, isError = false) {
    element.textContent = text;
    element.style.color = isError ? "red" : "green";
}


// Create safe HTML elements
function createCell(text) {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
}


// Get useful error message from API
async function getErrorMessage(response) {
    try {
        const data = await response.json();

        if (typeof data.detail === "string") {
            return data.detail;
        }

        return "Request failed. Please check your input.";
    } catch {
        return "Something went wrong.";
    }
}


// ---------- ADD EXPENSE ----------

expenseForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const expense = {
        amount: Number(amountInput.value),
        category: categoryInput.value,
        note: noteInput.value.trim(),
        date: dateInput.value
    };

    if (
        !expense.amount ||
        expense.amount <= 0 ||
        !expense.category ||
        !expense.date
    ) {
        showMessage(
            addMessage,
            "Please enter a valid amount, category and date.",
            true
        );
        return;
    }

    try {
        const response = await fetch(`${API_URL}/expenses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(expense)
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        showMessage(addMessage, "Expense added successfully!");

        // Clear form
        expenseForm.reset();
        dateInput.value = getToday();

        // Refresh list and summary
        await getExpenses(true);
        await getSummary(true);

    } catch (error) {
        showMessage(
            addMessage,
            error.message || "Unable to connect to backend.",
            true
        );
    }
});


// ---------- GET EXPENSES ----------

getExpensesBtn.addEventListener("click", function () {
    getExpenses();
});


async function getExpenses(silent = false) {
    const params = new URLSearchParams();

    // Add only selected filters
    if (filterCategory.value) {
        params.append("category", filterCategory.value);
    }

    if (startDateInput.value) {
        params.append("start_date", startDateInput.value);
    }

    if (endDateInput.value) {
        params.append("end_date", endDateInput.value);
    }

    // Build API URL
    const queryString = params.toString();

    const url = queryString
        ? `${API_URL}/expenses?${queryString}`
        : `${API_URL}/expenses`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const expenses = await response.json();

        displayExpenses(expenses);

        expensesSection.hidden = false;

        if (!silent) {
            showMessage(
                expenseMessage,
                `${expenses.length} expense(s) found.`
            );
        }

    } catch (error) {
        showMessage(
            expenseMessage,
            error.message || "Unable to fetch expenses.",
            true
        );
    }
}


// ---------- DISPLAY EXPENSES ----------

function displayExpenses(expenses) {
    expensesGrid.innerHTML = "";

    if (expenses.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell("No expenses found.");

        cell.colSpan = 5;
        row.appendChild(cell);
        expensesGrid.appendChild(row);

        return;
    }

    expenses.forEach(function (expense) {
        const row = document.createElement("tr");

        row.appendChild(createCell(expense.id));
        row.appendChild(createCell(formatCurrency(expense.amount)));
        row.appendChild(createCell(expense.category));
        row.appendChild(createCell(expense.note || "-"));
        row.appendChild(createCell(expense.date));

        expensesGrid.appendChild(row);
    });
}


// ---------- GET SUMMARY ----------

getSummaryBtn.addEventListener("click", function () {
    getSummary();
});


async function getSummary(silent = false) {
    try {
        const response = await fetch(`${API_URL}/summary`);

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const summary = await response.json();

        displaySummary(summary);

        summarySection.hidden = false;

        if (!silent) {
            showMessage(summaryMessage, "Summary loaded successfully!");
        }

    } catch (error) {
        showMessage(
            summaryMessage,
            error.message || "Unable to fetch summary.",
            true
        );
    }
}


// ---------- DISPLAY SUMMARY ----------

function displaySummary(summary) {
    // Summary cards
    totalSpend.textContent = formatCurrency(summary.total_spend);

    previousSpend.textContent = formatCurrency(
        summary.previous_month_spend
    );

    // Month-over-month change
    const change = Number(
        summary.month_over_month_change_percent || 0
    );

    momChange.textContent =
        `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;

    // Category-wise summary table
    summaryGrid.innerHTML = "";

    const categories = summary.spend_by_category || [];
    const total = Number(summary.total_spend) || 0;

    if (categories.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell("No category data available.");

        cell.colSpan = 3;
        row.appendChild(cell);
        summaryGrid.appendChild(row);

        return;
    }

    categories.forEach(function (item) {
        const row = document.createElement("tr");

        const amount = Number(item.total_spend) || 0;

        const percentage = total > 0
            ? (amount / total) * 100
            : 0;

        row.appendChild(createCell(item.category));
        row.appendChild(createCell(formatCurrency(amount)));
        row.appendChild(createCell(`${percentage.toFixed(2)}%`));

        summaryGrid.appendChild(row);
    });
}