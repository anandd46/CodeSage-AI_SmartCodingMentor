# CodeSage AI — Production-Ready AI Coding Platform

CodeSage AI is an advanced, production-grade programming mentorship platform designed to help developers master Data Structures and Algorithms (DSA), solve real-world coding problems, participate in mock interviews, and debug issues with explainable AI. 

Built using a modern full-stack architecture (**Next.js**, **FastAPI**, **MongoDB**), it features gamified learning loops (XP, levels, streaks, badges) and real-time state synchronization.

---

## 🚀 Key Features & Architectural Upgrades

### 1. Custom Code Editor & Language Selector
- **Custom Language Dropdown**: Overcomes HTML `select` constraints. Implements a React-based custom dropdown overlay styled with Tailwind CSS, utilizing a high `z-index` and document-level click listeners to close cleanly. Uses Framer Motion for premium scale and fade animations.
- **Sleek Minimalist Editor**: Removed mock macOS-style window controls, reclaiming valuable space to realign the toolbar cleanly. Designed for high-density, professional SaaS aesthetics.

### 2. Local Fallback Execution Engine
- **Zero Configuration Required**: The platform is fully prepared to execute code locally when external RapidAPI Judge0 API Keys are omitted.
- **Multi-language Support**: Automatically compiles and runs **Python**, **JavaScript**, **C++**, **C**, and **Java** processes securely using Python's `subprocess` subsystem on the host machine.
- **Execution sandboxing details**: Captures stdout, stderr, execution time, and exit codes gracefully.

### 3. Dynamic Real-Time Dashboard
- **No Manual Reloads**: Integrates a client-side **WebSocket listener** linking the user's dashboard directly to the backend. State updates are broadcasted automatically from FastAPI whenever the user solves a challenge, runs code, completes a quiz, or earns XP.
- **Dynamic Heatmap & Metrics**: Tracks coding volume, streaks, and achievements using real records from MongoDB.

### 4. Machine Learning-Powered Analytics
- **Random Forest Area Predictor**: Leverages `scikit-learn` in the backend. When coding history accumulates, the system fits a Random Forest Classifier on historical parameters (time spent, errors made, hints requested) to predict user weaknesses and recommend practice modules.

### 5. Automated Seeding & MongoDB Schema
- **Collections Created**: `users`, `sessions`, `coding_history`, `achievements`, `leaderboard`, `progress`, `analytics`, `badges`.
- **Database Bootstrapping**: Seeds sample developers automatically on startup if the database is empty, establishing a realistic global leaderboard and user progress right away.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15.3.4 (App Router) | Core user interface, animations, routing. |
| **Styling** | Tailwind CSS & CSS variables | High-fidelity dark glassmorphic design system. |
| **Backend** | FastAPI | Async Python framework, endpoint routing. |
| **Database** | MongoDB (via Motor client) | Async data storage and persistence. |
| **AI Integration**| Google Gemini AI SDK | Multi-turn chat, explanation, quiz, and roadmap generation. |
| **ML Engine** | Scikit-Learn | Random Forest Classifier for student weak-area forecasting. |

---

## 📦 Directory Structure

```text
CodeSage-AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/              # Auth, AI, Learn, Practice, Interview, Analytics, History
│   │   │   └── router.py            # Main API endpoint router
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic Settings configuration validator
│   │   │   ├── database.py          # MongoDB client connector and collection definitions
│   │   │   ├── events.py            # WebSocket connection manager
│   │   │   └── security.py          # JWT, passwords and cryptography utilities
│   │   └── services/
│   │       ├── analytics_service.py # Scikit-Learn predictive model and event tracker
│   │       ├── code_execution_service.py # Local fallback runner & Judge0 integration
│   │       ├── gamification_service.py # Level calculations and achievements
│   │       └── gemini_service.py    # Google Gemini AI wrapper
│   ├── main.py                      # Application lifespan and startup factory
│   └── requirements.txt             # Python dependencies
└── frontend/
    ├── src/
    │   ├── app/                     # Page paths (learn, practice, debug, dashboard, voice)
    │   ├── components/              # Layout, Sidebar, and LanguageDropdown components
    │   ├── lib/                     # API routes and Auth Provider
    │   └── styles/                  # globals.css styling system
    ├── package.json                 # Next.js scripts and configurations
    └── tailwind.config.js           # Theme and styling declarations
```

---

## 🚦 Installation & Setup Instructions

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **MongoDB Server** (Running locally on default port `27017` or configured in environment)

---

### Step 1: Configure Environment Variables
Copy `backend/.env.example` to `backend/.env`.

To populate the **Google Gemini API Key**, run the following secure command in your PowerShell terminal to write it directly without exposing it:
```powershell
$val = Read-Host -Prompt "Enter GOOGLE_API_KEY" -AsSecureString; $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($val); $PlainVal = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR); Add-Content -Path "backend\.env" -Value "GOOGLE_API_KEY=$PlainVal"; Write-Host "Saved."
```

---

### Step 2: Setup the Backend
1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate your virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend development server:
   ```bash
   python -m uvicorn main:app --reload
   ```
   *The backend will boot up, connect to MongoDB, and automatically seed initial data if empty.*

---

### Step 3: Setup the Frontend
1. Open a terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🧪 Verification & Testing Checklists

- **Dashboard Verification**: Registered users should see XP levels, unlocked achievements, recent activity history, and the global leaderboard dynamically compiled from MongoDB.
- **Code Execution Verification**: Run code inside the Practice Arena or Debug screen. Python and JavaScript run locally via script runner if RapidAPI is not defined.
- **Real-time Synchronization**: Submit a code runner event and observe the XP level and dashboard widgets update in real-time without refreshing.
