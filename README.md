# Digital Employee AI - Frontend Application

A state-of-the-art AI-powered customer engagement, interaction analysis, and sentiment dashboard built with **React**, **Vite**, and **Recharts**.

---

## 🚀 Quick Start Guide (How to Run Locally)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18+ recommended) installed on your system. You can verify your installation by running:
```bash
node -v
npm -v
```

---

### Step 1: Clone the Repository
Open your terminal (PowerShell, Command Prompt, or Terminal) and run:
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd "Graduation Project Frontend"
```

---

### Step 2: Install Dependencies
Install all required packages (React, Lucide icons, Recharts, Axios, Router, etc.):
```bash
npm install
```

---

### Step 3: Start the Development Server
Launch the application locally:
```bash
npm run dev
```

Once running, open your web browser and navigate to the address shown in your terminal (typically `http://localhost:5173`).

---

## 🔐 Test Login Credentials
To test the application as a business owner:
- **Email**: `owner@burgerpalace.com`
- **Password**: `Test123!`

---

## 📁 Key Features & Modules
- **Interactive Dashboard**: Overview of live customer interactions, product revenue metrics, priority notifications, and live order feed.
- **Sentiment Analysis**: Real-time breakdown of AI sentiment scoring (`Satisfied`, `Neutral`, `Angry`) linked directly to customer interaction logs.
- **Omnichannel Interactions**: Live voice call audio playback (`/calls/:id`) and customer support chat transcripts (`/conversations/:id`).
- **Real-Time Notifications**: Priority alert badge engine categorized by severity (`Critical`, `Warning`, `Ready`, `Info`).
