import React, { useState } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const ClienteFormModal = ({ isOpen, onClose, clienteAEditar }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        localidad: '',
        telefono: '',
        whatsapp: '',
        tipo: 'residencial',
        email: '',
        precioEspecialBidon20L: '',
        notas: '',
        lat: '',
        lng: ''
    });

    // Cargar datos si estamos editando
    React.useEffect(() => {
        if (isOpen && clienteAEditar) {
            setFormData({
                nombre: clienteAEditar.nombre || '',
                direccion: clienteAEditar.direccion || '',
                localidad: clienteAEditar.localidad || '',
                telefono: clienteAEditar.telefono || '',
                whatsapp: clienteAEditar.whatsapp || '',
                tipo: clienteAEditar.tipo || 'residencial',
                email: clienteAEditar.email || '',
                precioEspecialBidon20L: clienteAEditar.precio_especial || '',
                notas: clienteAEditar.notas || '',
                lat: clienteAEditar.lat || '',
                lng: clienteAEditar.lng || ''
            });
        } else if (isOpen && !clienteAEditar) {
            setFormData({
                nombre: '',
                direccion: '',
                localidad: '',
                telefono: '',
                whatsapp: '',
                tipo: 'residencial',
                email: '',
                precioEspecialBidon20L: '',
                notas: '',
                lat: '',
                lng: ''
            });
        }
    }, [isOpen, clienteAEditar]);

    const obtenerUbicacion = () => {
        if (!navigator.geolocation) {
            alert('La geolocalización no es compatible con este navegador.');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    lat: position.coords.latitude.toFixed(7),
                    lng: position.coords.longitude.toFixed(7)
                }));
            },
            (error) => {
                console.error("Error obteniendo ubicación:", error);
                alert('No se pudo obtener la ubicación. Por favor, asegúrese de dar permisos de GPS.');
            },
            options
        );
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                alert("Debes estar autenticado para guardar datos.");
                return;
            }

            const clientData = {
                nombre: formData.nombre,
                direccion: formData.direccion,
                localidad: formData.localidad,
                telefono: formData.telefono,
                whatsapp: formData.whatsapp,
                tipo: formData.tipo,
                email: formData.email,
                precio_especial: parseFloat(formData.precioEspecialBidon20L) || 0,
                notas: formData.notas,
                lat: formData.lat ? parseFloat(formData.lat) : null,
                lng: formData.lng ? parseFloat(formData.lng) : null,
                user_id: user.id
            };

            let result;
            if (clienteAEditar) {
                result = await supabase
                    .from('clientes')
                    .update(clientData)
                    .eq('id', clienteAEditar.id);
            } else {
                result = await supabase
                    .from('clientes')
                    .insert([clientData]);
            }

            if (result.error) throw result.error;

            alert(clienteAEditar ? '¡Cliente actualizado con éxito!' : '¡Cliente guardado con éxito!');
            onClose();
        } catch (error) {
            console.error("Error al guardar cliente:", error);
            alert("No se pudo guardar el cliente: " + error.message);
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
        fontFamily: 'inherit'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
        fontSize: '0.875rem'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={clienteAEditar ? "✏️ Editar Cliente" : "✒️ Agregar Nuevo Cliente"}>
            <form onSubmit={handleSubmit}>
                <div>
                    <label style={labelStyle}>Nombre / Razón Social *</label>
                    <input required style={inputStyle} type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Juan Pérez" />
                </div>

                <div>
                    <label style={labelStyle}>Dirección *</label>
                    <input required style={inputStyle} type="text" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Ej. Calle Principal 123" />
                </div>

                <div>
                    <label style={labelStyle}>Localidad *</label>
                    <input required style={inputStyle} type="text" name="localidad" value={formData.localidad} onChange={handleChange} placeholder="Ej. Quilmes, Bernal, etc." />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Teléfono</label>
                        <input style={inputStyle} type="tel" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej. 1122334455" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>WhatsApp *</label>
                        <input required style={inputStyle} type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="Ej. 1122334455" />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Tipo de Cliente *</label>
                        <select style={inputStyle} name="tipo" value={formData.tipo} onChange={handleChange}>
                            <option value="residencial">Residencial</option>
                            <option value="comercial">Comercial</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Email (Opcional)</label>
                        <input style={inputStyle} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="correo@ejemplo.com" />
                    </div>
                </div>

                <div style={{ backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <label style={{ ...labelStyle, marginBottom: 0, color: 'var(--primary-blue)' }}>📍 Ubicación Geográfica (GPS)</label>
                        <button
                            type="button"
                            onClick={obtenerUbicacion}
                            style={{
                                padding: '4px 8px',
                                backgroundColor: 'var(--primary-blue)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            🛰️ Obtener Mi Ubicación
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Latitud</label>
                            <input style={{ ...inputStyle, marginBottom: 0, padding: '0.5rem' }} type="text" name="lat" value={formData.lat} onChange={handleChange} placeholder="-34.6037" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Longitud</label>
                            <input style={{ ...inputStyle, marginBottom: 0, padding: '0.5rem' }} type="text" name="lng" value={formData.lng} onChange={handleChange} placeholder="-58.3816" />
                        </div>
                    </div>

                    {formData.lat && formData.lng && (
                        <div style={{ width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <iframe
                                title="Mapa Cliente"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight="0"
                                marginWidth="0"
                                src={`https://maps.google.com/maps?q=${formData.lat},${formData.lng}&z=15&output=embed`}
                            ></iframe>
                        </div>
                    )}
                </div>

                <div style={{ backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                    <label style={{ ...labelStyle, color: 'var(--primary-blue)' }}>Condiciones Comerciales Especiales *</label>
                    <div>
                        <label style={labelStyle}>Precio Acordado Bidón 20L *</label>
                        <div style={{ position: 'relative', width: '50%' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text-gray)' }}>$</span>
                            <input required style={{ ...inputStyle, marginBottom: 0, paddingLeft: '1.5rem' }} type="number" step="0.01" min="0" name="precioEspecialBidon20L" value={formData.precioEspecialBidon20L} onChange={handleChange} placeholder="Ej. 2500" />
                        </div>
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Notas (Opcional)</label>
                    <textarea style={{ ...inputStyle, resize: 'none' }} rows="3" name="notes" value={formData.notas} onChange={handleChange} placeholder="Instrucciones de entrega, horarios, etc."></textarea>
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
                    }}>
                        {clienteAEditar ? 'Actualizar Cliente' : 'Guardar Cliente'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ClienteFormModal;
