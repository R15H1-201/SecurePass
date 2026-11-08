(() => {
    const isLocalLiveServer =
        (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") &&
        window.location.port === "5500";
    const configuredApiUrl = window.SECUREPASS_API_URL;
    const API_BASE_URL = configuredApiUrl !== undefined
        ? configuredApiUrl.replace(/\/$/, "")
        : (isLocalLiveServer ? "http://127.0.0.1:8000" : "");
    const lengthInput = document.getElementById("passwordLength");
    const lengthValue = document.getElementById("lengthValue");
    const output = document.getElementById("generatedPassword");
    const strengthLabel = document.getElementById("generatedStrength");
    const strengthBar = document.getElementById("generatedStrengthBar");
    const message = document.getElementById("generatorMessage");
    const error = document.getElementById("generatorError");
    const generateBtn = document.getElementById("generateBtn");
    const regenerateBtn = document.getElementById("regenerateBtn");
    const copyBtn = document.getElementById("copyGenerated");
    const toggleBtn = document.getElementById("toggleGenerated");

    if (!lengthInput || !lengthValue || !output || !strengthLabel || !strengthBar ||
        !message || !error || !generateBtn || !regenerateBtn || !copyBtn || !toggleBtn) {
        console.error("SecurePass generator: one or more required HTML elements were not found.");
        return;
    }

    const groups = [
        { id: "uppercase", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
        { id: "lowercase", chars: "abcdefghijklmnopqrstuvwxyz" },
        { id: "numbers", chars: "0123456789" },
        { id: "symbols", chars: "!@#$%^&*()-_=+[]{}:,.?/~" }
    ];
    const similar = new Set("il1Lo0O");

    async function validateSettingsWithBackend() {
        const settings = {
            length: Number(lengthInput.value),
            include_uppercase: document.getElementById("uppercase").checked,
            include_lowercase: document.getElementById("lowercase").checked,
            include_digits: document.getElementById("numbers").checked,
            include_symbols: document.getElementById("symbols").checked
        };

        const response = await fetch(
            `${API_BASE_URL}/password/settings`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(settings)
            }
        );

        if (!response.ok) {
            throw new Error("Backend rejected the password settings.");
        }

        return await response.json();
    }

    function randomInt(max) {
        if (!Number.isSafeInteger(max) || max <= 0) throw new Error("Invalid random range.");
        const limit = Math.floor(0x100000000 / max) * max;
        const values = new Uint32Array(1);
        do { crypto.getRandomValues(values); } while (values[0] >= limit);
        return values[0] % max;
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function estimate(password, poolSize) {
        const entropy = password.length * Math.log2(poolSize);
        let score = 0;
        if (password.length >= 12) score++;
        if (password.length >= 16) score++;
        if (poolSize >= 52) score++;
        if (poolSize >= 70) score++;
        if (entropy >= 80) score++;
        const label = score <= 1 ? "Weak" : score <= 2 ? "Fair" : score <= 3 ? "Good" : "Strong";
        const percent = Math.min(100, Math.round(entropy / 1.2));
        return { label, percent, entropy };
    }

    async function generate() {
        error.textContent = "";
        const length = Number(lengthInput.value);
        const excludeSimilar = document.getElementById("excludeSimilar").checked;
        const selected = groups
            .filter(group => document.getElementById(group.id).checked)
            .map(group => ({
                id: group.id,
                chars: excludeSimilar ? [...group.chars].filter(char => !similar.has(char)).join("") : group.chars
            }))
            .filter(group => group.chars.length);

        if (!selected.length) {
            error.textContent = "Select at least one character type.";
            output.value = "";
            strengthLabel.textContent = "Not generated";
            strengthBar.style.width = "0";
            strengthLabel.textContent = "Not generated";
            message.textContent = "Choose one or more character types to continue.";
            return;
        }
        if (length < selected.length) {
            error.textContent = `Choose at least ${selected.length} characters to include every selected type.`;
            return;
        }

        // Validate settings with the FastAPI backend.
        // Password generation will still work if the backend is unavailable.
        try {
            await validateSettingsWithBackend();
        } catch (apiError) {
            console.warn("SecurePass API is unavailable:", apiError);

            if (window.SecurePassUI) {
                window.SecurePassUI.toast(
                    "API unavailable. Generating password locally."
                );
            }
        }

        try {
            const passwordChars = [];
            selected.forEach(group => passwordChars.push(group.chars[randomInt(group.chars.length)]));
            const pool = selected.map(group => group.chars).join("");
            while (passwordChars.length < length) passwordChars.push(pool[randomInt(pool.length)]);
            const password = shuffle(passwordChars).join("");
            output.value = password;
            output.type = "password";
            toggleBtn.textContent = "Show";
            toggleBtn.setAttribute("aria-label", "Show password");

            const poolSize = [...new Set(pool)].length;
            const result = estimate(password, poolSize);
            strengthLabel.textContent = `${result.label} · ${result.percent}%`;
            strengthBar.style.width = `${result.percent}%`;
            const strengthColor = result.label === "Weak" ? "#fb7185"
                : result.label === "Fair" ? "#fbbf24"
                    : result.label === "Good" ? "#60a5fa"
                        : "#35c98a";
            strengthBar.style.background = strengthColor;

            const strengthTrack = strengthBar.closest(".strength-track");
            if (strengthTrack) {
                strengthTrack.setAttribute("role", "progressbar");
                strengthTrack.setAttribute("aria-label", "Generated password strength estimate");
                strengthTrack.setAttribute("aria-valuemin", "0");
                strengthTrack.setAttribute("aria-valuemax", "100");
                strengthTrack.setAttribute("aria-valuenow", String(result.percent));
            }

            message.textContent = `${length} characters · Approximately ${Math.round(result.entropy)} bits of theoretical entropy. The percentage is a simplified estimate, not a guarantee.`;
            if (window.SecurePassUI) window.SecurePassUI.toast("Secure password generated.");
        } catch (err) {
            error.textContent = "Secure random generation is unavailable in this browser context. Use localhost or HTTPS.";
            console.error(err);
        }
    }

    lengthInput.addEventListener("input", () => { lengthValue.value = lengthInput.value; lengthValue.textContent = lengthInput.value; });
    generateBtn.addEventListener("click", generate);
    regenerateBtn.addEventListener("click", generate);
    toggleBtn.addEventListener("click", () => {
        const visible = output.type === "password";
        output.type = visible ? "text" : "password";
        toggleBtn.textContent = visible ? "Hide" : "Show";
        toggleBtn.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    });
    copyBtn.addEventListener("click", async () => {
        if (!output.value) {
            if (window.SecurePassUI) window.SecurePassUI.toast("Generate a password first.");
            return;
        }
        try {
            await navigator.clipboard.writeText(output.value);
            if (window.SecurePassUI) window.SecurePassUI.toast("Password copied to clipboard.");
        } catch {
            output.type = "text";
            output.select();
            const copied = document.execCommand("copy");
            output.setSelectionRange(0, 0);
            output.type = "password";
            if (window.SecurePassUI) window.SecurePassUI.toast(copied ? "Password copied." : "Clipboard access was blocked.");
        }
    });
})();
