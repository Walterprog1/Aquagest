import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const OrdersTable = ({ onOpenEditPedido }) => {
    const [activeTab, setActiveTab] = useState('Pendientes');
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [counts, setCounts] = useState({ Pendientes: 0, Entregados: 0, Anulados: 0 });

    useEffect(() => {
        cargarPedidos();
        actualizarContadores();
    }, [activeTab]);

    const actualizarContadores = async () => {
        try {
            const { data, error } = await supabase.from('pedidos').select('estado, pago_estado');
            if (error) throw error;
            
            const p = data.filter(o => 
                (o.estado?.toLowerCase() === 'pendiente') || 
                (o.pago_estado?.toLowerCase() === 'pendiente')
            ).length;
            const e = data.filter(o => o.estado?.toLowerCase() === 'entregado').length;
            const a = data.filter(o => o.estado?.toLowerCase() === 'anulado').length;
            
            setCounts({ Pendientes: p, Entregados: e, Anulados: a });
        } catch (err) {
            console.error("Error contadores:", err);
        }
    };

    const cargarPedidos = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select(`
                    *,
                    clientes (nombre, telefono, whatsapp, direccion),
                    detalles_pedido (producto, cantidad, precio_unitario)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const allOrders = data || [];

            let filtered = [];
            if (activeTab === 'Pendientes') {
                filtered = allOrders.filter(o => 
                    (o.estado?.toLowerCase() === 'pendiente') || 
                    (o.pago_estado?.toLowerCase() === 'pendiente')
                );
            } else if (activeTab === 'Entregados') {
                filtered = allOrders.filter(o => o.estado?.toLowerCase() === 'entregado');
            } else if (activeTab === 'Anulados') {
                filtered = allOrders.filter(o => o.estado?.toLowerCase() === 'anulado');
            }

            setOrders(filtered);
        } catch (error) {
            console.error("Error cargando pedidos:", error);
            alert("Error al cargar pedidos: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmarPago = async (orderId) => {
        if (!confirm('¿Confirmas que has recibido el pago de este pedido?')) return;
        
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .update({ pago_estado: 'pagado' })
                .eq('id', orderId)
                .select();

            if (error) throw error;

            cargarPedidos();
            actualizarContadores();
        } catch (error) {
            console.error("Error confirmando pago:", error);
            alert("No se pudo confirmar el pago.");
        }
    };

    const handleWhatsApp = (cliente) => {
        if (!cliente) return;
        const num = cliente.whatsapp || cliente.telefono;
        if (!num) return;
        const cleanNum = num.replace(/\D/g, '');
        const finalNum = cleanNum.startsWith('54') ? cleanNum : `549${cleanNum}`;
        window.open(`https://wa.me/${finalNum}`, '_blank');
    };

    const actionButtonStyle = {
        padding: '4px 8px',
        backgroundColor: '#f1f5f9',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '0.7rem',
        cursor: 'pointer',
        color: '#475569',
        fontWeight: '500'
    };

    return (
        <div className="orders-area">
            <div className="orders-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Pedidos</span>
                <button 
                    onClick={() => { cargarPedidos(); actualizarContadores(); }} 
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}
                    title="Refrescar datos"
                >🔄</button>
            </div>
            <div className="orders-tabs">
                <div className={`order-tab ${activeTab === 'Pendientes' ? 'active' : ''}`} onClick={() => setActiveTab('Pendientes')}>
                    Pendientes ({counts.Pendientes})
                </div>
                <div className={`order-tab ${activeTab === 'Entregados' ? 'active' : ''}`} onClick={() => setActiveTab('Entregados')}>
                    Entregados ({counts.Entregados})
                </div>
                <div className={`order-tab ${activeTab === 'Anulados' ? 'active' : ''}`} onClick={() => setActiveTab('Anulados')}>
                    Anulados ({counts.Anulados})
                </div>
            </div>
            
            <div className="table-responsive-desktop" style={{ overflowX: 'auto' }}>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Cod</th>
                            <th>Creado</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Pago</th>
                            <th>Dirección</th>
                            <th>Ref/Notas</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Cargando pedidos...</td></tr>
                        ) : orders.length > 0 ? orders.map(order => (
                            <tr key={order.id}>
                                <td style={{ fontSize: '0.7rem' }}>{order.id.split('-')[0]}</td>
                                <td style={{ fontSize: '0.75rem' }}>{new Date(order.created_at).toLocaleString()}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {order.clientes?.nombre || 'Consumidor Final'}
                                        {(order.clientes?.whatsapp || order.clientes?.telefono) && (
                                            <button 
                                                onClick={() => handleWhatsApp(order.clientes)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                                                title="WhatsApp"
                                            >💬</button>
                                        )}
                                    </div>
                                </td>
                                <td style={{ fontWeight: '600' }}>${order.total}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ 
                                            padding: '2px 8px', 
                                            borderRadius: '12px', 
                                            fontSize: '0.65rem',
                                            fontWeight: '600',
                                            backgroundColor: order.pago_estado === 'pagado' ? '#d1fae5' : (order.medio_pago === 'transferencia' ? '#eff6ff' : '#fef3c7'),
                                            color: order.pago_estado === 'pagado' ? '#065f46' : (order.medio_pago === 'transferencia' ? '#1e40af' : '#92400e')
                                        }}>
                                            {order.pago_estado === 'pagado' ? 'PAGADO' : (order.medio_pago === 'transferencia' ? 'TRANSF. PEND.' : 'PENDIENTE')}
                                        </span>
                                        {order.pago_estado !== 'pagado' && (
                                            <button 
                                                onClick={() => confirmarPago(order.id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                            >✅</button>
                                        )}
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.7rem' }}>{order.clientes?.direccion || '-'}</td>
                                <td style={{ fontSize: '0.7rem' }}>{order.notas}</td>
                                <td>
                                    <button 
                                        onClick={() => onOpenEditPedido(order)}
                                        style={actionButtonStyle}
                                    >Detalles</button>
                                </td>
                            </tr>
                        )) : <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No hay pedidos {activeTab.toLowerCase()}</td></tr>}
                    </tbody>
                </table>
            </div>

            <div className="mobile-orders-view">
                {orders.map(order => (
                    <div key={order.id} style={{
                        padding: '1rem',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', color: 'var(--primary-blue)' }}>{order.clientes?.nombre || 'C. Final'}</span>
                            <span style={{ fontWeight: '700', fontSize: '1.25rem' }}>${order.total}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666' }}>
                            <span>📍 {order.clientes?.direccion || 'Retiro local'}</span>
                            <span>{new Date(order.fecha).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                             <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {order.detalles_pedido?.map((d, i) => (
                                    <span key={i} style={{
                                        backgroundColor: '#ebf2ff',
                                        color: '#245be0',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        fontWeight: '500'
                                    }}>
                                        {d.cantidad}x {d.producto}
                                    </span>
                                ))}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ 
                                    padding: '2px 8px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.6rem',
                                    fontWeight: '700',
                                    backgroundColor: order.pago_estado === 'pagado' ? '#d1fae5' : (order.medio_pago === 'transferencia' ? '#eff6ff' : '#fef3c7'),
                                    color: order.pago_estado === 'pagado' ? '#065f46' : (order.medio_pago === 'transferencia' ? '#1e40af' : '#92400e')
                                }}>
                                    {order.pago_estado === 'pagado' ? 'PAGADO' : (order.medio_pago === 'transferencia' ? 'TRANSF. PEND.' : 'PENDIENTE')}
                                </span>
                                {order.pago_estado !== 'pagado' && (
                                    <button onClick={() => confirmarPago(order.id)} style={{ border: 'none', background: 'none' }}>✅</button>
                                )}
                            </div>
                        </div>
                        {order.notas && (
                            <div style={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic', marginTop: '4px' }}>
                                📝 {order.notas}
                            </div>
                        )}
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                            {(order.clientes?.telefono || order.clientes?.whatsapp) && (
                                <>
                                    <a href={`tel:${order.clientes.telefono}`} style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        padding: '8px',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        color: '#374151',
                                        fontSize: '0.8rem',
                                        fontWeight: '500'
                                    }}>📞</a>
                                    <button 
                                        onClick={() => handleWhatsApp(order.clientes)}
                                        style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            padding: '8px',
                                            backgroundColor: '#25d366',
                                            borderRadius: '6px',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >💬</button>
                                </>
                            )}
                            <button 
                                onClick={() => onOpenEditPedido(order)}
                                style={{
                                    flex: 2,
                                    padding: '8px',
                                    backgroundColor: 'var(--primary-blue)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '500'
                                }}
                            >Detalles</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrdersTable;
