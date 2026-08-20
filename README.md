# FLUENCIFY: Progressive Fluency Training

FLUENCIFY is a responsive web application that delivers structured, level-based stammering training using real-time speech analysis, visual biofeedback, and progressive difficulty. 

## Hackathon Deliverables Mapping

Please note that our repository structure maps to the Deliverables rubric (Section 6) as follows:

*   **D1: Web App (`/frontend`)**: Contains the React + Vite frontend with our Web Audio API pipeline, UI components, and the 7-Level progression logic. *(Note: This corresponds to the `/webapp` directory requested in the rubric).*
*   **D2: ML Pipeline (`/ml`)**: Contains the HuBERT + SVM 5-class Disfluency Classifier training scripts and the Syllable Counter heuristics.
*   **D3: Backend API (`/backend`)**: Contains the FastAPI server, SQLite database logic, scoring algorithms, and dynamic exercise generation. *(Note: This corresponds to the `/api` directory requested in the rubric).*
*   **D4: Dataset (`/data`)**: Contains the synthetic audio generation pipeline resulting in 500 perfectly balanced audio clips across all 5 disfluency classes.
*   **D5: Model Card (`MODEL_CARD.md`)**: Contains the evaluation metrics, precision/recall, and ethical considerations/bias notes for our ML pipeline.

## How to Run Locally

### 1. Backend API (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # On Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### 2. Frontend Web App (React)
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.
