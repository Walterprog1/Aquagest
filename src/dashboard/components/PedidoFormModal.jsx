import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const PedidoFormModal = ({ isOpen, onClose, pedidoAEditar = null }) => {
    const [clientesGuardados, setClientesGuardados] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        cliente: '',
        fecha: new Date().toISOString().split('T')[0],
        envasesEntregados: 0,
        envasesRecibidos: 0,
        precioUnitario: 2500,
        medioPago: '',
        estado: 'Entregado',
        notas: ''
    });

    useEffect(() => {
        if (isOpen) {
            cargarClientes();
            if (pedidoAEditar) {
                cargarDatosPedido(pedidoAEditar);
            } else {
                setFormData({
                    cliente: '',
                    fecha: new Date().toISOString().split('T')[0],
                    envasesEntregados: 0,
                    envasesRecibidos: 0,
                    precioUnitario: 2500,
                    medioPago: '',
                    estado: 'Entregado',
                    notas: ''
                });
            }
        }
    }, [isOpen, pedidoAEditar]);

    const cargarClientes = async () => {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nombre', { ascending: true });
        
        if (!error) {
            setClientesGuardados(data || []);
        }
    };

    const cargarDatosPedido = async (pedido) => {
        // Obtenemos los detalles si no vienen incluidos
        let detalles = pedido.detalles_pedido;
        if (!detalles) {
            const { data, error } = await supabase
                .from('detalles_pedido')
                .select('*')
                .eq('pedido_id', pedido.id);
            if (!error) detalles = data;
        }

        const detalle = (detalles && detalles.length > 0) ? detalles[0] : { cantidad: 0, precio_unitario: 2500 };

        setFormData({
            cliente: pedido.cliente_id || '',
            fecha: pedido.fecha,
            envasesEntregados: detalle.cantidad,
            envasesRecibidos: 0, // No persistido en este esquema
            precioUnitario: detalle.precio_unitario,
            medioPago: pedido.medio_pago || '',
            estado: pedido.estado || 'Entregado',
            notas: pedido.notas || ''
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'cliente' && value) {
            const clienteSeleccionado = clientesGuardados.find(c => c.id === value);
            if (clienteSeleccionado && clienteSeleccionado.precio_especial) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    precioUnitario: parseFloat(clienteSeleccionado.precio_especial)
                }));
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calcularTotal = () => {
        return formData.envasesEntregados * formData.precioUnitario;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            const pedidoData = {
                cliente_id: formData.cliente || null,
                fecha: formData.fecha,
                total: calcularTotal(),
                medio_pago: formData.medioPago || null,
                estado: formData.estado,
                // Si el medio de pago es efectivo, marcamos como pagado. 
                // Si es transferencia, fiado o está vacío, marcamos como pendiente.
                pago_estado: formData.medioPago === 'efectivo' ? 'pagado' : 'pendiente',
                notas: formData.notas,
                user_id: user.id
            };

            if (pedidoAEditar) {
                // ACTUALIZAR PEDIDO
                const { error: errorUpdate } = await supabase
                    .from('pedidos')
                    .update(pedidoData)
                    .eq('id', pedidoAEditar.id);

                if (errorUpdate) throw errorUpdate;

                // ACTUALIZAR DETALLE
                const { data: detallesExistentes } = await supabase
                    .from('detalles_pedido')
                    .select('id')
                    .eq('pedido_id', pedidoAEditar.id);

                if (detallesExistentes && detallesExistentes.length > 0) {
                    const { error: errorUpdateDetalle } = await supabase
                        .from('detalles_pedido')
                        .update({
                            cantidad: formData.envasesEntregados,
                            precio_unitario: formData.precioUnitario
                        })
                        .eq('id', detallesExistentes[0].id);
                    if (errorUpdateDetalle) throw errorUpdateDetalle;
                } else {
                    await supabase.from('detalles_pedido').insert([{
                        pedido_id: pedidoAEditar.id,
                        producto: 'Bidón 20L',
                        cantidad: formData.envasesEntregados,
                        precio_unitario: formData.precioUnitario
                    }]);
                }

                alert('¡Pedido actualizado con éxito!');
            } else {
                // INSERTAR NUEVO PEDIDO
                const { data: pedido, error: errorPedido } = await supabase
                    .from('pedidos')
                    .insert([pedidoData])
                    .select()
                    .single();

                if (errorPedido) throw errorPedido;

                const { error: errorDetalle } = await supabase
                    .from('detalles_pedido')
                    .insert([{
                        pedido_id: pedido.id,
                        producto: 'Bidón 20L',
                        cantidad: formData.envasesEntregados,
                        precio_unitario: formData.precioUnitario
                    }]);

                if (errorDetalle) throw errorDetalle;

                const message = formData.estado === 'Entregado' 
                    ? (formData.medioPago === 'transferencia' ? '¡Venta registrada! El sistema buscará el pago automáticamente.' : '¡Venta registrada con éxito!')
                    : '¡Pedido tomado con éxito! Quedará pendiente de entrega.';
                
                alert(message);
            }
            
            onClose();

        } catch (error) {
            console.error("Error al procesar pedido:", error);
            alert("No se pudo procesar la venta: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleEstado = (nuevoEstado) => {
        setFormData(prev => ({ ...prev, estado: nuevoEstado }));
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        marginBottom: '1rem',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        fontFamily: 'inherit',
        backgroundColor: 'white'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
        fontSize: '0.875rem'
    };

    const pillButtonStyle = (isActive, activeColor) => ({
        flex: 1,
        padding: '0.75rem',
        border: '1px solid ' + (isActive ? activeColor : '#e2e8f0'),
        backgroundColor: isActive ? activeColor : 'white',
        color: isActive ? 'white' : '#64748b',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.85rem',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    });

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={pedidoAEditar ? "📝 Editar Pedido / Venta" : "🛒 Registrar Nuevo Registro"}
        >
            <form onSubmit={handleSubmit}>
                {/* Selector de Estado de Entrega */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Estado de la Entrega</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            type="button" 
                            onClick={() => toggleEstado('Entregado')}
                            style={pillButtonStyle(formData.estado === 'Entregado', '#10b981')}
                        >
                            ✅ Ya Entregado (Venta)
                        </button>
                        <button 
                            type="button" 
                            onClick={() => toggleEstado('Pendiente')}
                            style={pillButtonStyle(formData.estado === 'Pendiente', '#3b82f6')}
                        >
                            🚚 Pendiente (Pedido)
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 2 }}>
                        <label style={labelStyle}>Cliente *</label>
                        <select required style={inputStyle} name="cliente" value={formData.cliente} onChange={handleChange}>
                            <option value="">Buscar o seleccionar cliente...</option>
                            {clientesGuardados.map(cliente => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.nombre} {cliente.tipo === 'comercial' ? '(Comercial)' : ''}
                                </option>
                            ))}
                            {clientesGuardados.length === 0 && (
                                <option value="" disabled>No hay clientes guardados aún</option>
                            )}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Fecha *</label>
                        <input required style={inputStyle} type="date" name="fecha" value={formData.fecha} onChange={handleChange} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>💧 Envases Entregados</label>
                        <input required style={inputStyle} type="number" min="0" name="envasesEntregados" value={formData.envasesEntregados} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>🔄 Envases Recibidos</label>
                        <input required style={inputStyle} type="number" min="0" name="envasesRecibidos" value={formData.envasesRecibidos} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>💲 Precio Unitario</label>
                        <input required style={inputStyle} type="number" min="0" step="100" name="precioUnitario" value={formData.precioUnitario} onChange={handleChange} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                        <label style={labelStyle}>Medio de Pago</label>
                        <select style={{ ...inputStyle, marginBottom: 0 }} name="medioPago" value={formData.medioPago} onChange={handleChange}>
                            <option value="">Seleccionar después...</option>
                            <option value="efectivo">Efectivo 💵</option>
                            <option value="transferencia">Transferencia 📱</option>
                            <option value="fiado">Pendiente de Pago / Fiado 📉</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right', paddingRight: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>Total:</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                            ${calcularTotal()}
                        </div>
                    </div>
                </div>

                {formData.medioPago === 'transferencia' && (
                    <div style={{ 
                        marginTop: '1.5rem', 
                        padding: '1rem', 
                        backgroundColor: '#eff6ff', 
                        border: '1px solid #dbeafe', 
                        borderRadius: 'var(--border-radius-md)',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontWeight: '600', color: '#1e40af', marginBottom: '0.25rem' }}>Datos para Transferencia</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1d4ed8', letterSpacing: '0.5px' }}>ALIAS: surgentesnogoli</p>
                        <p style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '0.25rem' }}>El sistema marcará pagado automáticamente al recibir la notificación.</p>
                    </div>
                )}

                <div style={{ marginTop: '1rem' }}>
                    <label style={labelStyle}>Notas adicionales</label>
                    <textarea style={{ ...inputStyle, resize: 'none' }} rows="2" name="notas" value={formData.notas} onChange={handleChange} placeholder="Notas..."></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={onClose} style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}>Cancelar</button>

                    <button type="submit" disabled={isSubmitting} style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: 'var(--primary-blue)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        opacity: isSubmitting ? 0.7 : 1
                    }}>
                        {isSubmitting ? 'Procesando...' : (pedidoAEditar ? 'Guardar Cambios' : (formData.estado === 'Entregado' ? 'Registrar Venta' : 'Tomar Pedido'))}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PedidoFormModal;
