import React, { useState, useEffect } from 'react'
import Dashboard from './dashboard/Dashboard'
import Login from './dashboard/components/Login'
import { supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener sesión inicial
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch(err => {
        console.error("Error al obtener sesión:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    // 2. Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <p style={{ color: '#1e3a8a', fontWeight: '600' }}>Cargando AquaGest...</p>
      </div>
    );
  }

  return (
    <>
      {session ? (
        <Dashboard user={session.user} onLogout={handleLogout} />
      ) : (
        <Login />
      )}
    </>
  )
}

export default App
