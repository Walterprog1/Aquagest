import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const DispenserFormModal = ({ isOpen, onClose, dispenserAEditar }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [formData, setFormData] = useState({
        modelo: 'Dispenser de Pie',
        numero_serie: '',
        estado: 'disponible',
        cliente_id: '',
        fecha_instalacion: '',
        notas: ''
    });

    useEffect(() => {
        if (isOpen) {
            // Cargar clientes para el selector si se necesita instalar
            const fetchClientes = async () => {
                const { data } = await supabase.from('clientes').select('id, nombre').order('nombre');
                setClientes(data || []);
            };
            fetchClientes();

            if (dispenserAEditar) {
                setFormData({
                    modelo: dispenserAEditar.modelo || 'Dispenser de Pie',
                    numero_serie: dispenserAEditar.numero_serie || '',
                    estado: dispenserAEditar.estado || 'disponible',
                    cliente_id: dispenserAEditar.cliente_id || '',
                    fecha_instalacion: dispenserAEditar.fecha_instalacion || '',
                    notas: dispenserAEditar.notas || ''
                });
            } else {
                setFormData({
                    modelo: 'Dispenser de Pie',
                    numero_serie: '',
                    estado: 'disponible',
                    cliente_id: '',
                    fecha_instalacion: '',
                    notas: ''
                });
            }
        }
    }, [isOpen, dispenserAEditar]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            const dispenserData = {
                modelo: formData.modelo,
                numero_serie: formData.numero_serie,
                estado: formData.estado,
                cliente_id: formData.estado === 'instalado' ? (formData.cliente_id || null) : null,
                fecha_instalacion: formData.estado === 'instalado' ? (formData.fecha_instalacion || null) : null,
                notas: formData.notas,
                user_id: user.id
            };

            let error;
            if (dispenserAEditar) {
                const result = await supabase
                    .from('dispensers')
                    .update(dispenserData)
                    .eq('id', dispenserAEditar.id);
                error = result.error;
            } else {
                const result = await supabase
                    .from('dispensers')
                    .insert([dispenserData]);
                error = result.error;
            }

            if (error) throw error;

            alert(dispenserAEditar ? '¡Dispenser actualizado!' : '¡Dispenser registrado!');
            onClose();
        } catch (error) {
            console.error("Error al guardar dispenser:", error);
            alert("Error: " + error.message);
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
        <Modal isOpen={isOpen} onClose={onClose} title={dispenserAEditar ? "✏️ Editar Dispenser" : "🚰 Registrar Nuevo Dispenser"}>
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Modelo *</label>
                        <select required style={inputStyle} name="modelo" value={formData.modelo} onChange={handleChange}>
                            <option value="Dispenser de Pie">Dispenser de Pie</option>
                            <option value="Dispenser de Mesa">Dispenser de Mesa</option>
                            <option value="Dispenser con Heladera">Dispenser con Heladera</option>
                            <option value="Mate Eléctrico">Mate Eléctrico / Otros</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Número de Serie / ID</label>
                        <input style={inputStyle} type="text" name="numero_serie" value={formData.numero_serie} onChange={handleChange} placeholder="Ej. D-2024-001" />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Estado del Equipo *</label>
                    <select required style={inputStyle} name="estado" value={formData.estado} onChange={handleChange}>
                        <option value="disponible">Disponible (En stock)</option>
                        <option value="instalado">Instalado (En cliente)</option>
                        <option value="mantenimiento">En Mantenimiento / Taller</option>
                        <option value="baja">Dado de Baja</option>
                    </select>
                </div>

                {formData.estado === 'instalado' && (
                    <div style={{ backgroundColor: 'var(--background-gray)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                        <label style={labelStyle}>Asignar a Cliente *</label>
                        <select required style={inputStyle} name="cliente_id" value={formData.cliente_id} onChange={handleChange}>
                            <option value="">Seleccionar cliente...</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>

                        <label style={labelStyle}>Fecha de Instalación</label>
                        <input style={{ ...inputStyle, marginBottom: 0 }} type="date" name="fecha_instalacion" value={formData.fecha_instalacion} onChange={handleChange} />
                    </div>
                )}

                <div>
                    <label style={labelStyle}>Notas adicionales</label>
                    <textarea style={{ ...inputStyle, resize: 'none' }} rows="2" name="notas" value={formData.notas} onChange={handleChange} placeholder="Historial técnico, detalles de ubicación en el cliente..."></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={onClose} style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer'
                    }}>Cancelar</button>
                    <button type="submit" disabled={isSubmitting} style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: 'var(--primary-blue)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}>
                        {isSubmitting ? 'Guardando...' : (dispenserAEditar ? 'Actualizar' : 'Registrar Dispenser')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DispenserFormModal;
