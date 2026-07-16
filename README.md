# CodeSage AI — Production-Grade AI Programming Mentor Platform

Created and Engineered by **Anand D**

CodeSage AI is an advanced, production-grade programming mentorship platform designed to help developers master Data Structures and Algorithms (DSA), solve coding challenges, practice mock interviews, and debug source code using explainable AI. 

This repository houses the entire full-stack system, featuring a **Next.js** frontend, a **FastAPI** backend, a **MongoDB** persistence layer, a custom **WebSocket connection manager** for real-time dashboard updates, and a **Machine Learning engine** powered by Scikit-Learn for predicting student weaknesses.

---

## 🏆 Key Features of the Platform

### 1. Modern Glassmorphic Code Editor & Compiler
* **Custom Language Selection Dropdown**: A custom React-based dropdown component designed to display over all editor panels. Solves native HTML `select` constraints using high `z-index` layering, custom scroll containers, and click-away hook handlers. Animated with scale-in and fade transitions.
* **Minimalist Toolbar**: Reclaimed vertical and horizontal space by removing unnecessary macOS layout window controls, aligning editor metadata, file tabs, and action tools perfectly.
* **Hybrid Execution Subsystem**: Integrated remote execution via Judge0 API and a robust local fallback compiler engine. If remote services are unavailable, the platform automatically compiles and runs Python, JavaScript, C++, C, and Java code directly on your local system.

### 2. Live Dynamic Dashboard (Zero Reloads)
* **WebSocket Synchronization**: Client-side listener updates the dashboard state (XP progress bars, daily streaks, sessions, completed challenges) immediately as soon as a coding or quiz event completes in the database.
* **Personalized AI Weak-Area Predictor**: Runs a local **Random Forest Classifier** (`scikit-learn`) on database records. It tracks parameters like average time spent, compile errors, and hints consumed per topic, using actual coding history to classify user weak areas and recommend practice problems.
* **Dynamic Activity Heatmap & Leaderboard**: Displays real coding metrics. Generates a global leaderboard ranked dynamically by XP directly from MongoDB.

### 3. Personal AI Mentor (Google Gemini)
* **Multimodal Chat & Explanations**: A multi-turn mentoring chat with conversational memory, specialized context prompts (DSA, Debug, System Design), and multilingual options.
* **Step-by-Step DSA Visualizer**: Produces structural definition notes, ASCII-art visual diagrams, step-by-step executions, and dry runs with code implementations in Python, Java, C++, and JavaScript.

---

## 🛠️ System Architecture

* **Frontend**: Next.js 15.3.4 (App Router) using Tailwind CSS and CSS-variable theme tokens.
* **Backend**: FastAPI (Python 3.10+) running a Motor-driven async MongoDB client.
* **Database**: MongoDB (Local or remote instance) with automatic index setup.
* **Analytics**: Scikit-Learn (Random Forest) & Numpy.
* **Real-time Engine**: Python WebSockets & ASGI lifespan events.

---

## 📁 Repository Structure

```text
CodeSage-AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/              # Auth, AI, Learn, Practice, Interview, Analytics, History endpoints
│   │   │   └── router.py            # API routing registry
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic environment configuration
│   │   │   ├── database.py          # MongoDB collections and automated seeding logic
│   │   │   ├── events.py            # WebSocket manager
│   │   │   └── security.py          # Hashing (bcrypt), authentication, and token generation
│   │   └── services/
│   │       ├── analytics_service.py # Scikit-Learn training and event tracking
│   │       ├── code_execution_service.py # Local fallback runner & Judge0 client
│   │       ├── gamification_service.py # Level and achievement unlocking algorithms
│   │       └── gemini_service.py    # Google Gemini API integration
│   ├── main.py                      # FastAPI app entrypoint
│   └── requirements.txt             # Python requirements
└── frontend/
    ├── src/
    │   ├── app/                     # Page routing (dashboard, debug, learn, roadmap, voice, etc.)
    │   ├── components/              # Sidebar layouts and LanguageDropdown components
    │   ├── lib/                     # API routes, hooks, and Authentication Provider
    │   └── styles/                  # globals.css styling system
    ├── package.json                 # Next.js commands and dependencies
    └── tailwind.config.js           # Theme settings and CSS utilities
```

---

## 🚦 Step-by-Step Installation & Setup Guide

Ensure you have **Python 3.10+**, **Node.js 18+**, and **MongoDB** installed on your system.

### Step 1: Clone and Configure Environment Variables
Copy `backend/.env.example` to `backend/.env` and update the properties:

* **GOOGLE_API_KEY**: Retrieve a key from Google AI Studio and write it directly to the environment.
* **MONGODB_URL**: Set to `mongodb://localhost:27017` (or your remote connection string).
* **JUDGE0_API_KEY**: Optional RapidAPI key for remote execution. If omitted, the backend will automatically compile and execute code locally using your host's runtime interpreters.

#### 🔐 Secure Windows setup:
Run this PowerShell command to write your Gemini API Key directly to `.env` safely:
```powershell
$val = Read-Host -Prompt "Enter GOOGLE_API_KEY" -AsSecureString; $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($val); $PlainVal = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR); Add-Content -Path "backend\.env" -Value "GOOGLE_API_KEY=$PlainVal"; Write-Host "Saved."
```

---

### Step 2: Spin Up the Backend Server
1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate the Python virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\activate
     ```
   * **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI application:
   ```bash
   python -m uvicorn main:app --reload
   ```
   *Upon startup, the backend will automatically establish MongoDB indexes and populate the database with default leaderboard data if empty.*

---

### Step 3: Run the Frontend Application
1. Open a new terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the platform at [http://localhost:3000](http://localhost:3000) inside your browser.

---

## 🗄️ Database Schema & Collections

CodeSage AI automatically provisions the following collections inside MongoDB:
* **`users`**: Stores user profiles, credentials (hashed via bcrypt), current levels, total XP, achievements, and completed topics.
* **`activity`**: Logs timeline events (Runs, Quizzes, AI mentor interactions) to generate activity logs and dynamic heatmaps.
* **`analytics`**: Saves metric profiles used by the Random Forest classifier model.
* **`coding_history`**: Holds user code revisions, compiling status, optimization outputs, and error notes.
* **`chat_history`**: Stores conversational context logs.
* **`leaderboard`**: Syncs active profiles dynamically sorted by global XP.
* **`badges`**: Unlocked student badges (e.g. Bug Squasher, Algo Master, AI Whisperer).

---

## 🧪 Verification and Testing Checklist

To verify that the setup is fully operational, perform the following validation steps:
1. **Sign-up & Seeding check**: Register a new user on [http://localhost:3000/register](http://localhost:3000/register). Upon registration, navigate to the **Leaderboard** tab and verify that pre-seeded users are shown and ranked correctly.
2. **Local Compiler Fallback**: Navigate to **AI Debugger** or **Practice Arena**, choose **Python** or **JavaScript**, write some code, and click **Run**. Verify that compile errors or outputs return successfully without configure keys.
3. **Dynamic Broadcast**: Complete a practice challenge or quiz. Verify that your XP progression bar, current level badge, and achievements panel update in real-time without page reload.
4. **Machine Learning Predictor**: Perform three coding attempts. Verify that the **AI-Detected Weak Areas** section update recommendations dynamically from the classifier engine.
