from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import mysql.connector


app = FastAPI(title="Spend Tracker API")


# ---------------- CORS ----------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


# ---------------- DATABASE ----------------

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="chaudhary",
        database="spend_tracker"
    )


# ---------------- MODEL ----------------

class Expense(BaseModel):
    amount: float = Field(gt=0)
    category: str
    note: str = ""
    date: str


# ---------------- HOME ----------------

@app.get("/")
def home():
    return {"message": "Spend Tracker API is running"}


# ---------------- ADD EXPENSE ----------------

@app.post("/expenses")
def add_expense(expense: Expense):

    if not expense.category.strip():
        raise HTTPException(
            status_code=400,
            detail="Category is required"
        )

    db = get_db()
    cursor = db.cursor(dictionary=True)

    query = """
        INSERT INTO expenses
        (amount, category, note, date)
        VALUES (%s, %s, %s, %s)
    """

    values = (
        expense.amount,
        expense.category.strip(),
        expense.note,
        expense.date
    )

    cursor.execute(query, values)
    db.commit()

    expense_id = cursor.lastrowid

    cursor.close()
    db.close()

    return {
        "id": expense_id,
        "message": "Expense added successfully"
    }


# ---------------- GET EXPENSES ----------------

@app.get("/expenses")
def get_expenses(
    category: str = None,
    start_date: str = None,
    end_date: str = None
):

    query = "SELECT * FROM expenses WHERE 1=1"
    values = []

    if category:
        query += " AND LOWER(category) = LOWER(%s)"
        values.append(category)

    if start_date:
        query += " AND date >= %s"
        values.append(start_date)

    if end_date:
        query += " AND date <= %s"
        values.append(end_date)

    query += " ORDER BY date DESC, id DESC"

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute(query, values)
    expenses = cursor.fetchall()

    cursor.close()
    db.close()

    return expenses


# ---------------- SUMMARY ----------------

@app.get("/summary")
def get_summary():

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Total spending
    cursor.execute("""
        SELECT COALESCE(SUM(amount), 0) AS total_spend
        FROM expenses
    """)

    total = cursor.fetchone()["total_spend"]

    # Current month spending
    cursor.execute("""
        SELECT COALESCE(SUM(amount), 0) AS current_spend
        FROM expenses
        WHERE YEAR(date) = YEAR(CURDATE())
        AND MONTH(date) = MONTH(CURDATE())
    """)

    current = cursor.fetchone()["current_spend"]

    # Previous month spending
    cursor.execute("""
        SELECT COALESCE(SUM(amount), 0) AS previous_spend
        FROM expenses
        WHERE YEAR(date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND MONTH(date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    """)

    previous = cursor.fetchone()["previous_spend"]

    # Category-wise spending
    cursor.execute("""
        SELECT
            category,
            SUM(amount) AS total_spend
        FROM expenses
        GROUP BY category
        ORDER BY total_spend DESC
    """)

    categories = cursor.fetchall()

    cursor.close()
    db.close()

    # Month-over-month change
    if previous > 0:
        change = ((current - previous) / previous) * 100
    else:
        change = 0

    return {
        "total_spend": float(total),
        "current_month_spend": float(current),
        "previous_month_spend": float(previous),
        "month_over_month_change_percent": round(change, 2),
        "spend_by_category": [
            {
                "category": row["category"],
                "total_spend": float(row["total_spend"])
            }
            for row in categories
        ]
    }