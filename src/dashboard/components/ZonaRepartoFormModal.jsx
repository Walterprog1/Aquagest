import React, { useState } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const ZonaRepartoFormModal = ({ isOpen, onClose, zonaAEditar }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        codigoPostal: '',
        diasVisita: []
    });

    React.useEffect(() => {
        if (isOpen && zonaAEditar) {
            setFormData({
                nombre: zonaAEditar.nombre || '',
                descripcion: zonaAEditar.descripcion || '',
                codigoPostal: zonaAEditar.codigoPostal || '', // Se puede guardar en descripción o nueva columna
                diasVisita: zonaAEditar.diasVisita || []
            });
        } else if (isOpen && !zonaAEditar) {
            setFormData({
                nombre: '',
                descripcion: '',
                codigoPostal: '',
                diasVisita: []
            });
        }
    }, [isOpen, zonaAEditar]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => {
                const newDias = checked
                    ? [...prev.diasVisita, name]
                    : prev.diasVisita.filter(d => d !== name);
                return { ...prev, diasVisita: newDias };
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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

            const zonaData = {
                nombre: formData.nombre,
                descripcion: formData.descripcion + (formData.codigoPostal ? ` (CP: ${formData.codigoPostal})` : '') + 
                           (formData.diasVisita.length > 0 ? ` [Días: ${formData.diasVisita.join(', ')}]` : ''),
                user_id: user.id
            };

            let result;
            if (zonaAEditar) {
                result = await supabase
                    .from('zonas_reparto')
                    .update(zonaData)
                    .eq('id', zonaAEditar.id);
            } else {
                result = await supabase
                    .from('zonas_reparto')
                    .insert([zonaData]);
            }

            if (result.error) throw result.error;

            alert(zonaAEditar ? '¡Zona de Reparto actualizada con éxito!' : '¡Zona de Reparto registrada con éxito!');
            onClose();
        } catch (error) {
            console.error("Error al guardar zona:", error);
            alert("No se pudo guardar la zona: " + error.message);
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

    const checkboxGroupStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1rem',
        padding: '0.75rem',
        backgroundColor: 'var(--background-gray)',
        borderRadius: 'var(--border-radius-md)'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📍 Registrar Nueva Zona de Reparto">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 2 }}>
                        <label style={labelStyle}>Nombre de la Zona *</label>
                        <input required style={inputStyle} type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Zona Norte - Centro" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Código Postal Principal</label>
                        <input style={inputStyle} type="text" name="codigoPostal" value={formData.codigoPostal} onChange={handleChange} placeholder="Ej. 1425" />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Descripción / Límites</label>
                    <textarea style={{ ...inputStyle, resize: 'none' }} rows="2" name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Ej. Comprendida entre Av. San Martín y calle Belgrano..."></textarea>
                </div>

                <div>
                    <label style={labelStyle}>Días de Visita Habituales</label>
                    <div style={checkboxGroupStyle}>
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(dia => (
                            <label key={dia} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <input
                                    type="checkbox"
                                    name={dia}
                                    checked={formData.diasVisita.includes(dia)}
                                    onChange={handleChange}
                                />
                                {dia}
                            </label>
                        ))}
                    </div>
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
                        Registrar Zona
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ZonaRepartoFormModal;
