import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-brand">
        Empresa Prueba
      </div>
      <div className="header-user">
        <div className="user-avatar">
          {/* Avatar Placeholder */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <span>Admin</span>
      </div>
    </header>
  );
};

export default Header;
