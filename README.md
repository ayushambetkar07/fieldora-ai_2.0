# 🌾 Fieldora AI 2.0 — Next-Gen Agricultural Intelligence & B2B Marketplace

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com/)
[![GROQ](https://img.shields.io/badge/GROQ-LLM-FF6B00?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVIN0wxMiAzeiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=&logoColor=white)](https://groq.com/)

---

## 📖 Overview

**Fieldora AI 2.0** is an enterprise-grade, full-stack agricultural commerce ecosystem designed to bridge the gap between farmers, institutional buyers, and logistics networks. Powered by **GROQ AI (openai/gpt-oss-120b)**, **Real-Time APMC Mandi Feeds**, and an **A\* Graph Routing Algorithm**, Fieldora eliminates predatory middlemen, enforces fair pricing, and streamlines agri-supply chain logistics

---

## 🚀 Key Features & Capabilities

### 👨‍🌾 1. Farmer Hub & Farm Management
- **Produce Listing Management**:
  - List crops with high-resolution imagery, quantity (kg / quintal / ton), harvest date, quality grade (Grade A / Export, Grade B / Standard), and minimum reserve price.
  - Track stock levels, active listings, and sold batches in real time.
- **Live APMC Mandi Market Prices**:
  - Real-time commodity feeds across Indian states, districts, and markets.
  - Interactive historical price trend visualizers and MSP (Minimum Support Price) comparisons.
  - AI-driven advisory informing farmers whether to sell immediately or hold based on projected arrival volume.
- **Smart Counter-Bidding & Negotiation**:
  - Review buyer purchase offers and counter with custom price-per-unit or bulk concessions.
  - Real-time bid status transitions (`Pending`, `Countered`, `Accepted`, `Rejected`, `Escrow Locked`).
- **Buyer Demand Feed**:
  - Direct visibility into active procurement requirements posted by institutional buyers.
  - One-click quote submission directly from farmer inventory.
- **Farmer Trust & Reputation Engine**:
  - Multi-factor trust scoring computed from successful fulfillment rate, on-time delivery metrics, and verified buyer quality reviews.

---

### 🏢 2. Buyer & Institutional Procurement Portal
- **Agricultural Marketplace**:
  - Interactive discovery engine with multi-parameter filtering: crop type, organic certification, quality grade, maximum price, and seller proximity.
  - Comprehensive produce detail view with farmer profile, location distance, and verified badge.
- **AI-Powered Matching Engine**:
  - Automated match scoring algorithm pairing buyer demand with active farmer listings using geospatial Haversine distance, commodity variety, grade, and unit pricing compatibility.
- **Custom Requirement Broadcasting**:
  - Post bulk purchase tenders specifying quantity, target delivery timeline, expected price ceiling, and delivery location.
- **Direct Purchase Requests & Escrow Workflow**:
  - Initiate direct buy offers with flexible negotiation turns.
  - Simulated secure escrow transaction milestones protecting buyer capital until delivery inspection passes.
- **Verified Reviews & Ratings**:
  - Post-delivery rating pipeline for produce freshness, weight accuracy, and logistics handling.

---

### 🚚 3. Smart Transport & Logistics Engine (A* Routing)
- **A\* Pathfinding Route Visualizer**:
  - Interactive canvas map simulating road networks, transit nodes, congestion factors, and terrain elevation.
  - Visual breakdown of open set, closed set, and optimal path selection.
- **Fleet Optimization & Vehicle Recommendation**:
  - Automated vehicle matching based on payload weight and crop perishability (e.g., Mini Truck, 10-Ton Multi-Axle, Refrigerated Reefer Container).
- **Logistics Cost & Carbon Footprint Estimator**:
  - Instant estimates for fuel costs, toll allocations, and CO₂ emissions per shipment.
- **Live Order Milestone Tracking**:
  - End-to-end timeline tracking: `Order Placed` ➔ `Harvested` ➔ `Packed` ➔ `In-Transit` ➔ `Delivered`.

---

### 🤖 4. AI Assistant & Intelligence Suite
- **Multilingual Agri-Advisory Chatbot**:
  - Powered by **GROQ AI**, offering instant voice and text guidance in regional languages (English, Hindi, Marathi, etc.).
  - Crop disease diagnosis recommendations, soil health advice, and season planning.
- **Proactive Demand & Price Spike Alerts**:
  - Automated background monitoring that alerts farmers when a nearby buyer requirement matches their inventory or when market prices jump significantly.

---

### 🌐 5. Multilingual & Platform Experience
- **Dynamic Language Localization**: Multi-language UI switching across all pages and modals.
- **Real-Time Data Sync**: Supabase PostgreSQL subscriptions and WebSocket channels for instant notification of bids, orders, and messages.
- **Responsive Modern UI**: Built with Tailwind CSS, glassmorphism accents, accessible keyboard navigation, and dark/light adaptive components.

---

## 🏗️ Architecture & Tech Stack

```
fieldora-2.0/
├── frontend/               # React 18 + Vite + TypeScript Client
│   ├── src/
│   │   ├── components/     # Layout, Nav, AIAssistantDrawer, Transport, UI
│   │   ├── pages/          # Farmer, Buyer, Transport, Public Pages
│   │   ├── services/       # AI (GROQ), A* Routing, Supabase, Auth
│   │   └── context/        # Global App Context & State
├── backend/                # Express + TypeScript Server
│   ├── src/
│   │   ├── routes/         # REST API (Produce, Orders, Mandi, Matching, AI)
│   │   ├── services/       # Negotiation, OrderLifecycle, TrustScore, Matching
│   │   └── server.ts       # Express Server & WebSocket Setup
└── .gitignore              # Project Git Ignore Configuration
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Serverless HTTP |
| **Database & Auth** | Supabase (PostgreSQL, Row-Level Security, Realtime Subscriptions, Auth) |
| **AI & Algorithms** | GROQ API (openai/gpt-oss-120b), Custom A* Graph Pathfinding |
| **Geospatial** | Haversine Distance Matrix Algorithm |

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- **Node.js** (v18.0 or higher)
- **npm** or **yarn**
- **Supabase Account**
- **GROQ API Key**

### 2. Clone the Repository
```bash
git clone https://github.com/ayushambetkar07/fieldora-ai_2.0.git
cd fieldora-ai_2.0
```

### 3. Configure Environment Variables

#### Backend Configuration:
Create `backend/.env` based on `backend/.env.example`:
```ini
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

#### Frontend Configuration:
Create `frontend/.env` based on `frontend/.env.example`:
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 5. Run in Development Mode

```bash
# Start backend server (Port 5000)
npm run dev:backend

# In a separate terminal, start frontend client (Port 5173)
npm run dev:frontend
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/market-prices` | Fetch real-time APMC Mandi price benchmarks |
| `GET` | `/api/produce` | Browse and filter listed agricultural produce |
| `POST` | `/api/produce` | Create a new farmer produce listing |
| `GET` | `/api/buyer-requirements` | List active institutional buyer requirements |
| `POST` | `/api/buyer-requirements` | Post a new bulk purchase requirement |
| `POST` | `/api/orders` | Place or negotiate a purchase order |
| `PATCH` | `/api/orders/:id/negotiate` | Counter-offer or update negotiation status |
| `PATCH` | `/api/orders/:id/lifecycle` | Advance shipment milestone (Harvested, In-Transit, Delivered) |
| `POST` | `/api/reviews` | Submit verified buyer/seller ratings |
| `POST` | `/api/ai/chat` | Query GROQ AI Multilingual Agri-Assistant (user + market data context) |
| `GET` | `/api/demand-alerts` | Retrieve targeted demand spike alerts |

---

## 🔒 Security & Best Practices

- **Zero Secrets in Version Control**: `.env` and local credentials are strictly excluded via `.gitignore`.
- **Row-Level Security (RLS)**: Enforced database-level policies on Supabase tables ensuring users access only authorized records.
- **Escrow Simulation**: Safeguards funds throughout buyer-farmer transactions until delivery verification.

---

## 👥 Authors & Contributors

- **Ayush Ambetkar** ([@ayushambetkar07](https://github.com/ayushambetkar07))
- **Fieldora AI Team**

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
