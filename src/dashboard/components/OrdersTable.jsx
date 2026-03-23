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
            // 1. Obtener datos del pedido antes de actualizar (para el registro de caja)
            const { data: pDatos, error: errFetch } = await supabase
                .from('pedidos')
                .select(`
                    total, fecha, medio_pago, cliente_id, 
                    clientes(nombre),
                    repartos(
                        perfiles:repartidor_id(nombre, apellido)
                    )
                `)
                .eq('id', orderId)
                .single();
            
            if (errFetch) throw errFetch;

            // 2. Marcar como pagado
            const { error: errUpdate } = await supabase
                .from('pedidos')
                .update({ pago_estado: 'pagado' })
                .eq('id', orderId);

            if (errUpdate) throw errUpdate;

            // 3. Registrar automáticamente en caja
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const repartidor = pDatos.repartos?.perfiles;
                const categoriaNombre = repartidor 
                    ? `Reparto de ${repartidor.nombre} ${repartidor.apellido}` 
                    : 'Venta Reparto';

                const { error: errOp } = await supabase.from('operaciones').insert([{
                    user_id: user.id,
                    fecha: pDatos.fecha || new Date().toISOString().split('T')[0],
                    tipo: 'ingreso',
                    categoria: categoriaNombre,
                    monto: pDatos.total,
                    metodo_pago: pDatos.medio_pago || 'efectivo',
                    concepto: `Cobro Pedido #${orderId.split('-')[0]} - ${pDatos.clientes?.nombre || 'S/N'}`
                }]);
                if (errOp) console.error("[Caja] Error al registrar ingreso automático (Table):", errOp);
            }

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
                            <span>{order.fecha ? order.fecha.split('-').reverse().join('/') : '-'}</span>
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
                                        flex: 0.5,
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
                                            flex: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '8px',
                                            backgroundColor: '#25d366',
                                            borderRadius: '6px',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                        </svg>
                                        {order.clientes?.whatsapp || order.clientes?.telefono}
                                    </button>
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
