import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const PedidoFormModal = ({ isOpen, onClose, pedidoAEditar = null }) => {
    const [clientesGuardados, setClientesGuardados] = useState([]);
    const [repartosDisponibles, setRepartosDisponibles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const [formData, setFormData] = useState({
        cliente: '',
        repartoId: '',
        fecha: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD local
        envasesEntregados: 0,
        envasesRecibidos: 0,
        precioUnitario: 2500,
        medioPago: '',
        notas: ''
    });

    // Carga de Clientes (Independiente)
    const cargarClientes = async () => {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nombre', { ascending: true });
        
        if (!error) {
            setClientesGuardados(data || []);
            return data || [];
        }
        return [];
    };

    // Carga de Repartos (Dependiente de la fecha)
    const cargarRepartos = async (fecha) => {
        try {
            const { data, error } = await supabase
                .from('repartos')
                .select(`
                    id, 
                    zonas_reparto:zona_id (nombre),
                    perfiles:repartidor_id (nombre, apellido)
                `)
                .eq('fecha', fecha);
            
            if (error) throw error;
            setRepartosDisponibles(data || []);
        } catch (error) {
            console.error("Error cargando repartos:", error);
        }
    };

    // EFECTO ÚNICO DE MONTAJE (Gracias a la 'key' en Dashboard.jsx)
    useEffect(() => {
        if (isOpen) {
            const inicializar = async () => {
                setIsLoadingData(true);
                try {
                    // 1. Cargar lista de clientes PRIMERO para tener los precios especiales
                    const clientesActuales = await cargarClientes();

                    if (pedidoAEditar && pedidoAEditar.id) {
                        // 2. RECUPERACION ATÓMICA: Pedimos el pedido con sus detalles
                        const { data: pReal, error: errP } = await supabase
                            .from('pedidos')
                            .select('*, detalles_pedido(*)')
                            .eq('id', pedidoAEditar.id)
                            .single();

                        if (errP) throw errP;

                        // 3. Obtener detalles y precio sugerido por cliente
                        const detalles = pReal.detalles_pedido || [];
                        const detalle = detalles.length > 0 ? detalles[0] : null;
                        
                        // Buscamos el precio especial del cliente
                        const clienteData = clientesActuales.find(c => c.id === pReal.cliente_id);
                        const precioSugerido = clienteData?.precio_especial ? Number(clienteData.precio_especial) : 2500;

                        // 4. Lógica de respaldo inteligente para evitar el "Error del 4" (9000/2500 = 3.6 -> 4)
                        let cantEntregada = 0;
                        let preUnitario = precioSugerido;

                        if (detalle) {
                            cantEntregada = detalle.cantidad;
                            preUnitario = detalle.precio_unitario;
                        } else if (pReal.total > 0) {
                            // Si el detalle falló pero el total existe, deducimos usando el precio sugerido del cliente
                            preUnitario = precioSugerido;
                            cantEntregada = Math.round(pReal.total / preUnitario) || 0;
                        }

                        const cleanFecha = pReal.fecha ? (pReal.fecha.includes('T') ? pReal.fecha.split('T')[0] : pReal.fecha) : '';
                        
                        if (cleanFecha) {
                            await cargarRepartos(cleanFecha);
                        }

                        setFormData({
                            cliente: pReal.cliente_id || '',
                            repartoId: pReal.reparto_id || '',
                            fecha: cleanFecha,
                            envasesEntregados: Number(cantEntregada),
                            envasesRecibidos: Number(pReal.envases_recibidos) || 0,
                            precioUnitario: Number(preUnitario),
                            medioPago: pReal.medio_pago || '',
                            notas: pReal.notas || ''
                        });
                    } else {
                        // MODO CREACIÓN
                        const hoy = new Date().toLocaleDateString('en-CA');
                        setFormData({
                            cliente: '',
                            repartoId: '',
                            fecha: hoy,
                            envasesEntregados: 0,
                            envasesRecibidos: 0,
                            precioUnitario: 2500,
                            medioPago: '',
                            notas: ''
                        });
                        setRepartosDisponibles([]);
                        await cargarRepartos(hoy);
                    }
                } catch (err) {
                    console.error("[PedidoFormModal] Error fatal en inicialización:", err);
                } finally {
                    setIsLoadingData(false);
                }
            };

            inicializar();
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'fecha') {
            setFormData(prev => ({ ...prev, fecha: value }));
            cargarRepartos(value);
            return;
        }

        if (name === 'cliente' && value) {
            const clienteSeleccionado = clientesGuardados.find(c => c.id === value);
            if (clienteSeleccionado && clienteSeleccionado.precio_especial) {
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    precioUnitario: Number(clienteSeleccionado.precio_especial)
                }));
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calcularTotal = () => {
        return (Number(formData.envasesEntregados) || 0) * (Number(formData.precioUnitario) || 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

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
                reparto_id: formData.repartoId || null,
                fecha: formData.fecha,
                total: calcularTotal(),
                medio_pago: formData.medioPago || null,
                estado: derivedEstado,
                pago_estado: derivedPagoEstado,
                notas: formData.notas,
                user_id: user.id,
                envases_recibidos: formData.envasesRecibidos
            };

            if (pedidoAEditar) {
                // Si es edición, solo registramos ingreso si ANTES NO estaba pagado y AHORA SÍ lo está.
                // Pero según el plan simplificado, si el usuario explícitamente guarda como pagado, insertamos un registro.
                // Para evitar duplicaciones infinitas en ediciones, solo registramos si el pago cambia de pendiente a pagado.
                
                const { data: pAntiguo } = await supabase
                    .from('pedidos')
                    .select('pago_estado')
                    .eq('id', pedidoAEditar.id)
                    .single();

                const { error: errorUpdate } = await supabase
                    .from('pedidos')
                    .update(pedidoData)
                    .eq('id', pedidoAEditar.id);

                if (errorUpdate) throw errorUpdate;

                // REGISTRO AUTOMÁTICO DE INGRESO (SOLO SI CAMBIÓ A PAGADO)
                if (derivedPagoEstado === 'pagado' && pAntiguo?.pago_estado !== 'pagado') {
                    const { data: cData } = await supabase.from('clientes').select('nombre').eq('id', formData.cliente).single();
                    const { error: errOp } = await supabase.from('operaciones').insert([{
                        user_id: user.id,
                        fecha: formData.fecha,
                        tipo: 'ingreso',
                        categoria: 'venta_mostrador',
                        monto: pedidoData.total,
                        metodo_pago: pedidoData.medio_pago,
                        concepto: `Cobro Pedido #${pedidoAEditar.id.split('-')[0]} - ${cData?.nombre || 'S/N'}`
                    }]);
                    if (errOp) console.error("[Caja] Error al registrar ingreso automático (Edit):", errOp);
                }

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
                const { data: pedido, error: errorPedido } = await supabase
                    .from('pedidos')
                    .insert([pedidoData])
                    .select()
                    .single();

                if (errorPedido) throw errorPedido;

                // REGISTRO AUTOMÁTICO DE INGRESO (SOLO SI ES NUEVO Y PAGADO)
                if (derivedPagoEstado === 'pagado') {
                    const { data: cData } = await supabase.from('clientes').select('nombre').eq('id', formData.cliente).single();
                    const { error: errOp } = await supabase.from('operaciones').insert([{
                        user_id: user.id,
                        fecha: formData.fecha,
                        tipo: 'ingreso',
                        categoria: 'venta_mostrador',
                        monto: pedidoData.total,
                        metodo_pago: pedidoData.medio_pago,
                        concepto: `Venta Pedido #${pedido.id.split('-')[0]} - ${cData?.nombre || 'S/N'}`
                    }]);
                    if (errOp) console.error("[Caja] Error al registrar ingreso automático (Nuevo):", errOp);
                }

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
            {isLoadingData ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>⌛</div>
                    <div style={{ fontWeight: '500' }}>Sincronizando información...</div>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1.5 }}>
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

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Asignar a Reparto (Opcional)</label>
                        <select style={inputStyle} name="repartoId" value={formData.repartoId} onChange={handleChange}>
                            <option value="">-- Sin reparto específico --</option>
                            {repartosDisponibles.map(rep => (
                                <option key={rep.id} value={rep.id}>
                                    {rep.zonas_reparto?.nombre || 'Zona N/A'} - {rep.perfiles ? `${rep.perfiles.nombre} ${rep.perfiles.apellido}` : 'S/R'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>💧 Entregados</label>
                            <input required style={inputStyle} type="number" min="0" name="envasesEntregados" value={formData.envasesEntregados} onChange={handleChange} autoComplete="off" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>🔁 Recibidos (Vacíos)</label>
                            <input required style={inputStyle} type="number" min="0" name="envasesRecibidos" value={formData.envasesRecibidos} onChange={handleChange} autoComplete="off" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>💲 Precio Un.</label>
                            <input required style={inputStyle} type="number" min="0" step="1" name="precioUnitario" value={formData.precioUnitario} onChange={handleChange} autoComplete="off" />
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
            )}
        </Modal>
    );
};

export default PedidoFormModal;
