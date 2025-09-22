import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../styles/theme.css';

/**
 * Main layout container combining Sidebar, Topbar and content slot
 */
// PUBLIC_INTERFACE
export default function Container({ children }) {
  /** Provides the dashboard two-column layout. */
  return (
    <div className="et-layout">
      <Sidebar />
      <main className="et-main">
        <Topbar />
        <section className="et-content">
          {children}
        </section>
      </main>
    </div>
  );
}
