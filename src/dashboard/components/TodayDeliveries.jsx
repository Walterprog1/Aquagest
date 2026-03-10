import React, { useState } from 'react';
import ResumenRepartoModal from './ResumenRepartoModal';

const TodayDeliveries = () => {
    const [selectedReparto, setSelectedReparto] = useState(null);
    const [repartos, setRepartos] = useState([]);

    React.useEffect(() => {
        const cargarRepartos = () => {
            const repartosGuardados = JSON.parse(localStorage.getItem('aquagest_repartos') || '[]');
            setRepartos(repartosGuardados.filter(r => r.fecha === new Date().toISOString().split('T')[0]));
        };

        cargarRepartos();

        // Polling simple para actualizar cuando se agreguen nuevos desde el modal sin recargar
        const interval = setInterval(cargarRepartos, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="today-sidebar">
            <h3>Repartos de Hoy</h3>

            {repartos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-gray)' }}>
                    No hay repartos programados para hoy.
                </div>
            ) : (
                repartos.map(reparto => (
                    <div
                        key={reparto.id}
                        className="reparto-card"
                        style={{ cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
                        onClick={() => setSelectedReparto(reparto)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="reparto-card-title">{reparto.id.slice(-6)}</div>
                                <div style={{ opacity: 0.9, marginBottom: '0.25rem' }}>Zona: {reparto.zonaNombre || 'Asignada'}</div>
                            </div>
                            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>Ver Info</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span>👤</span> {reparto.repartidorNombre || 'Repartidor'}
                        </div>
                    </div>
                ))
            )}

            <button style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.5)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                cursor: 'pointer',
                fontWeight: '500'
            }}>
                Ver todos los repartos &gt;
            </button>

            <ResumenRepartoModal
                isOpen={!!selectedReparto}
                onClose={() => setSelectedReparto(null)}
                reparto={selectedReparto}
            />
        </div>
    );
};

export default TodayDeliveries;
