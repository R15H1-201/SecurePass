# SecurePass

**A simple workspace for creating stronger passwords and checking password security.**

SecurePass brings a password generator, a password analyzer and a few practical security reminders into one responsive web app. I built it to make everyday password checks easier while keeping the actual password in the browser.

**Live app:** [Open SecurePass](https://secure-pass-qjthtl5f0-rishikumavatcoders-projects.vercel.app/)  
**Source code:** [R15H1-201/SecurePass](https://github.com/R15H1-201/SecurePass)

## What you can do with it

- **Generate passwords:** Choose a length and select uppercase letters, lowercase letters, numbers and symbols. You can also exclude similar-looking characters.
- **Check password strength:** Review a password against common weak patterns, length and character variety checks. The analyzer gives a strength label and suggestions for improvement.
- **Check for known breaches:** Optionally compare a password against the Have I Been Pwned (HIBP) Pwned Passwords database.
- **Read security tips:** Find short reminders about unique passwords, passphrases, multi-factor authentication and password managers.
- **Use it on mobile:** The interface includes responsive navigation and layouts for smaller screens.

## A note about privacy

Privacy was an important part of this project, so the app is designed not to send passwords to its FastAPI backend or store them in a database.

- Password generation and the basic strength analysis happen in the browser.
- The backend receives the generator settings (such as length and selected character types), not the generated password.
- If you choose the HIBP breach check, the browser calculates the password's SHA-1 hash and sends only its first five characters to the HIBP range endpoint. The remaining hash is compared in the browser. The original password is not sent to HIBP.
- A result of **Not found** only means the password was not found in the queried breach data. It is not a guarantee that the password has never been exposed.

As with any website, network requests still reveal ordinary connection information to the services involved. Avoid entering a password that you currently use for an important account. A sample password is safer for demonstrations.

## Built with

- HTML, CSS and vanilla JavaScript
- Python and FastAPI
- Pydantic for request validation
- Web Crypto API for browser-side random number generation and hashing
- Have I Been Pwned Pwned Passwords API for the optional breach lookup
- Vercel for deployment

## Run it locally

You will need Python installed on your computer.

1. Clone the repository and open its folder:

   ```bash
   git clone https://github.com/R15H1-201/SecurePass.git
   cd SecurePass
   ```

2. Create and activate a virtual environment.

   **Windows (PowerShell):**

   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

   **macOS / Linux:**

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install the Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start the app from the repository root:

   ```bash
   python -m uvicorn backend.main:app --reload
   ```

5. Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

The FastAPI app serves the frontend and API from the same origin. The API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs), and the health endpoint is [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health).

### Using VS Code Live Server (optional)

If you prefer to preview the frontend with Live Server, open `frontend/index.html` and start Live Server. The current local setup allows the origins `http://127.0.0.1:5500` and `http://localhost:5500`, while FastAPI should remain running on port `8000`.

## API

The backend is intentionally small. It validates generator options; it does not generate, receive or store the password itself.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Returns the API health status |
| `GET` | `/api` | Returns a short API welcome response |
| `POST` | `/password/settings` | Validates the requested password settings and returns the enabled character types |

Example request to `POST /password/settings`:

```json
{
  "length": 16,
  "include_uppercase": true,
  "include_lowercase": true,
  "include_digits": true,
  "include_symbols": true
}
```

The length must be between 8 and 64, and at least one character type must be selected.

## Project structure

```text
SecurePass/
├── backend/
│   ├── routes/       # Health and password-settings endpoints
│   ├── schemas/      # Request and response validation models
│   ├── services/     # Password-settings helper logic
│   └── main.py       # FastAPI app and frontend serving
├── frontend/
│   ├── assets/
│   ├── css/          # Layout, responsive styles and page styling
│   ├── js/           # Generator, analyzer and navigation
│   └── index.html
├── .gitignore
├── .python-version
├── pyproject.toml
└── requirements.txt
```

## Deployment

The repository is configured for a root-level Vercel FastAPI deployment. Import `R15H1-201/SecurePass` into Vercel with the repository root (`./`) as the Root Directory and the FastAPI preset. Keep the root `requirements.txt` in place so the deployment environment can install the application dependencies.

After deployment, test the homepage, `/health`, `/docs` and the password settings endpoint. If you change deployment settings or dependencies, push the changes to GitHub and check the new Vercel deployment logs if anything fails.

## Current scope

SecurePass is a learning project and a practical demonstration of browser-side password tools. Its strength score is a basic estimate, not a formal security audit. It does not replace a reputable password manager, multi-factor authentication or a full password-security review.

## Feedback

If you try SecurePass and notice a bug or have an idea that would make it more useful, feel free to open an issue in the GitHub repository.
