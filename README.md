# SecurePass

SecurePass is a browser-based password generator and password security analyzer. The frontend is built with HTML, CSS, and JavaScript. The backend uses FastAPI to validate password-generation settings.

## Privacy design

- Password generation and password analysis happen in the browser.
- The FastAPI endpoint receives generator settings only. It does not receive the generated or analyzed password.
- SecurePass does not store passwords or use a database.
- The optional Have I Been Pwned Pwned Passwords check sends only the first five characters of the password's SHA-1 hash. The remaining hash is compared in the browser. The password itself is not sent.

## Project structure

```text
Password/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── routes/
│   ├── schemas/
│   └── services/
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
├── .gitignore
├── .python-version
├── pyproject.toml
└── requirements.txt
```

## Run locally

Use Python 3.14 (or another version supported by your installed FastAPI dependencies). From the project root:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

Open `http://127.0.0.1:8000/`. The FastAPI app serves the frontend and API from one origin. API documentation is at `http://127.0.0.1:8000/docs`.

If you prefer VS Code Live Server during development, run FastAPI on port 8000 and serve `frontend/` on port 5500. The frontend automatically uses `http://127.0.0.1:8000` in that local Live Server setup.

## Deploy to Vercel

1. Push this project root to a GitHub repository. Do not commit `venv/`, `.venv/`, `.env`, or Python cache files.
2. Import the GitHub repository into Vercel.
3. Set the Vercel project root directory to the repository root (`./`).
4. Leave the Framework Preset on the detected FastAPI/Python preset. Do not set a separate frontend output directory or a second service.
5. Deploy. Vercel uses `pyproject.toml` to locate `backend.main:app`; the FastAPI app serves `frontend/` and its API routes on the same domain.
6. Test `/`, `/health`, `/password/settings` (POST), and `/docs`.

The optional `FRONTEND_ORIGINS` environment variable is only needed if the API is later served from a separate origin. For the current same-origin deployment, it can remain unset.
