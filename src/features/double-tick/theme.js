import { createContext, useContext } from 'react';

// Page-scoped theme ('light' | 'dark'), mirroring the Manager View / Reporting pattern:
// the page wraps itself in `.dt-scope[data-theme]`, which re-points the design tokens.
// Light is the default here — this page is written for non-technical readers, and the
// light dashboard is the friendlier first impression.
export const DT_THEME_KEY = 'dt-theme';
export const DtThemeContext = createContext('light');
export const useDtTheme = () => useContext(DtThemeContext);

export function readInitialTheme() {
  try {
    const v = localStorage.getItem(DT_THEME_KEY);
    return v === 'dark' || v === 'light' ? v : 'light';
  } catch {
    return 'light';
  }
}

// Categorical palette — same validated steps the Manager View uses, so a colour means
// the same thing across the app. Hue identity is stable across themes; each mode's steps
// were validated separately against its own surface (never an automatic flip).
//   light surface #ffffff · dark surface #0E1633
export const CHART_PALETTE = {
  light: ['#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834', '#4a3aa7', '#e34948'],
  dark:  ['#3987e5', '#008300', '#d55181', '#c98500', '#199e70', '#d95926', '#9085e9', '#e66767'],
};

// Chart chrome / ink per surface.
export const CHART_INK = {
  light: { axis: '#898781', grid: '#e1e0d9', text: '#52514e', surface: '#ffffff', track: '#eeeeea' },
  dark:  { axis: '#898781', grid: '#2c2c2a', text: '#c3c2b7', surface: '#0E1633', track: '#1a2445' },
};

export const palette = (theme) => CHART_PALETTE[theme] || CHART_PALETTE.light;
export const ink = (theme) => CHART_INK[theme] || CHART_INK.light;

// Fixed hue slots for the message-direction series. Colour follows the entity, never its
// rank — "Customer" stays blue whether or not the other series are on screen.
//
// Deliberately two series, not three: SYSTEM events aren't a participant in the
// conversation, and blue/green/purple hard-failed CVD separation on the dark surface
// (ΔE 1.9 protan). System messages are still visible — they appear as their own row in
// the "What kind of messages" breakdown, and the card subtitle says so.
export const DIRECTION_SLOT = { customer: 0, agent: 1 };
