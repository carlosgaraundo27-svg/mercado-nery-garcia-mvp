import React from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

const ThemeToggle = () => {
  const [isDark, toggleDarkMode] = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      type="button"
      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 transition-colors duration-200 focus:outline-none flex items-center justify-center cursor-pointer shadow-xs border border-slate-200 dark:border-slate-700"
      title={isDark ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
      aria-label="Alternar Tema"
    >
      {isDark ? (
        <span className="text-sm leading-none">☀️</span>
      ) : (
        <span className="text-sm leading-none">🌙</span>
      )}
    </button>
  );
};

export default ThemeToggle;
