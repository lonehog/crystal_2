import { useEffect, useState } from 'react';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial theme
    const initialDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkMode(initialDarkMode);

    document.body.classList.toggle('dark-mode', initialDarkMode);
    document.body.classList.toggle('light-mode', !initialDarkMode);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    document.body.classList.toggle('dark-mode', newDarkMode);
    document.body.classList.toggle('light-mode', !newDarkMode);

    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  return { isDarkMode, toggleTheme };
};