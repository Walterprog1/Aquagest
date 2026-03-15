import React, { useState } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const VehiculoFormModal = ({ isOpen, onClose, vehiculoAEditar }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        marca: '',
        modelo: '',
        patente: '',
        capacidadCarga: '',
        estado: 'activo',
        vencimientoSeguro: '',
        notas: ''
    });

    React.useEffect(() => {
        if (isOpen && vehiculoAEditar) {
            setFormData({
                marca: vehiculoAEditar.marca || '',
                modelo: vehiculoAEditar.modelo || '',
                patente: vehiculoAEditar.patente || '',
                capacidadCarga: vehiculoAEditar.capacidad || '',
                estado: vehiculoAEditar.estado || 'activo',
                vencimientoSeguro: vehiculoAEditar.vencimiento_seguro || '',
                notas: vehiculoAEditar.notas || ''
            });
        } else if (isOpen && !vehiculoAEditar) {
            setFormData({
                marca: '',
                modelo: '',
                patente: '',
                capacidadCarga: '',
                estado: 'activo',
                vencimientoSeguro: '',
                notas: ''
            });
        }
    }, [isOpen, vehiculoAEditar]);

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

            const vehiculoData = {
                marca: formData.marca,
                modelo: formData.modelo,
                patente: formData.patente,
                capacidad: parseInt(formData.capacidadCarga) || 0,
                estado: formData.estado,
                vencimiento_seguro: formData.vencimientoSeguro || null,
                notas: formData.notas || '',
                user_id: user.id
            };

            let result;
            if (vehiculoAEditar) {
                result = await supabase
                    .from('vehiculos')
                    .update(vehiculoData)
                    .eq('id', vehiculoAEditar.id);
            } else {
                result = await supabase
                    .from('vehiculos')
                    .insert([vehiculoData]);
            }

            if (result.error) throw result.error;

            alert(vehiculoAEditar ? '¡Vehículo actualizado con éxito!' : '¡Vehículo registrado con éxito!');
            onClose();
        } catch (error) {
            console.error("Error al guardar vehículo:", error);
            alert("No se pudo guardar el vehículo: " + error.message);
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
        <Modal isOpen={isOpen} onClose={onClose} title="🚐 Registrar Nuevo Vehículo">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Marca *</label>
                        <input required style={inputStyle} type="text" name="marca" value={formData.marca} onChange={handleChange} placeholder="Ej. Ford, Mercedes..." />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Modelo / Año *</label>
                        <input required style={inputStyle} type="text" name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej. Transit 2018" />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Patente (Dominio) *</label>
                        <input required style={{ ...inputStyle, textTransform: 'uppercase' }} type="text" name="patente" value={formData.patente} onChange={handleChange} placeholder="Ej. AB 123 CD" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Capacidad de Carga (kg)</label>
                        <input style={inputStyle} type="number" min="0" name="capacidadCarga" value={formData.capacidadCarga} onChange={handleChange} placeholder="Ej. 1500" />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Vencimiento del Seguro</label>
                        <input style={inputStyle} type="date" name="vencimientoSeguro" value={formData.vencimientoSeguro} onChange={handleChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Estado Inicial del Vehículo *</label>
                        <select required style={inputStyle} name="estado" value={formData.estado} onChange={handleChange}>
                            <option value="activo">Activo (Disponible para reparto)</option>
                            <option value="taller">En Taller / Mantenimiento</option>
                            <option value="baja">De Baja</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Observaciones / Notas (Opcional)</label>
                    <textarea style={{ ...inputStyle, resize: 'none' }} rows="2" name="notas" value={formData.notas} onChange={handleChange} placeholder="Ej. Detalles mecánicos, equipamiento extra..."></textarea>
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
                        Registrar Vehículo
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default VehiculoFormModal;
