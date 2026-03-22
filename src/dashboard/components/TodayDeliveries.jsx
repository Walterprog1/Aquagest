import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const TodayDeliveries = ({ onOpenHistory, onOpenResumen }) => {
    const [repartos, setRepartos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const cargarRepartos = async () => {
        setIsLoading(true);
        try {
            const hoy = new Date().toISOString().split('T')[0];
            
            const { data, error } = await supabase
                .from('repartos')
                .select(`
                    *,
                    perfiles:repartidor_id (nombre, apellido),
                    zonas_reparto:zona_id (nombre),
                    vehiculos:vehiculo_id (marca, modelo, patente)
                `)
                .eq('fecha', hoy)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const mapped = (data || []).map(r => ({
                ...r,
                repartidorNombre: r.perfiles ? `${r.perfiles.nombre} ${r.perfiles.apellido}` : 'Sin asignar',
                zonaNombre: r.zonas_reparto ? r.zonas_reparto.nombre : 'Sin zona'
            }));

            setRepartos(mapped);
        } catch (error) {
            console.error("Error cargando repartos de hoy:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        cargarRepartos();
        const interval = setInterval(cargarRepartos, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="today-sidebar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Repartos de Hoy</h3>
                <button 
                    onClick={cargarRepartos} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                    title="Actualizar"
                >🔄</button>
            </div>

            {isLoading && repartos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>Cargando...</div>
            ) : repartos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-gray)' }}>
                    No hay repartos programados para hoy.
                </div>
            ) : (
                repartos.map(reparto => (
                    <div
                        key={reparto.id}
                        className="reparto-card"
                        style={{ cursor: 'pointer', transition: 'transform 0.2s', marginBottom: '0.75rem' }}
                        onClick={() => onOpenResumen(reparto)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="reparto-card-title">{reparto.id.slice(0, 8).toUpperCase()}</div>
                                <div style={{ opacity: 0.9, marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                    Zona: {reparto.zonaNombre}
                                </div>
                            </div>
                            <span style={{ 
                                fontSize: '0.7rem', 
                                backgroundColor: reparto.estado === 'pendiente' ? 'rgba(255,255,255,0.2)' : '#d1fae5', 
                                color: reparto.estado === 'pendiente' ? 'white' : '#065f46',
                                padding: '2px 6px', 
                                borderRadius: '4px' 
                            }}>
                                {reparto.estado.toUpperCase()}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                            <span>👤</span> {reparto.repartidorNombre}
                        </div>
                        {reparto.vehiculos && (
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                🚐 {reparto.vehiculos.marca} {reparto.vehiculos.modelo} ({reparto.vehiculos.patente})
                            </div>
                        )}
                    </div>
                ))
            )}

            <button 
                onClick={onOpenHistory}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    color: 'var(--primary-blue)',
                    borderRadius: 'var(--border-radius-md)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginTop: '1rem',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                    e.target.style.backgroundColor = 'var(--primary-blue)';
                    e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = 'var(--primary-blue)';
                }}
            >
                Ver todos los repartos &gt;
            </button>
        </div>
    );
};

export default TodayDeliveries;
