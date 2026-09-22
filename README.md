# Spend Tracker

A simple expense tracking application built using **Python FastAPI, MySQL, HTML, CSS, and JavaScript**.

## Features

* Add and manage expenses
* View and filter expenses by category and date
* View total and monthly spending summaries
* Category-wise expense breakdown

## Tech Stack

* **Backend:** Python, FastAPI
* **Database:** MySQL
* **Frontend:** HTML, CSS, JavaScript

## Project Structure

```text
spend-tracker/
├── database/
├── backend/
└── frontend/
```

## How to Run

1. Execute `database.sql` in MySQL Workbench.
2. Install backend dependencies:

   ```bash
   pip install fastapi uvicorn mysql-connector-python
   ```
3. Configure your MySQL credentials in `backend/main.py`.
4. Run the backend:

   ```bash
   cd backend
   uvicorn main:app --reload
   ```
5. Open `frontend/index.html` using VS Code Live Server.

