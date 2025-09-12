"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // Toggle click for top-level phylum dropdowns
    document.querySelectorAll(".dropdown-button").forEach((button) => {
        button.addEventListener("click", (e) => {
            e.stopPropagation();
            // Close others
            document.querySelectorAll(".dropdown-button.active").forEach((btn) => {
                if (btn !== button) {
                    btn.classList.remove("active");
                }
            });
            // Toggle current
            button.classList.toggle("active");
        });
    });

    // Close when clicking outside
    document.addEventListener("click", () => {
        document.querySelectorAll(".dropdown-button.active").forEach((btn) =>
            btn.classList.remove("active")
        );
    });
});
