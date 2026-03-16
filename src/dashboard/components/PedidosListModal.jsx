import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const PedidosListModal = ({ isOpen, onClose }) => {
    const [pedidos, setPedidos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filtroActivo, setFiltroActivo] = useState('Todos'); // 'Todos', 'Cobro Pendiente', 'Entrega Pendiente', 'Pagados'

    const cargarPedidos = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select(`
                    *,
                    clientes (nombre, direccion, localidad, telefono),
                    detalles_pedido (producto, cantidad)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPedidos(data || []);
        } catch (error) {
            console.error("Error al cargar pedidos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            cargarPedidos();
        }
    }, [isOpen]);

    const confirmarPago = async (orderId) => {
        if (!confirm('¿Confirmas que has recibido el pago de este pedido?')) return;
        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ pago_estado: 'pagado' })
                .eq('id', orderId);

            if (error) throw error;
            cargarPedidos();
        } catch (error) {
            console.error("Error confirmando pago:", error);
            alert("No se pudo confirmar el pago.");
        }
    };

    const confirmarEntrega = async (orderId) => {
        if (!confirm('¿Confirmas que el pedido ha sido entregado?')) return;
        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ estado: 'Entregado' })
                .eq('id', orderId);

            if (error) throw error;
            cargarPedidos();
        } catch (error) {
            console.error("Error confirmando entrega:", error);
            alert("No se pudo confirmar la entrega.");
        }
    };

    const eliminarPedido = async (orderId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este pedido por completo? Esta acción no se puede deshacer.')) return;
        try {
            const { error } = await supabase
                .from('pedidos')
                .delete()
                .eq('id', orderId);

            if (error) throw error;
            cargarPedidos();
        } catch (error) {
            console.error("Error eliminando pedido:", error);
            alert("No se pudo eliminar el pedido.");
        }
    };

    // Lógica de filtrado en memoria
    const stats = {
        total: pedidos.length,
        pagados: pedidos.filter(o => o.pago_estado?.toLowerCase() === 'pagado').length,
        pendientesCobro: pedidos.filter(o => o.pago_estado?.toLowerCase() === 'pendiente').length,
        pendientesEntrega: pedidos.filter(o => o.estado?.toLowerCase() === 'pendiente').length
    };

    const pedidosFiltrados = pedidos.filter(o => {
        if (filtroActivo === 'Cobro Pendiente') return o.pago_estado?.toLowerCase() === 'pendiente';
        if (filtroActivo === 'Entrega Pendiente') return o.estado?.toLowerCase() === 'pendiente';
        if (filtroActivo === 'Pagados') return o.pago_estado?.toLowerCase() === 'pagado';
        return true;
    });

    const badgeStyle = (type, value) => ({
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '600',
        cursor: 'pointer',
        backgroundColor: filtroActivo === type ? 'var(--primary-blue)' : '#f3f4f6',
        color: filtroActivo === type ? 'white' : '#4b5563',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📊 Gestión Integral de Pedidos">
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => setFiltroActivo('Todos')} style={badgeStyle('Todos')}>
                    📑 Todos ({stats.total})
                </button>
                <button onClick={() => setFiltroActivo('Entrega Pendiente')} style={badgeStyle('Entrega Pendiente')}>
                    🚚 Por Entregar ({stats.pendientesEntrega})
                </button>
                <button onClick={() => setFiltroActivo('Cobro Pendiente')} style={badgeStyle('Cobro Pendiente')}>
                    💰 Por Cobrar ({stats.pendientesCobro})
                </button>
                <button onClick={() => setFiltroActivo('Pagados')} style={badgeStyle('Pagados')}>
                    ✅ Pagados ({stats.pagados})
                </button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando información...</div>
                ) : pedidosFiltrados.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '10px' }}>Cliente / Fecha</th>
                                <th style={{ padding: '10px' }}>Productos</th>
                                <th style={{ padding: '10px' }}>Total</th>
                                <th style={{ padding: '10px' }}>Estados</th>
                                <th style={{ padding: '10px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedidosFiltrados.map(o => (
                                <tr key={o.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                    <td style={{ padding: '10px' }}>
                                        <div style={{ fontWeight: '600' }}>{o.clientes?.nombre || 'C. Final'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(o.created_at).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>📍 {o.clientes?.direccion}</div>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        {o.detalles_pedido?.map((d, i) => (
                                            <div key={i} style={{ fontSize: '0.75rem' }}>{d.cantidad}x {d.producto}</div>
                                        ))}
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: '700' }}>${o.total}</td>
                                    <td style={{ padding: '10px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ 
                                                fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', textAlign: 'center',
                                                backgroundColor: o.estado?.toLowerCase() === 'pendiente' ? '#fef3c7' : '#d1fae5',
                                                color: o.estado?.toLowerCase() === 'pendiente' ? '#92400e' : '#065f46'
                                            }}>{o.estado?.toUpperCase()}</span>
                                            <span style={{ 
                                                fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', textAlign: 'center',
                                                backgroundColor: o.pago_estado?.toLowerCase() === 'pendiente' ? '#fee2e2' : '#d1fae5',
                                                color: o.pago_estado?.toLowerCase() === 'pendiente' ? '#b91c1c' : '#065f46'
                                            }}>PAGO: {o.pago_estado?.toUpperCase()}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {o.estado?.toLowerCase() === 'pendiente' && (
                                                <button onClick={() => confirmarEntrega(o.id)} style={{ padding: '4px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Entregado 🚚</button>
                                            )}
                                            {o.pago_estado?.toLowerCase() === 'pendiente' && (
                                                <button onClick={() => confirmarPago(o.id)} style={{ padding: '4px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Cobrado 💰</button>
                                            )}
                                        </div>
                                        <div style={{ marginTop: 'auto', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => eliminarPedido(o.id)} 
                                                style={{ 
                                                    background: 'none', 
                                                    border: 'none', 
                                                    color: '#9ca3af', 
                                                    cursor: 'pointer', 
                                                    fontSize: '0.9rem',
                                                    padding: '2px',
                                                    transition: 'color 0.2s'
                                                }}
                                                onMouseOver={(e) => e.target.style.color = '#ef4444'}
                                                onMouseOut={(e) => e.target.style.color = '#9ca3af'}
                                                title="Eliminar pedido permanentemente"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                        No se encontraron pedidos con este filtro.
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button onClick={onClose} style={{ padding: '0.6rem 2rem', backgroundColor: 'var(--secondary-blue)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cerrar</button>
            </div>
        </Modal>
    );
};

export default PedidosListModal;
