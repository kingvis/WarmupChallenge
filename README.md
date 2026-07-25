# Hearthline: Smart Recovery and Prevention Support Platform

Hearthline is a production-ready, mobile-first web application designed for individuals navigating substance use disorders and their caregivers. It focuses on low-friction, zero-typing interactions to deliver personalized emergency crisis communication, caregiver advice, grounding tools, and educational guidance in high-stress moments.

---

## 🌟 Key Features

1. **Zero-Typing Situation Intake**:
   - Guided selections tailored to specific stressors (cravings, distress, check-ins, or support queries) to reduce cognitive load.
2. **AI Emergency Script Generator**:
   - Secures a live Gemini API model call (`gemini-1.5-flash`) via the backend to construct calm, practical communication scripts (for texting sponsors, family, or friends) without shame or guilt.
   - Built-in, high-fidelity, context-aware fallback response engine that runs locally if the API key is not supplied.
3. **Caregiver Support Portal**:
   - Tailored advice panels including *What to Say*, *What to Avoid*, *Boundary Settings*, and *When to Escalate* to help family members respond safely.
4. **Interactive Safety Tools**:
   - **5-Minute Box Breathing**: Visual expand-contract breathing guide (4s inhale, 4s hold, 4s exhale, 4s hold) to de-escalate anxiety.
   - **Interactive Safety Plan**: Edit and persist local coping strategies, trigger points, and direct-dial sponsor shortcuts in memory.
   - **Emergency Dialer**: Direct links to dial 988 (Suicide & Crisis Lifeline) and 911.
5. **Accessible Design**:
   - Light and dark themes using a restrained, soothing teal palette.
   - Accessible font pairings, minimum 48px touch targets, visible focus indicators, and robust mobile layouts.

---

## 🛠️ Technology Stack

- **Frontend**: React (v19) + Vite (v8) + Vanilla CSS (variables, custom animations, keyframe breathing loops).
- **Backend**: Node.js + Express.
- **AI Integration**: Official `@google/generative-ai` SDK (`gemini-1.5-flash` model).

---

## ⚙️ Project Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template `.env.example` to create a `.env` file:
```bash
cp .env.example .env
```
Open `.env` and enter your Gemini API key:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```
> **Note**: If `GEMINI_API_KEY` is not present, Hearthline will automatically fall back to its offline, context-aware fallback engine to ensure the platform remains fully functional.

### 3. Run Locally (Development)
Start the concurrent development environment (starts both Vite dev server on port `5173` and Express proxy server on port `5000`):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚀 Deployed / Production Build

To build and run the application in a production environment:
```bash
# Build the production assets
npm run build

# Start the Express server (serves build static files and handles API endpoints)
npm run start
```
The application will run on [http://localhost:5000](http://localhost:5000).
