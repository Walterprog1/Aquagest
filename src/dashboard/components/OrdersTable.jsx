import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const OrdersTable = () => {
    const [activeTab, setActiveTab] = useState('Pendientes');
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        cargarPedidos();
    }, [activeTab]);

    const cargarPedidos = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select(`
                    *,
                    clientes (
                        nombre,
                        telefono,
                        direccion
                    ),
                    detalles_pedido (
                        producto,
                        cantidad
                    )
                `)
                .eq('estado', activeTab === 'Pendientes' ? 'Pendiente' : (activeTab === 'Entregados' ? 'Entregado' : 'Anulado'))
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } finally {
            setIsLoading(false);
        }
    };

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

    return (
        <div className="orders-area">
            <div className="orders-header">Pedidos</div>
            <div className="orders-tabs">
                <div className={`order-tab ${activeTab === 'Entregados' ? 'active' : ''}`} onClick={() => setActiveTab('Entregados')}>Entregados</div>
                <div className={`order-tab ${activeTab === 'Pendientes' ? 'active' : ''}`} onClick={() => setActiveTab('Pendientes')}>Pendientes</div>
                <div className={`order-tab ${activeTab === 'Anulados' ? 'active' : ''}`} onClick={() => setActiveTab('Anulados')}>Anulados</div>
            </div>
            
            {/* Desktop Table View */}
            <div className="table-responsive-desktop" style={{ overflowX: 'auto' }}>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Cod</th>
                            <th>Actualizado</th>
                            <th>Creado</th>
                            <th>Origen</th>
                            <th>Responsable</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Pago</th>
                            <th>Teléfono</th>
                            <th>Dirección</th>
                            <th>Ref/Notas</th>
                            <th>Productos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="12" style={{ textAlign: 'center', padding: '2rem' }}>Cargando pedidos...</td></tr>
                        ) : orders.length > 0 ? orders.map(order => (
                            <tr key={order.id}>
                                <td style={{ fontSize: '0.7rem' }}>{order.id.split('-')[0]}</td>
                                <td style={{ fontSize: '0.75rem' }}>{new Date(order.created_at).toLocaleString()}</td>
                                <td style={{ fontSize: '0.75rem' }}>{new Date(order.fecha).toLocaleDateString()}</td>
                                <td><span style={{ backgroundColor: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Mostrador</span></td>
                                <td style={{ fontSize: '0.75rem' }}>Administrador</td>
                                <td>{order.clientes?.nombre || 'Consumidor Final'}</td>
                                <td style={{ fontWeight: '600' }}>${order.total}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ 
                                            padding: '2px 8px', 
                                            borderRadius: '12px', 
                                            fontSize: '0.65rem',
                                            fontWeight: '600',
                                            backgroundColor: order.pago_estado === 'pagado' ? '#d1fae5' : (order.medio_pago === 'naranja_x' ? '#fee2e2' : '#fef3c7'),
                                            color: order.pago_estado === 'pagado' ? '#065f46' : (order.medio_pago === 'naranja_x' ? '#991b1b' : '#92400e')
                                        }}>
                                            {order.pago_estado === 'pagado' ? 'PAGADO' : (order.medio_pago === 'naranja_x' ? 'DIGITAL' : 'PENDIENTE')}
                                        </span>
                                        {order.pago_estado !== 'pagado' && (
                                            <button 
                                                onClick={() => confirmarPago(order.id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: '0 4px' }}
                                                title="Marcar como pagado"
                                            >
                                                ✅
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td>{order.clientes?.telefono || '-'}</td>
                                <td style={{ fontSize: '0.7rem', maxWidth: '150px' }}>{order.clientes?.direccion || '-'}</td>
                                <td style={{ fontSize: '0.7rem' }}>{order.notas}</td>
                                <td>
                                    {order.detalles_pedido?.map((d, i) => (
                                        <div key={i} style={{ fontSize: '0.7rem' }}>{d.cantidad}x {d.producto}</div>
                                    ))}
                                </td>
                            </tr>
                        )) : <tr><td colSpan="12" style={{ textAlign: 'center', padding: '2rem' }}>No hay pedidos {activeTab.toLowerCase()}</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View (Visible via CSS) */}
            <div className="mobile-orders-view" style={{ display: 'none' }}>
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
                            <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '0.6rem',
                                fontWeight: '700',
                                backgroundColor: order.pago_estado === 'pagado' ? '#d1fae5' : (order.medio_pago === 'naranja_x' ? '#fee2e2' : '#fef3c7'),
                                color: order.pago_estado === 'pagado' ? '#065f46' : (order.medio_pago === 'naranja_x' ? '#991b1b' : '#92400e')
                            }}>
                                {order.pago_estado === 'pagado' ? 'PAGADO' : (order.medio_pago === 'naranja_x' ? 'DIGITAL' : 'PENDIENTE')}
                            </span>
                        </div>
                        {order.notas && (
                            <div style={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic', marginTop: '4px' }}>
                                📝 {order.notas}
                            </div>
                        )}
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                            {order.clientes?.telefono && (
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
                                }}>📞 Llamar</a>
                            )}
                            <button style={{
                                flex: 2,
                                padding: '8px',
                                backgroundColor: 'var(--primary-blue)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                            }}>Ver Detalles</button>
                        </div>
                    </div>
                ))}
                {orders.length === 0 && !isLoading && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                        No hay pedidos {activeTab.toLowerCase()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersTable;
