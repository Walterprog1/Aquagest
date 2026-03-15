import React from 'react';

const Header = ({ user, onLogout }) => {
  return (
    <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="header-brand">
        Empresa Prueba
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="header-user">
          <div className="user-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <span>{user?.nombre || 'Admin'}</span>
        </div>
        <button 
          onClick={onLogout}
          style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
          title="Cerrar Sesión"
        >
          🚪 Salir
        </button>
      </div>
    </header>
  );
};

export default Header;
