# Payment Reconciliation — MERN Stack

> Full MERN port of the Python/Streamlit payment reconciliation mail sender.
> Same logic, same workflows, same email output — now with MongoDB persistence,
> a REST API, and a React dashboard.

---

## Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, react-dropzone, lucide-react, react-hot-toast |
| Backend  | Node.js, Express 4, express-session |
| Database | MongoDB via Mongoose                |
| Email    | Nodemailer (Gmail SMTP, SSL 465)    |
| Excel    | SheetJS (xlsx) + ExcelJS            |

---

## Project Structure

```
payment-reconciliation/
├── backend/
│   ├── server.js                   # Express entry point
│   ├── .env.example                # Copy to .env and fill in values
│   ├── models/
│   │   └── index.js                # Mongoose: PartyEmail, EmailLog, ReconciliationSession
│   ├── middleware/
│   │   └── auth.js                 # Session-based auth guard
│   ├── routes/
│   │   ├── auth.js                 # POST /login, /logout, GET /status
│   │   ├── partyEmails.js          # CRUD + bulk upload party emails
│   │   ├── reconciliation.js       # Excel upload, parse, match, download
│   │   └── email.js                # Send emails, download logs
│   └── services/
│       ├── excelParser.js          # load_excel() + match_data() — exact Python port
│       ├── emailGenerator.js       # generate_email_body() — exact Python port
│       └── smtpSender.js           # send_email() + randomDelay() — exact Python port
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.jsx
        ├── index.js
        ├── index.css               # Full design system
        ├── services/api.js         # All axios calls
        ├── pages/
        │   ├── LoginPage.jsx
        │   └── Dashboard.jsx
        └── components/
            ├── SampleDownloads.jsx
            ├── PartyEmailUpload.jsx
            ├── PartyEmailEditor.jsx
            ├── PaymentExcelUpload.jsx
            ├── GmailSettings.jsx
            ├── MatchedResults.jsx
            ├── SkippedParties.jsx
            ├── PartiesWithoutEmail.jsx
            └── EmailLogDownload.jsx
```

---

## Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (or MongoDB Atlas URI)
- Gmail account with [App Password](https://myaccount.google.com/apppasswords) enabled

---

### 1. Clone & configure backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI, ADMIN_PASSWORD, EMAIL_UPLOAD_PASSWORD
npm install
```

**`.env` values:**

| Key | Default | Description |
|-----|---------|-------------|
| `PORT` | `5001` | Express server port |
| `MONGODB_URI` | `mongodb://localhost:27017/payment_reconciliation` | MongoDB connection string |
| `SESSION_SECRET` | — | **Change this** to a long random string |
| `ADMIN_PASSWORD` | `Password` | Dashboard login password |
| `EMAIL_UPLOAD_PASSWORD` | `Payment Mail Sender Dashboard` | Party email upload password |

---

### 2. Start backend

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

---

### 3. Install & start frontend

```bash
cd ../frontend
npm install
npm start
```

Opens at **http://localhost:3000** — proxies `/api/*` to Express on port 5001.

---

## Workflow (mirrors Python app exactly)

### Step 1 — Download sample files
Get sample Excel templates for payment data and party email list.

### Step 2 — Upload party emails (one-time)
Expand the protected upload section. Enter the `EMAIL_UPLOAD_PASSWORD`.
Upload an Excel with columns: `Party Code | Party Name | Email | CC`.
Emails are stored in MongoDB — no more `party_emails.json` file.

### Step 3 — Upload Payment Excel
Upload your payment Excel. Supports:
- **Legacy format**: Two sheets named `Payment Details` + `Debit Notes`
- **New format**: Single sheet with columns: `Seller Name, Bill No, Invoice Date, Main Advised No, Seller Advised No, DR, CR, Transaction Type…`

The app automatically:
- Parses both formats
- Validates Invoice Date ≠ Payment Date
- Matches parties to emails by name (whitespace-insensitive)
- Checks debit amount consistency between payment sheet and debit notes
- Reports parties without emails, skipped parties, and matched results

### Step 4 — Enter Gmail credentials & send
Enter your Gmail address and App Password (never your main password).
Click **Send Emails** — a confirmation dialog appears first.
Emails send with a random 1–5 second delay between each (mirrors Python SMTP throttling).

### Logs & Downloads
- Download email log as `.txt` or `.xlsx`
- Download all party-wise payment sheets in one Excel
- Download skipped parties and no-email parties as CSV

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | `{ password }` → sets session |
| POST | `/api/auth/logout` | Destroys session |
| GET | `/api/auth/status` | `{ authenticated: bool }` |

### Party Emails
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/party-emails` | List all party email records |
| POST | `/api/party-emails/upload` | Bulk upload via Excel (requires upload password) |
| PUT | `/api/party-emails/:id` | Update single email (requires `"password"`) |
| GET | `/api/party-emails/sample` | Download sample email Excel |

### Reconciliation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reconciliation/upload` | Upload + parse + match payment Excel |
| GET | `/api/reconciliation/session` | Get current session data |
| GET | `/api/reconciliation/sample` | Download sample payment Excel |
| GET | `/api/reconciliation/download/partywise` | Download all party-wise Excel |

### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/send` | Send all matched emails |
| GET | `/api/email/log/download` | Download log as .txt |
| GET | `/api/email/log/excel` | Download log as .xlsx |
| GET | `/api/email/log/no-email/download` | Download parties-without-email CSV |
| GET | `/api/email/log/skip/download` | Download skipped parties CSV |

---

## Key Logic Ports (Python → Node.js)

| Python function | Node.js equivalent |
|---|---|
| `load_excel()` | `services/excelParser.js → loadExcel()` |
| `match_data()` | `services/excelParser.js → matchData()` |
| `generate_email_body()` | `services/emailGenerator.js → generateEmailBody()` |
| `send_email()` | `services/smtpSender.js → sendEmail()` |
| `time.sleep(random.uniform(1,5))` | `services/smtpSender.js → randomDelay(1000, 5000)` |
| `hash_password()` | `routes/auth.js → hashPassword()` — same SHA-256 |
| `load_party_emails()` | `MongoDB PartyEmail collection` |
| `save_party_emails()` | `PartyEmail.bulkWrite(upsertOps)` |
| `normalize_name()` | `normalizeName()` — strip whitespace, lowercase |
| `safe_date_format()` | `safeDateFormat()` — dd/mm/yyyy output |

---

## Gmail App Password Setup

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification (must be enabled)
3. App Passwords → Select app: Mail → Select device: Other
4. Copy the 16-character password — use this as "App Password" in the dashboard

---

## Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Serve static files from Express (add to server.js):
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/build/index.html')));
```

Use **MongoDB Atlas** for production database. Set `MONGODB_URI` in environment.

Use **PM2** to keep the Node process alive:
```bash
npm install -g pm2
pm2 start backend/server.js --name payment-reconciliation
pm2 save && pm2 startup
```
