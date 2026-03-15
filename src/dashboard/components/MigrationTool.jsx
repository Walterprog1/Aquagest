import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const MigrationTool = ({ user }) => {
    const [hasData, setHasData] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [stats, setStats] = useState({ clientes: 0, vehiculos: 0, zonas: 0 });

    useEffect(() => {
        const clientesStr = localStorage.getItem('aquagest_clientes');
        const vehiculosStr = localStorage.getItem('aquagest_vehiculos');
        const zonasStr = localStorage.getItem('aquagest_zonas');

        const clientes = JSON.parse(clientesStr || '[]');
        const vehiculos = JSON.parse(vehiculosStr || '[]');
        const zonas = JSON.parse(zonasStr || '[]');

        if (clientes.length > 0 || vehiculos.length > 0 || zonas.length > 0) {
            setHasData(true);
            setStats({
                clientes: clientes.length,
                vehiculos: vehiculos.length,
                zonas: zonas.length
            });
        }
    }, []);

    const handleMigrate = async () => {
        if (!window.confirm('¿Deseas subir tus datos locales a la nube ahora? Los datos aparecerán en todos tus dispositivos.')) return;
        
        setIsMigrating(true);
        try {
            // 1. Clientes
            const clientes = JSON.parse(localStorage.getItem('aquagest_clientes') || '[]');
            if (clientes.length > 0) {
                const clientesToInsert = clientes.map(c => ({
                    nombre: c.nombre,
                    direccion: c.direccion,
                    localidad: c.localidad,
                    telefono: c.telefono,
                    whatsapp: c.whatsapp,
                    tipo: c.tipo,
                    email: c.email,
                    precio_especial: parseFloat(c.precioEspecialBidon20L) || 0,
                    notas: c.notas,
                    lat: c.lat ? parseFloat(c.lat) : null,
                    lng: c.lng ? parseFloat(c.lng) : null,
                    user_id: user.id
                }));
                const { error } = await supabase.from('clientes').insert(clientesToInsert);
                if (error) throw error;
            }

            // 2. Vehículos
            const vehiculos = JSON.parse(localStorage.getItem('aquagest_vehiculos') || '[]');
            if (vehiculos.length > 0) {
                const vehiculosToInsert = vehiculos.map(v => ({
                    marca: v.marca,
                    modelo: v.modelo,
                    patente: v.patente,
                    capacidad: parseInt(v.capacidadCarga) || 0,
                    estado: v.estado,
                    user_id: user.id
                }));
                const { error } = await supabase.from('vehiculos').insert(vehiculosToInsert);
                if (error) throw error;
            }

            // 3. Zonas
            const zonas = JSON.parse(localStorage.getItem('aquagest_zonas') || '[]');
            if (zonas.length > 0) {
                const zonasToInsert = zonas.map(z => ({
                    nombre: z.nombre,
                    descripcion: z.descripcion + (z.codigoPostal ? ` (CP: ${z.codigoPostal})` : '') + 
                               (z.diasVisita?.length > 0 ? ` [Días: ${z.diasVisita.join(', ')}]` : ''),
                    user_id: user.id
                }));
                const { error } = await supabase.from('zonas_reparto').insert(zonasToInsert);
                if (error) throw error;
            }

            // Limpiar localStorage (Backup por si acaso con prefijo distinto o simplemente borrar)
            localStorage.removeItem('aquagest_clientes');
            localStorage.removeItem('aquagest_vehiculos');
            localStorage.removeItem('aquagest_zonas');

            alert('¡Migración exitosa! Tus datos ya están en la nube.');
            window.location.reload(); // Recargar para ver los cambios
        } catch (error) {
            console.error("Error en migración:", error);
            alert("Ocurrió un error al migrar: " + error.message);
        } finally {
            setIsMigrating(false);
        }
    };

    if (!hasData) return null;

    return (
        <div style={{
            backgroundColor: '#fff7ed',
            border: '1px solid #ffedd5',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🚚</span>
                <div>
                    <h4 style={{ margin: 0, color: '#9a3412', fontSize: '1rem' }}>¡Hemos detectado datos locales!</h4>
                    <p style={{ margin: '4px 0 0', color: '#c2410c', fontSize: '0.875rem' }}>
                        Tienes {stats.clientes} clientes, {stats.vehiculos} vehículos y {stats.zonas} zonas guardadas en este navegador. 
                        Súbelos a la nube para no perderlos y verlos en el celular.
                    </p>
                </div>
            </div>
            <button 
                onClick={handleMigrate}
                disabled={isMigrating}
                style={{
                    backgroundColor: '#f97316',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: isMigrating ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                }}
            >
                {isMigrating ? 'Subiendo...' : '🚀 Subir a la Nube'}
            </button>
        </div>
    );
};

export default MigrationTool;
