
(() => {
    const input = document.getElementById("analyzerPassword");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const clearBtn = document.getElementById("clearAnalyzer");
    const toggleBtn = document.getElementById("toggleAnalyzer");
    const panel = document.getElementById("analysisPanel");

    async function generateSHA1(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-1", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));

        const hashHex = hashArray
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();

        return {
            prefix: hashHex.slice(0, 5),
            suffix: hashHex.slice(5)
        };
    }


    async function checkPwnedPassword(password) {
        const { prefix, suffix } = await generateSHA1(password);

        // Create a controller for the API request.
        const controller = new AbortController();

        // Stop the request after 10 seconds.
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 10000);

        try {
            const response = await fetch(
                `https://api.pwnedpasswords.com/range/${prefix}`,
                {
                    method: "GET",
                    headers: {
                        "Add-Padding": "true"
                    },
                    credentials: "omit",
                    referrerPolicy: "no-referrer",
                    cache: "no-store",
                    signal: controller.signal
                }
            );

            if (!response.ok) {
                throw new Error("Unable to connect to the HIBP service.");
            }

            const data = await response.text();
            const matches = data.split("\n");

            for (const line of matches) {
                const [hashSuffix, count] = line.trim().split(":");

                if (
                    hashSuffix &&
                    hashSuffix.toUpperCase() === suffix &&
                    Number(count) > 0
                ) {
                    return Number(count);
                }
            }

            return 0;

        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("HIBP request timed out after 10 seconds.");
            }

            throw error;

        } finally {
            clearTimeout(timeoutId);
        }
    }


    if (!input || !analyzeBtn || !clearBtn || !toggleBtn || !panel) return;

    const commonPasswords = new Set([
        "password", "password1", "123456", "123456789", "12345678",
        "qwerty", "qwerty123", "admin", "letmein", "welcome",
        "iloveyou", "abc123", "111111", "000000", "passw0rd"
    ]);

    function analyze(password) {
        const lower = password.toLowerCase();

        const checks = [
            { label: "At least 12 characters", pass: password.length >= 12 },
            { label: "Uppercase and lowercase letters", pass: /[a-z]/.test(password) && /[A-Z]/.test(password) },
            { label: "Contains numbers", pass: /\d/.test(password) },
            { label: "Contains symbols", pass: /[^A-Za-z0-9]/.test(password) },
            { label: "No common password match", pass: !commonPasswords.has(lower) },
            { label: "No obvious repeated characters", pass: !/(.)\1{2,}/.test(password) },
            { label: "No obvious sequence", pass: !/(?:abc|bcd|cde|123|234|345|qwe|wer)/i.test(password) }
        ];

        const pool =
            (/[a-z]/.test(password) ? 26 : 0) +
            (/[A-Z]/.test(password) ? 26 : 0) +
            (/\d/.test(password) ? 10 : 0) +
            (/[^A-Za-z0-9]/.test(password) ? 32 : 0);

        const entropy = pool ? password.length * Math.log2(pool) : 0;
        const passed = checks.filter(item => item.pass).length;
        const score = password.length === 0
            ? 0
            : Math.round((passed / checks.length) * 100);

        let label = "Weak";

        if (score >= 86 && password.length >= 12 && entropy >= 60) {
            label = "Strong";
        } else if (score >= 70 && password.length >= 10) {
            label = "Good";
        } else if (score >= 43) {
            label = "Fair";
        }

        const suggestions = [];

        if (password.length < 12) {
            suggestions.push("Use at least 12 characters; longer is generally better.");
        }

        if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
            suggestions.push("Consider using both uppercase and lowercase letters.");
        }

        if (!/\d/.test(password)) {
            suggestions.push("Consider adding numbers if they fit your password strategy.");
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            suggestions.push("Consider adding symbols to increase character variety.");
        }

        if (commonPasswords.has(lower)) {
            suggestions.push("This matches a commonly used password. Choose something unpredictable.");
        }

        if (/(.)\1{2,}/.test(password)) {
            suggestions.push("Avoid long runs of repeated characters.");
        }

        if (/(?:abc|bcd|cde|123|234|345|qwe|wer)/i.test(password)) {
            suggestions.push("Avoid predictable keyboard or character sequences.");
        }

        if (!suggestions.length) {
            suggestions.push("No obvious issues were found by these basic checks. Use a unique password and enable MFA.");
        }

        return { checks, entropy, score, label, suggestions };
    }

    function escapeHTML(value) {
        return value.replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function render(result, passwordLength) {
        const color = result.label === "Strong"
            ? "#35c98a"
            : result.label === "Good"
                ? "#60a5fa"
                : result.label === "Fair"
                    ? "#fbbf24"
                    : "#fb7185";

        const checks = result.checks.map(item => `
            <div class="metric-row">
                <span>${item.pass ? "✓" : "•"} ${item.label}</span>
                <strong>${item.pass ? "Passed" : "Needs attention"}</strong>
            </div>
        `).join("");

        const suggestions = result.suggestions
            .map(item => `<li>${escapeHTML(item)}</li>`)
            .join("");

        let breachCheckHTML = "";

        if (result.breachCheckError) {
            breachCheckHTML = `
                <div class="metric-list">
                    <div class="metric-row">
                        <span>HIBP breach check</span>
                        <strong>Unavailable</strong>
                    </div>
                    <p class="disclaimer">
                        The breach database could not be reached.
                        Your local password analysis is still available.
                    </p>
                </div>
            `;
        } else if (result.breachCount > 0) {
            breachCheckHTML = `
                <div class="metric-list">
                    <div class="metric-row">
                        <span>Exposure status</span>
                        <strong style="color:#fb7185">
                            Found in known breaches
                        </strong>
                    </div>
                    <div class="metric-row">
                        <span>Known exposure count</span>
                        <strong>${result.breachCount.toLocaleString()}</strong>
                    </div>
                </div>
                <p class="disclaimer">
                    Avoid using this password. Choose a new, unique password.
                </p>
            `;
        } else {
            breachCheckHTML = `
                <div class="metric-list">
                    <div class="metric-row">
                        <span>Exposure status</span>
                        <strong style="color:#35c98a">
                            Not found
                        </strong>
                    </div>
                    <p class="disclaimer">
                        This password was not found in the queried breach corpus.
                        This does not guarantee that it has never been exposed.
                    </p>
                </div>
            `;
        }

        panel.innerHTML = `
            <div class="analysis-score">
                <div class="assessment-heading">
                    <p class="eyebrow">ASSESSMENT</p>
                    <strong class="assessment-label" style="color:${color}">
                        ${result.label}
                    </strong>
                </div>

                <div class="assessment-percentage">
                    <strong>${result.score}%</strong>
                    <span>checks score</span>
                </div>
            </div>

            <div
                class="strength-track analysis-strength-track"
                role="progressbar"
                aria-label="Password assessment score"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${result.score}"
            >
                <span
                    class="analysis-strength-fill"
                    style="width:${result.score}%;background:${color}"
                ></span>
            </div>

            <div class="strength-scale">
                <span>0%</span>
                <span>${result.score} out of 100 checks</span>
                <span>100%</span>
            </div>

            <div class="metric-list">
                <div class="metric-row">
                    <span>Password length</span>
                    <strong>${passwordLength} characters</strong>
                </div>
                <div class="metric-row">
                    <span>Estimated character pool</span>
                    <strong>${result.entropy ? "Based on detected character types" : "Not detected"}</strong>
                </div>
                <div class="metric-row">
                    <span>Approximate entropy</span>
                    <strong>${Math.round(result.entropy)} bits*</strong>
                </div>
            </div>

            <h4 class="feedback-title">Security checks</h4>
            <div class="metric-list">${checks}</div>

            <h4 class="feedback-title">Breach database check</h4>
            ${breachCheckHTML}

            <h4 class="feedback-title">Suggestions</h4>
            <ul class="feedback-list">${suggestions}</ul>

            <p class="disclaimer">
                *The percentage represents the proportion of basic checks passed.
                Entropy is a simplified theoretical estimate, not a guarantee.
                Breach results are based on the HIBP Pwned Passwords database.
            </p>
        `;
    }

    // Track requests to prevent outdated results.
    let activeRequestId = 0;
    const analyzeButtonLabel = analyzeBtn.textContent;

    analyzeBtn.addEventListener("click", async () => {
        if (analyzeBtn.disabled) return;

        if (!input.value) {
            panel.innerHTML = `
                <div class="empty-analysis">
                    <span class="empty-icon">!</span>
                    <h3>Enter a password first</h3>
                    <p>Use a sample password for this educational check.</p>
                </div>
            `;
            input.focus();
            return;
        }

        const password = input.value;
        const requestId = ++activeRequestId;
        const result = analyze(password);

        analyzeBtn.disabled = true;
        analyzeBtn.textContent = "Checking...";
        panel.setAttribute("aria-busy", "true");

        panel.innerHTML = `
            <div class="empty-analysis">
                <span class="empty-icon">…</span>
                <h3>Checking breach database...</h3>
                <p>Your password analysis is being processed. Please wait.</p>
            </div>
        `;

        try {
            result.breachCount = await checkPwnedPassword(password);
            result.breachCheckError = false;

            if (requestId !== activeRequestId || input.value !== password) {
                return;
            }

            render(result, password.length);

        } catch (apiError) {
            console.error("HIBP API error:", apiError);

            if (requestId !== activeRequestId || input.value !== password) {
                return;
            }

            result.breachCount = null;
            result.breachCheckError = true;
            render(result, password.length);

        } finally {
            if (requestId === activeRequestId) {
                analyzeBtn.disabled = false;
                analyzeBtn.textContent = analyzeButtonLabel;
                panel.setAttribute("aria-busy", "false");
            }
        }
    });

    clearBtn.addEventListener("click", () => {
        activeRequestId++;

        analyzeBtn.disabled = false;
        analyzeBtn.textContent = analyzeButtonLabel;
        panel.setAttribute("aria-busy", "false");

        input.value = "";

        panel.innerHTML = `
            <div class="empty-analysis">
                <span class="empty-icon">⬡</span>
                <h3>Your analysis will appear here</h3>
                <p>Enter a sample password and select Analyze password.</p>
            </div>
        `;

        input.focus();
    });

    input.addEventListener("input", () => {
        if (!analyzeBtn.disabled) return;

        activeRequestId++;
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = analyzeButtonLabel;
        panel.setAttribute("aria-busy", "false");

        panel.innerHTML = `
            <div class="empty-analysis">
                <span class="empty-icon">!</span>
                <h3>Password changed</h3>
                <p>Select Analyze password again to check the updated value.</p>
            </div>
        `;
    });

    toggleBtn.addEventListener("click", () => {
        const visible = input.type === "password";
        input.type = visible ? "text" : "password";
        toggleBtn.textContent = visible ? "Hide" : "Show";
    });
})();
