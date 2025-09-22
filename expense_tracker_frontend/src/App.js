import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/theme.css';
import Container from './components/Layout/Container';
import SummaryCards from './features/expenses/SummaryCards';
import ExpenseFilters from './features/expenses/ExpenseFilters';
import ExpenseList from './features/expenses/ExpenseList';
import Charts from './features/expenses/Charts';
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <AuthProvider>
      <div className="App">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <AppBody />
      </div>
    </AuthProvider>
  );
}

// Render either auth pages or the dashboard based on session.
function AppBody() {
  const { user } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <SignupPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <Container>
      <SummaryCards />
      <ExpenseFilters />
      <ExpenseList />
      <Charts />
    </Container>
  );
}

export default App;
