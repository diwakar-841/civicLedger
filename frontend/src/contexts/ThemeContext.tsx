import { createContext, useContext, useEffect, useState, ReactNode } from "react";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("cl-theme-v2");
    if (stored === "light" || stored === "dark") {return stored;}

    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("cl-theme-v2", theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => {return t === "dark" ? "light" : "dark";});
  }

  return (
    _jsxDEV(ThemeContext.Provider, {
 value: { theme, toggle }, children:
      children 
}, void 0, false
    ));

}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {throw new Error("useTheme must be used within ThemeProvider");}
  return ctx;
}