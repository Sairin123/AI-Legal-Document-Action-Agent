# AI Legal Document Action Agent

A full-stack project simulating an intelligent pipeline of specialized AI agents (Summarizer, Clause Extractor, Risk Analyzer, Action Recommendation) that parses legal documents using PyMuPDF and OpenAI.

## Built With

- **Frontend**: Vite, React, Tailwind CSS v3, Framer Motion, Axios
- **Backend**: Python, FastAPI, SQLAlchemy (SQLite), PyMuPDF, OpenAI, PyJWT

---

## 🚀 How to Run Locally

You must run *both* the backend API and the frontend UI concurrently.

### 1. Start the Backend API (FastAPI)

1. Open a new terminal.
2. Navigate to the server module:
   ```bash
   cd server
   ```
3. Activate the virtual environment (macOS/Linux):
   ```bash
   source venv/bin/activate
   ```
4. Install dependencies (if not already done):
   ```bash
   pip install -r requirements.txt
   ```
   *(Or manual: `pip install fastapi uvicorn sqlalchemy pydantic "python-jose[cryptography]" "passlib[bcrypt]" python-multipart pymupdf openai pytest httpx`)*
5. Seed the database with sample data:
   ```bash
   python seed_data.py
   ```
6. Set your OpenAI API Key (optional but required for live AI text extraction):
   ```bash
   export OPENAI_API_KEY="sk-your-key-here"
   ```
   *(If not set, it uses static fallback responses).*
7. Run the Local Server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   
   🎉 **Backend is now live at `http://localhost:8000`**
   - **Swagger Docs:** `http://localhost:8000/docs`
   - **OpenAPI JSON:** `http://localhost:8000/openapi.json`

### 2. Start the Frontend UI (React + Vite)

1. Open a second terminal.
2. Navigate to the root directory where the Vite project resides.
3. Install node dependencies:
   ```bash
   npm install
   ```
4. Run the Dev Server:
   ```bash
   npm run dev
   ```

   🎉 **Frontend is now live at `http://localhost:5173`**

---

## 🧪 Testing and Deliverables

- **Unit Tests**: Navigate to `server/` with the virtualenv active, and run `pytest test_main.py`
- **Postman Collection**: Import the `server/postman_collection.json` file into Postman to natively test endpoints.
- **Database**: SQLite handles all the schema relations locally without setup via `app.db`.
