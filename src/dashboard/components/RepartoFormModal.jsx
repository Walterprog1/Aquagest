import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const RepartoFormModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        repartidor: '',
        vehiculo: '',
        zona: '',
        fecha: new Date().toISOString().split('T')[0],
        notas: ''
    });

    const [repartidores, setRepartidores] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [zonas, setZonas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const cargarDatos = async () => {
            if (!isOpen) return;
            setIsLoading(true);
            try {
                // Cargar Repartidores (perfiles con rol repartidor)
                const { data: dataRep, error: errRep } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('rol', 'repartidor')
                    .eq('estado', 'activo');
                
                if (errRep) throw errRep;
                setRepartidores(dataRep || []);

                // Cargar Vehiculos
                const { data: dataVeh, error: errVeh } = await supabase
                    .from('vehiculos')
                    .select('*')
                    .eq('estado', 'activo');
                if (errVeh) throw errVeh;
                setVehiculos(dataVeh || []);

                // Cargar Zonas
                const { data: dataZonas, error: errZonas } = await supabase
                    .from('zonas_reparto')
                    .select('*');
                if (errZonas) throw errZonas;
                setZonas(dataZonas || []);

            } catch (error) {
                console.error("Error cargando datos para reparto:", error);
            } finally {
                setIsLoading(false);
            }
        };

        cargarDatos();
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Sesión no iniciada");

            const { error } = await supabase
                .from('repartos')
                .insert([{
                    user_id: user.id,
                    repartidor_id: formData.repartidor,
                    vehiculo_id: formData.vehiculo,
                    zona_id: formData.zona,
                    fecha: formData.fecha,
                    notas: formData.notas,
                    estado: 'pendiente'
                }]);

            if (error) throw error;

            alert('¡Reparto guardado y asignado con éxito!');
            setFormData({
                repartidor: '',
                vehiculo: '',
                zona: '',
                fecha: new Date().toISOString().split('T')[0],
                notas: ''
            });
            onClose();
        } catch (error) {
            console.error("Error guardando reparto:", error);
            alert("Error al guardar reparto: " + error.message);
        } finally {
            setIsLoading(false);
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
        <Modal isOpen={isOpen} onClose={onClose} title="🗺️ Planificar Nuevo Reparto">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Repartidor *</label>
                        <select required style={inputStyle} name="repartidor" value={formData.repartidor} onChange={handleChange}>
                            <option value="">Seleccione un repartidor...</option>
                            {repartidores.length === 0 && !isLoading && <option disabled>No hay repartidores activos creados</option>}
                            {repartidores.map(r => (
                                <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Vehículo *</label>
                        <select required style={inputStyle} name="vehiculo" value={formData.vehiculo} onChange={handleChange}>
                            <option value="">Seleccione vehículo...</option>
                            {vehiculos.length === 0 && !isLoading && <option disabled>No hay vehículos activos creados</option>}
                            {vehiculos.map(v => (
                                <option key={v.id} value={v.id}>{v.marca} {v.modelo} - {v.patente}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Zona de Reparto *</label>
                        <select required style={inputStyle} name="zona" value={formData.zona} onChange={handleChange}>
                            <option value="">Seleccione zona...</option>
                            {zonas.length === 0 && !isLoading && <option disabled>No hay zonas creadas</option>}
                            {zonas.map(z => (
                                <option key={z.id} value={z.id}>{z.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Fecha de Ejecución *</label>
                        <input required style={inputStyle} type="date" name="fecha" value={formData.fecha} onChange={handleChange} />
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Instrucciones / Notas (Opcional)</label>
                    <textarea style={{ ...inputStyle, resize: 'none' }} rows="3" name="notas" value={formData.notas} onChange={handleChange} placeholder="Instrucciones especiales para el viaje..."></textarea>
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

                    <button type="submit" disabled={isLoading} style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: 'var(--primary-blue)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontWeight: '500',
                        opacity: isLoading ? 0.7 : 1
                    }}>
                        {isLoading ? 'Cargando...' : 'Crear Reparto'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default RepartoFormModal;
