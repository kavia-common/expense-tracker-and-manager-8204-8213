import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/theme.css';
import Container from './components/Layout/Container';
import SummaryCards from './features/expenses/SummaryCards';
import ExpenseFilters from './features/expenses/ExpenseFilters';
import ExpenseList from './features/expenses/ExpenseList';
import Charts from './features/expenses/Charts';

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
    <div className="App">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
      <Container>
        <SummaryCards />
        <ExpenseFilters />
        <ExpenseList />
        <Charts />
      </Container>
    </div>
  );
}

export default App;
