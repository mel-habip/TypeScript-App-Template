"use client"

import React from 'react';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import axios from 'axios';

import { SnackbarProvider, closeSnackbar } from 'notistack';
import { AlertsContext } from './AlertsContext';

import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import ThemeContext from './ThemeContext';
import StandardErrorBoundary from './components/StandardErrorBoundary';

const hostname = window.location.hostname;

// Split the hostname by dots (.) to extract the subdomain
const subdomain = hostname.split('.')[0].toLowerCase();
const subdomainAlphaBeta = hostname.split('.')[1]?.toLowerCase();
if (hostname.split('.').pop() === 'localhost') {
  axios.defaults.baseURL = "http://localhost:5050";
} else if (subdomainAlphaBeta === 'alpha') {
  axios.defaults.baseURL = "https://api.alpha.example.com";
} else if (subdomainAlphaBeta === 'beta') {
  axios.defaults.baseURL = "https://api.beta.example.com";
} else {
  axios.defaults.baseURL = "https://api.example.com";
}


export default function App() {

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const locallyStoredTheme = localStorage.getItem('theme');

  type ourThemes = 'dark' | 'light';

  let initialThemeValue: ourThemes = 'light';

  if (prefersDarkMode) initialThemeValue = 'dark';

  if (locallyStoredTheme === 'light') {
    initialThemeValue = 'light';
  } else if (locallyStoredTheme === 'dark') {
    initialThemeValue = 'dark';
  }

  const [mode, setMode] = React.useState<ourThemes>(initialThemeValue);

  const theme = React.useMemo(() => {
    const isDark = mode === 'dark';
    localStorage.setItem('theme', mode);
    return createTheme({
      palette: {
        mode,
      },
    })
  }, [mode]);

  const colorMode = React.useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
  }), []);

  const locallyStoredNavigationLock = localStorage.getItem('navlock');

  const [navigationLock, setNavigationLock] = React.useState(!!locallyStoredNavigationLock);

  const toggleNavigationLock = React.useCallback(() => {
    setNavigationLock(p => {
      if (p) {
        localStorage.removeItem('navlock');
      } else {
        localStorage.setItem('navlock', 'yes!');
      }
      return !p;
    })
  }, []);

  return <>
    <StandardErrorBoundary>
      <ThemeContext.Provider value={{
        ...colorMode,
        theme,
        mode,
        isDark: mode === 'dark',
        navigationLock: {
          setState: setNavigationLock,
          state: navigationLock,
          toggle: toggleNavigationLock
        }
      }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AlertsContext >
            <SnackbarProvider
              maxSnack={5}
              action={(snackbarId: string | number) =>
                <button className="alert-dismiss-button" onClick={() => closeSnackbar(snackbarId)}>
                  <AiOutlineCloseCircle />
                </button>}
            />
            <div>
              <h1>Your app goes here</h1>
            </div>
          </AlertsContext>
        </ThemeProvider>
      </ThemeContext.Provider>
    </StandardErrorBoundary>
  </>
};