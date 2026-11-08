
(() => {
    const pages = [...document.querySelectorAll(".page")];

    // Include desktop and mobile navigation items.
    const navItems = [
        ...document.querySelectorAll(
            ".nav-item[data-page], .mobile-nav-item[data-page]"
        )
    ];

    const pageTitle = document.getElementById("pageTitle");
    const breadcrumb = document.getElementById("breadcrumb");
    const sidebar = document.getElementById("sidebar");
    const mobileMenu = document.getElementById("mobileMenu");
    const mobileMoreBtn = document.getElementById("mobileMoreBtn");
    const mobileMoreMenu = document.getElementById("mobileMoreMenu");

    const titles = {
        dashboard: "Dashboard",
        generator: "Password Generator",
        analyzer: "Password Analyzer",
        insights: "Security Insights",
        settings: "Settings"
    };

    function showPage(name, updateHash = true) {
        if (!titles[name]) name = "dashboard";

        pages.forEach(page => {
            page.classList.toggle(
                "active",
                page.id === `${name}-page`
            );
        });

        navItems.forEach(item => {
            const isActive = item.dataset.page === name;

            item.classList.toggle("active", isActive);

            if (isActive) {
                item.setAttribute("aria-current", "page");
            } else {
                item.removeAttribute("aria-current");
            }
        });

        pageTitle.textContent = titles[name];
        breadcrumb.textContent = `Workspace / ${titles[name]}`;

        if (updateHash && location.hash !== `#${name}`) {
            history.replaceState(null, "", `#${name}`);
        }

        sidebar.classList.remove("open");
        mobileMenu.setAttribute("aria-expanded", "false");

        mobileMoreMenu?.classList.remove("open");
        mobileMoreBtn?.setAttribute("aria-expanded", "false");
    }

    document.addEventListener("click", event => {
        const trigger = event.target.closest("[data-page]");

        if (trigger) {
            event.preventDefault();
            showPage(trigger.dataset.page);
        }
    });

    window.addEventListener("hashchange", () => {
        showPage(location.hash.slice(1), false);
    });

    mobileMenu.addEventListener("click", () => {
        const open = sidebar.classList.toggle("open");

        mobileMenu.setAttribute(
            "aria-expanded",
            String(open)
        );
    });

    mobileMoreBtn?.addEventListener("click", () => {
        const open = mobileMoreMenu.classList.toggle("open");

        mobileMoreBtn.setAttribute(
            "aria-expanded",
            String(open)
        );
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            sidebar.classList.remove("open");
            mobileMenu.setAttribute("aria-expanded", "false");

            mobileMoreMenu?.classList.remove("open");
            mobileMoreBtn?.setAttribute("aria-expanded", "false");
        }
    });

    showPage(location.hash.slice(1) || "dashboard", false);

    window.SecurePassUI = {
        toast(message) {
            const toast = document.getElementById("toast");

            toast.textContent = message;
            toast.classList.add("show");

            clearTimeout(window.__securePassToastTimer);

            window.__securePassToastTimer = setTimeout(
                () => toast.classList.remove("show"),
                2400
            );
        }
    };
})();
