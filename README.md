# DeadlineIQ — Student Analytics

**Probability of Task Completion Before Deadline & Its Impact on Academic Performance**

---

## Quick Start (5 minutes)

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → API docs: http://localhost:8000/docs
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# → App: http://localhost:3000
```

### 3. Upload data
- Open http://localhost:3000
- Drag your renamed CSV onto the sidebar upload zone
- All 4 pages populate instantly

---

## CSV Column Names (required)

| Column name                  | Type    | Description                                      |
|------------------------------|---------|--------------------------------------------------|
| `submitted_on_time`          | Yes/No  | Did student submit before deadline?               |
| `days_before_deadline`       | float   | Positive = early, negative = late (e.g. -2)      |
| `total_hours_spent`          | float   | Total hours on the assignment                     |
| `hours_per_day_final_week`   | float   | Avg hours/day in the week before deadline         |
| `marks`                      | float   | Score received (1–10)                             |
| `cgpa`                       | float   | Current GPA (optional)                            |
| `total_assignments`          | int     | Total assignments this semester                   |
| `late_submissions`           | int     | How many were submitted late                      |
| `missed_submissions`         | int     | How many were never submitted                     |
| `stress_level`               | int     | Stress near deadlines (1–5)                       |
| `overload_frequency`         | int     | Weekly overload feeling (1–5)                     |

---

## Exporting from Google Forms

### Option A — Manual rename (simple)
1. Forms → Responses tab → click green Sheets icon
2. Sheets → File → Download → CSV
3. Open in Excel/text editor, replace row 1 with the column names above
4. Save as `.csv` and upload

### Option B — Apps Script (automatic)
1. In your linked Google Sheet → Extensions → Apps Script
2. Paste the entire script from `student-analytics-guide.xlsx` → Sheet 3
3. Save, reload the Sheet
4. Use the new **DeadlineIQ → Export Renamed CSV** menu item

---

## API Endpoints

| Method | Endpoint           | Description                                   |
|--------|--------------------|-----------------------------------------------|
| POST   | `/api/upload`      | Upload CSV file                               |
| DELETE | `/api/upload`      | Clear loaded data                             |
| GET    | `/api/stats`       | Descriptive stats, correlation, regression    |
| GET    | `/api/probability` | Bayes, conditional prob, binomial, Poisson    |
| GET    | `/api/sampling`    | SE, margin of error, CI, CLT simulation       |
| GET    | `/api/hypothesis`  | t-test, proportion test, confidence intervals |
| GET    | `/api/solutions`   | Dynamic recommendations + health score        |

Interactive docs: **http://localhost:8000/docs**

---

## Pages

| Page             | URL             | Content                                                        |
|------------------|-----------------|----------------------------------------------------------------|
| Dashboard        | `/dashboard`    | KPI grid, group comparison, hypothesis verdict, solutions      |
| Descriptive      | `/descriptive`  | Histograms, scatter + regression, correlation coefficients     |
| Probability      | `/probability`  | Conditional prob, Bayes matrix, binomial & Poisson charts      |
| Inferential      | `/inferential`  | CLT simulation, CI, t-test, proportion test                    |

---

## Testing with Sample Data

A ready-made `sample_data.csv` (50 rows of realistic synthetic data) is included.
Upload it immediately to verify all charts render correctly before collecting real responses.

Stats of the sample file:
- 50 students · 76% on-time · mean marks 7.03/10
- Mean completion: 2.64 days before deadline
- Realistic correlation between early submission and higher marks

---

## Troubleshooting

| Error                                     | Fix                                                           |
|-------------------------------------------|---------------------------------------------------------------|
| `Missing required columns: {'marks'}`     | Check column header spelling — must be exact, lowercase       |
| `No valid rows remain after cleaning`     | `marks` or `days_before_deadline` has blank cells             |
| `Could not parse CSV`                     | File must be `.csv`, not `.xlsx`                              |
| Frontend shows "No data loaded"           | Upload CSV first via the sidebar drop zone                    |
| CORS error in browser console             | Ensure backend is running on port 8000                        |
| `uvicorn: command not found`              | Activate venv: `source venv/bin/activate`                     |
