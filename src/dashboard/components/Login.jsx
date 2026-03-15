import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            setError('Credenciales incorrectas o usuario no registrado.');
            setIsSubmitting(false);
        }
        // App.jsx escuchará el cambio de sesión automáticamente
    };

    const containerStyle = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        padding: '1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    };

    const cardStyle = {
        backgroundColor: 'white',
        padding: '2.5rem',
        borderRadius: '1.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.875rem',
        marginBottom: '1.25rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        fontSize: '1rem',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
        outline: 'none'
    };

    const buttonStyle = {
        width: '100%',
        padding: '1rem',
        backgroundColor: '#1e3a8a',
        color: 'white',
        border: 'none',
        borderRadius: '0.75rem',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.1s, background-color 0.2s',
        marginTop: '0.5rem'
    };

    const logoStyle = {
        fontSize: '2rem',
        fontWeight: '800',
        color: '#1e3a8a',
        marginBottom: '0.5rem',
        display: 'block'
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <span style={logoStyle}>💧 AquaGest</span>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>Gestión para Distribuidoras de Agua</p>
                
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Iniciar Sesión</h2>
                
                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem'
                    }}>
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Email</label>
                        <input
                            type="email"
                            required
                            style={inputStyle}
                            placeholder="ejemplo@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Contraseña</label>
                        <input
                            type="password"
                            required
                            style={inputStyle}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        style={{
                            ...buttonStyle,
                            opacity: isSubmitting ? 0.7 : 1,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                        onMouseOver={(e) => !isSubmitting && (e.target.style.backgroundColor = '#1e40af')}
                        onMouseOut={(e) => !isSubmitting && (e.target.style.backgroundColor = '#1e3a8a')}
                    >
                        {isSubmitting ? 'Iniciando sesión...' : 'Entrar al Sistema'}
                    </button>
                </form>

                <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    © 2026 AquaGest Soluciones. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
};

export default Login;
