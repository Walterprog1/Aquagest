import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const RepartosListModal = ({ isOpen, onClose, onOpenResumen }) => {
    const [repartos, setRepartos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const cargarRepartos = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('repartos')
                .select(`
                    *,
                    perfiles:repartidor_id (nombre, apellido),
                    zonas_reparto:zona_id (nombre),
                    vehiculos:vehiculo_id (marca, modelo, patente)
                `)
                .order('fecha', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            setRepartos(data || []);
        } catch (error) {
            console.error("Error al cargar historial de repartos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            cargarRepartos();
        }
    }, [isOpen]);

    const eliminarReparto = async (reparto) => {
        const confirmacion = window.confirm(`¿Estás seguro de que deseas eliminar el reparto del día ${new Date(reparto.fecha).toLocaleDateString()}? Los pedidos asociados NO se borrarán.`);
        
        if (!confirmacion) return;

        try {
            const { error } = await supabase
                .from('repartos')
                .delete()
                .eq('id', reparto.id);

            if (error) throw error;
            
            alert('Reparto eliminado correctamente.');
            cargarRepartos(); // Recargar la lista
        } catch (error) {
            console.error("Error al eliminar reparto:", error);
            alert('Error al eliminar el reparto.');
        }
    };

    const getStatusStyle = (status) => {
        const base = {
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: '600',
            textTransform: 'uppercase'
        };

        if (status === 'finalizado' || status === 'completado') {
            return { ...base, backgroundColor: '#d1fae5', color: '#065f46' };
        }
        return { ...base, backgroundColor: '#fef3c7', color: '#92400e' };
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📅 Historial de Repartos">
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando historial...</div>
                ) : repartos.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                <th style={{ padding: '12px 8px' }}>Fecha</th>
                                <th style={{ padding: '12px 8px' }}>Zona / Vehículo</th>
                                <th style={{ padding: '12px 8px' }}>Repartidor</th>
                                <th style={{ padding: '12px 8px' }}>Estado</th>
                                <th style={{ padding: '12px 8px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {repartos.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                                    <td style={{ padding: '12px 8px' }}>
                                        <div style={{ fontWeight: '600' }}>{new Date(item.fecha).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>ID: {item.id.slice(0, 8)}</div>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <div>{item.zonas_reparto?.nombre || 'N/A'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                            {item.vehiculos ? `${item.vehiculos.marca} ${item.vehiculos.modelo}` : 'Sin vehículo'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        {item.perfiles ? `${item.perfiles.nombre} ${item.perfiles.apellido}` : 'Sin asignar'}
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <span style={getStatusStyle(item.estado)}>
                                            {item.estado}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px', display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => onOpenResumen(item)}
                                            style={{
                                                padding: '6px 10px',
                                                backgroundColor: 'var(--primary-blue)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                            title="Ver Resumen"
                                        >
                                            📋
                                        </button>
                                        <button 
                                            onClick={() => eliminarReparto(item)}
                                            style={{
                                                padding: '6px 10px',
                                                backgroundColor: '#fee2e2',
                                                color: '#dc2626',
                                                border: '1px solid #fecaca',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                            title="Eliminar Reparto"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                        No se encontraron repartos registrados aún.
                    </div>
                )}
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button onClick={onClose} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cerrar</button>
            </div>
        </Modal>
    );
};

export default RepartosListModal;
