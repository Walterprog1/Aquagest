import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const ResumenRepartoModal = ({ isOpen, onClose, reparto }) => {
    const [stats, setStats] = useState({
        bidonesVendidos: 0,
        pagosRecibidos: 0,
        deudasGeneradas: 0,
        bidonesPrestados: 0
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const calcularEstadisticas = async () => {
            if (!isOpen || !reparto) return;
            setIsLoading(true);
            try {
                // 1. Obtener todos los pedidos asociados a este reparto
                const { data: pedidos, error: errPedidos } = await supabase
                    .from('pedidos')
                    .select('id, total, pago_estado, estado')
                    .eq('reparto_id', reparto.id);

                if (errPedidos) throw errPedidos;

                if (!pedidos || pedidos.length === 0) {
                    setStats({ bidonesVendidos: 0, pagosRecibidos: 0, deudasGeneradas: 0, bidonesPrestados: 0 });
                    return;
                }

                const pedidoIds = pedidos.map(p => p.id);

                // 2. Obtener detalles para contar bidones
                const { data: detalles, error: errDetalles } = await supabase
                    .from('detalles_pedido')
                    .select('producto, cantidad')
                    .in('pedido_id', pedidoIds);

                if (errDetalles) throw errDetalles;

                // 3. Cálculos
                let bidones = 0;
                detalles.forEach(d => {
                    // Contamos como bidón si el nombre contiene "Bidón" o "Bidon" (case insensitive)
                    if (/bid[óo]n/i.test(d.producto)) {
                        bidones += d.cantidad;
                    }
                });

                const pagos = pedidos
                    .filter(p => p.pago_estado === 'pagado')
                    .reduce((sum, p) => sum + Number(p.total), 0);

                const deudas = pedidos
                    .filter(p => p.pago_estado === 'pendiente')
                    .reduce((sum, p) => sum + Number(p.total), 0);

                setStats({
                    bidonesVendidos: bidones,
                    pagosRecibidos: pagos,
                    deudasGeneradas: deudas,
                    bidonesPrestados: 0 // TODO: Implementar lógica de préstamos si se añade al esquema
                });

            } catch (error) {
                console.error("Error calculando estadísticas del reparto:", error);
            } finally {
                setIsLoading(false);
            }
        };

        calcularEstadisticas();
    }, [isOpen, reparto]);

    if (!reparto) return null;

    const cardStyle = {
        backgroundColor: '#f8fafc',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        padding: '1rem',
        textAlign: 'center',
        flex: 1,
        minWidth: '140px'
    };

    const numberStyle = {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: 'var(--primary-blue)',
        margin: '0.5rem 0'
    };

    const labelStyle = {
        fontSize: '0.75rem',
        color: 'var(--text-gray)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`📋 Resumen del Reparto: ${reparto.id.slice(0, 8).toUpperCase()}`}>

            <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                <p><strong>Repartidor:</strong> {reparto.repartidorNombre || (reparto.perfiles ? `${reparto.perfiles.nombre} ${reparto.perfiles.apellido}` : 'Sin asignar')}</p>
                <p><strong>Zona:</strong> {reparto.zonaNombre || (reparto.zonas_reparto ? reparto.zonas_reparto.nombre : 'Sin zona')}</p>
                <p><strong>Fecha:</strong> {reparto.fecha.split('-').reverse().join('/')}</p>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>
                    Calculando estadísticas...
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div style={cardStyle}>
                            <div style={{ fontSize: '1.5rem' }}>💧</div>
                            <div style={numberStyle}>{stats.bidonesVendidos}</div>
                            <div style={labelStyle}>Bidones Vendidos</div>
                        </div>

                        <div style={cardStyle}>
                            <div style={{ fontSize: '1.5rem' }}>💵</div>
                            <div style={numberStyle}>${stats.pagosRecibidos}</div>
                            <div style={labelStyle}>Pagos Recibidos</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={cardStyle}>
                            <div style={{ fontSize: '1.5rem' }}>📉</div>
                            <div style={numberStyle}>${stats.deudasGeneradas}</div>
                            <div style={labelStyle}>Deudas (Fiado)</div>
                        </div>

                        <div style={cardStyle}>
                            <div style={{ fontSize: '1.5rem' }}>🔄</div>
                            <div style={numberStyle}>{stats.bidonesPrestados}</div>
                            <div style={labelStyle}>Bidones Prestados</div>
                        </div>
                    </div>
                </>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--primary-blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    cursor: 'pointer',
                    fontWeight: '500'
                }}>
                    Cerrar Resumen
                </button>
            </div>
        </Modal>
    );
};

export default ResumenRepartoModal;
