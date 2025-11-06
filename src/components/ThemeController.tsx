/**
 * @fileoverview ThemeController component - Allows users to switch between DaisyUI themes.
 */

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "minesweeper-theme";
const DEFAULT_THEME = "light";

/**
 * ThemeController component - Dropdown menu for switching themes.
 * Uses DaisyUI's theme-controller class to change themes via CSS.
 * Persists theme selection in localStorage.
 */
export function ThemeController() {
  const [currentTheme, setCurrentTheme] = useState<string>(DEFAULT_THEME);

  // Load theme from localStorage on mount and apply it
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = savedTheme || DEFAULT_THEME;
    
    // Apply theme to HTML element
    document.documentElement.setAttribute("data-theme", initialTheme);
    setCurrentTheme(initialTheme);
  }, []);

  // Update state when theme changes (for external changes via DaisyUI theme-controller)
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
          const theme = document.documentElement.getAttribute("data-theme") || DEFAULT_THEME;
          setCurrentTheme(theme);
          // Save to localStorage when theme changes
          localStorage.setItem(THEME_STORAGE_KEY, theme);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // Handle manual theme change (when user clicks a radio button)
  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  };

  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "cupcake", label: "Cupcake" },
    { value: "synthwave", label: "Synthwave" },
    { value: "retro", label: "Retro" },
  ];

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
        <svg
          width="20"
          height="20"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="inline-block h-5 w-5 stroke-current md:h-6 md:w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <span className="hidden md:inline ml-2">Theme</span>
        <svg
          width="12px"
          height="12px"
          className="ml-1 inline-block h-2 w-2 fill-current opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content bg-base-300 rounded-box z-1 w-52 p-2 shadow-2xl"
      >
        {themes.map((theme) => (
          <li key={theme.value}>
            <input
              type="radio"
              name="theme-dropdown"
              className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
              aria-label={theme.label}
              value={theme.value}
              checked={currentTheme === theme.value}
              onChange={() => handleThemeChange(theme.value)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

