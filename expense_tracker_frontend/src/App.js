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

  // Dashboard layout: summary cards top, charts below, then filters and list.
  return (
    <Container>
      <div style={dashboardWrap}>
        {/* Top - Summary */}
        <section aria-label="Monthly summary" style={sectionBlock}>
          <SummaryCards />
        </section>

        {/* Charts block */}
        <section aria-label="Visualizations" style={sectionBlock}>
          <Charts />
        </section>

        {/* Filters and List */}
        <section aria-label="Expense controls and list" style={{ ...sectionBlock, marginTop: 8 }}>
          <div style={controlsRow}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Expenses</h2>
            {/* Additional quick actions could go here */}
          </div>
          <div style={{ marginTop: 12 }}>
            <ExpenseFilters />
          </div>
          <div style={{ marginTop: 12 }}>
            <ExpenseList />
          </div>
        </section>
      </div>
    </Container>
  );
}

// Local inline styles to keep within template and avoid new CSS files
const dashboardWrap = {
  display: 'grid',
  gap: 16,
};

const sectionBlock = {
  background: 'transparent',
};

const controlsRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

export default App;
