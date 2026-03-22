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
            envasesRecibidos: 0,
            precioUnitario: detalle.precio_unitario,
            medioPago: pedido.medio_pago || '',
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

            // Lógica automática según instrucción del usuario:
            // 1. Sin medio de pago -> Pendiente Entrega / Pago Pendiente
            // 2. Efectivo o Transferencia -> Entregado / Pagado
            // 3. Fiado -> Entregado / Pago Pendiente
            
            let derivedEstado = 'Entregado';
            let derivedPagoEstado = 'pendiente';

            if (!formData.medioPago) {
                derivedEstado = 'Pendiente';
                derivedPagoEstado = 'pendiente';
            } else if (formData.medioPago === 'efectivo' || formData.medioPago === 'transferencia') {
                derivedEstado = 'Entregado';
                derivedPagoEstado = 'pagado';
            } else if (formData.medioPago === 'fiado') {
                derivedEstado = 'Entregado';
                derivedPagoEstado = 'pendiente';
            }

            const pedidoData = {
                cliente_id: formData.cliente || null,
                fecha: formData.fecha,
                total: calcularTotal(),
                medio_pago: formData.medioPago || null,
                estado: derivedEstado,
                pago_estado: derivedPagoEstado,
                notas: formData.notas,
                user_id: user.id
            };

            if (pedidoAEditar) {
                // ACTUALIZAR PEDIDO (Mantenemos el estado actual si no queremos forzar la lógica automática en ediciones?)
                // Por ahora, aplicamos la misma lógica para consistencia si el usuario edita el medio de pago.
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

                alert('¡Operación registrada con éxito!');
            }
            
            onClose();

        } catch (error) {
            console.error("Error al procesar pedido:", error);
            alert("No se pudo procesar el registro: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
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

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={pedidoAEditar ? "📝 Detalles del Registro" : "🛒 Nuevo Registro"}
        >
            <form onSubmit={handleSubmit}>
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
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Fecha *</label>
                        <input required style={inputStyle} type="date" name="fecha" value={formData.fecha} onChange={handleChange} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>💧 Envases</label>
                        <input required style={inputStyle} type="number" min="0" name="envasesEntregados" value={formData.envasesEntregados} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>🔁 Recibidos</label>
                        <input required style={inputStyle} type="number" min="0" name="envasesRecibidos" value={formData.envasesRecibidos} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>💲 Precio Un.</label>
                        <input required style={inputStyle} type="number" min="0" step="100" name="precioUnitario" value={formData.precioUnitario} onChange={handleChange} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                        <label style={labelStyle}>Método de Pago</label>
                        <select style={{ ...inputStyle, marginBottom: 0 }} name="medioPago" value={formData.medioPago} onChange={handleChange}>
                            <option value="">(Registrar como pedido pendiente)</option>
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

                <div style={{ marginTop: '1.5rem' }}>
                    <label style={labelStyle}>Notas adicionales</label>
                    <textarea style={{ ...inputStyle, resize: 'none' }} rows="2" name="notas" value={formData.notas} onChange={handleChange} placeholder="Opcional..."></textarea>
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
                        {isSubmitting ? 'Procesando...' : (pedidoAEditar ? 'Guardar Cambios' : 'Confirmar Registro')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PedidoFormModal;
