import React, { useState, useEffect } from 'react'
import Dashboard from './dashboard/Dashboard'
import Login from './dashboard/components/Login'

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Sembrado de usuario inicial si no hay ninguno
    const usuariosExistentes = JSON.parse(localStorage.getItem('aquagest_usuarios') || '[]');
    if (usuariosExistentes.length === 0) {
      const adminInicial = {
        id: 'admin-1',
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: 'admin@aquagest.com',
        password: 'admin123',
        rol: 'administrador',
        estado: 'activo',
        fechaRegistro: new Date().toISOString()
      };
      localStorage.setItem('aquagest_usuarios', JSON.stringify([adminInicial]));
    }

    // 2. Verificar si hay sesión guardada en localStorage
    const savedUser = localStorage.getItem('aquagest_user_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('aquagest_user_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('aquagest_user_session');
  };

  if (loading) return null; // O un spinner

  return (
    <>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  )
}

export default App
