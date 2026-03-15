import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const PedidoFormModal = ({ isOpen, onClose }) => {
    const [clientesGuardados, setClientesGuardados] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            cargarClientes();
        }
    }, [isOpen]);

    const cargarClientes = async () => {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nombre', { ascending: true });
        
        if (!error) {
            setClientesGuardados(data || []);
        }
    };

    const [formData, setFormData] = useState({
        cliente: '',
        fecha: new Date().toISOString().split('T')[0],
        envasesEntregados: 0,
        envasesRecibidos: 0,
        precioUnitario: 2500,
        medioPago: 'efectivo',
        notas: ''
    });

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

    const [paymentUrl, setPaymentUrl] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            // 1. Insertar el Pedido
            const { data: pedido, error: errorPedido } = await supabase
                .from('pedidos')
                .insert([{
                    cliente_id: formData.cliente || null,
                    fecha: formData.fecha,
                    total: calcularTotal(),
                    medio_pago: formData.medioPago,
                    estado: 'Entregado',
                    pago_estado: (formData.medioPago === 'transferencia' || formData.medioPago === 'fiado') ? 'pendiente' : 'pagado',
                    notas: formData.notas,
                    user_id: user.id
                }])
                .select()
                .single();

            if (errorPedido) throw errorPedido;

            // 2. Insertar el detalle
            const { error: errorDetalle } = await supabase
                .from('detalles_pedido')
                .insert([{
                    pedido_id: pedido.id,
                    producto: 'Bidón 20L',
                    cantidad: formData.envasesEntregados,
                    precio_unitario: formData.precioUnitario
                }]);

            if (errorDetalle) throw errorDetalle;

            alert(formData.medioPago === 'transferencia' ? '¡Venta registrada! Esperando transferencia...' : '¡Venta registrada con éxito!');
            
            setFormData({
                cliente: '',
                fecha: new Date().toISOString().split('T')[0],
                envasesEntregados: 0,
                envasesRecibidos: 0,
                precioUnitario: 2500,
                medioPago: 'efectivo',
                notas: ''
            });

            onClose();
        } catch (error) {
            console.error("Error al registrar pedido:", error);
            alert("No se pudo registrar la venta: " + error.message);
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
        <Modal isOpen={isOpen} onClose={onClose} title="🛒 Registrar Nuevo Pedido / Venta">
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
                        <label style={labelStyle}>💧 Envases Entregados (Llenos)</label>
                        <input required style={inputStyle} type="number" min="0" name="envasesEntregados" value={formData.envasesEntregados} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>🔄 Envases Recibidos (Vacíos)</label>
                        <input required style={inputStyle} type="number" min="0" name="envasesRecibidos" value={formData.envasesRecibidos} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>💲 Precio Unitario</label>
                        <input required style={inputStyle} type="number" min="0" step="100" name="precioUnitario" value={formData.precioUnitario} onChange={handleChange} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 2 }}>
                        <label style={labelStyle}>Medio de Pago *</label>
                        <select required style={{ ...inputStyle, marginBottom: 0 }} name="medioPago" value={formData.medioPago} onChange={handleChange}>
                            <option value="efectivo">Efectivo 💵</option>
                            <option value="transferencia">Transferencia 📱</option>
                            <option value="fiado">Pendiente de Pago / Fiado 📉</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right', paddingRight: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-gray)' }}>Total a cobrar:</span>
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
                        <p style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '0.25rem' }}>Indicar al cliente que envíe el comprobante al WhatsApp.</p>
                    </div>
                )}

                <div style={{ marginTop: '1rem' }}>
                    <label style={labelStyle}>Notas adicionales</label>
                    <textarea style={{ ...inputStyle, resize: 'none' }} rows="2" name="notas" value={formData.notas} onChange={handleChange} placeholder="Ej. El cliente pagó con billete de $10.000..."></textarea>
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

                    <button type="submit" style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: 'var(--primary-blue)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}>Registrar Venta</button>
                </div>
            </form>
        </Modal>
    );
};

export default PedidoFormModal;
