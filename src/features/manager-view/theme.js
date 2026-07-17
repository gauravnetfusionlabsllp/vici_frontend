import { createContext, useContext } from 'react';

// Page-scoped theme ('light' | 'dark'). Light is the traditional-dashboard default; dark matches
// the rest of the app. Persisted under this key.
export const MV_THEME_KEY = 'mv-theme';
export const MvThemeContext = createContext('light');
export const useMvTheme = () => useContext(MvThemeContext);
export const useIsDark = () => useContext(MvThemeContext) === 'dark';

export function readInitialTheme() {
  try {
    const v = localStorage.getItem(MV_THEME_KEY);
    return v === 'dark' || v === 'light' ? v : 'light';
  } catch {
    return 'light';
  }
}

// Categorical chart palette (dataviz reference hues, stepped per surface; validated for
// light #ffffff and dark #0E1633). Identity is hue-stable across themes.
export const CHART_PALETTE = {
  light: ['#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834', '#4a3aa7', '#e34948'],
  dark: ['#3987e5', '#008300', '#d55181', '#c98500', '#199e70', '#d95926', '#9085e9', '#e66767'],
};

// Chart chrome / ink per surface (dataviz reference).
export const CHART_INK = {
  light: { axis: '#898781', grid: '#e1e0d9', text: '#52514e', surface: '#ffffff', cursor: 'rgba(42,120,214,0.08)' },
  dark: { axis: '#898781', grid: '#2c2c2a', text: '#c3c2b7', surface: '#0E1633', cursor: 'rgba(57,135,229,0.12)' },
};

export const palette = (theme) => CHART_PALETTE[theme] || CHART_PALETTE.light;
export const ink = (theme) => CHART_INK[theme] || CHART_INK.light;
