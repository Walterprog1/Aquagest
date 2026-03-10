import React, { useState } from 'react';
import Modal from './Modal';

const RepartoFormModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        repartidor: '',
        vehiculo: '',
        zona: '',
        fecha: '',
        notas: ''
    });

    const [repartidores, setRepartidores] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [zonas, setZonas] = useState([]);

    React.useEffect(() => {
        if (isOpen) {
            const usuariosGuardados = JSON.parse(localStorage.getItem('aquagest_usuarios') || '[]');
            const repartidoresFiltrados = usuariosGuardados.filter(u => u.rol === 'repartidor' && u.estado === 'activo');
            setRepartidores(repartidoresFiltrados);

            const vehiculosGuardados = JSON.parse(localStorage.getItem('aquagest_vehiculos') || '[]');
            setVehiculos(vehiculosGuardados.filter(v => v.estado === 'activo'));

            const zonasGuardadas = JSON.parse(localStorage.getItem('aquagest_zonas') || '[]');
            setZonas(zonasGuardadas);
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const nuevoReparto = {
            ...formData,
            id: Date.now().toString(),
            estado: 'pendiente'
        };

        const repartosGuardados = JSON.parse(localStorage.getItem('aquagest_repartos') || '[]');
        repartosGuardados.push(nuevoReparto);
        localStorage.setItem('aquagest_repartos', JSON.stringify(repartosGuardados));

        alert('¡Reparto guardado y asignado con éxito!');

        setFormData({
            repartidor: '',
            vehiculo: '',
            zona: '',
            fecha: '',
            notas: ''
        });

        onClose();
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
                            {repartidores.length === 0 && <option disabled>No hay repartidores activos creados</option>}
                            {repartidores.map(r => (
                                <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Vehículo *</label>
                        <select required style={inputStyle} name="vehiculo" value={formData.vehiculo} onChange={handleChange}>
                            <option value="">Seleccione vehículo...</option>
                            {vehiculos.length === 0 && <option disabled>No hay vehículos activos creados</option>}
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
                            {zonas.length === 0 && <option disabled>No hay zonas creadas</option>}
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

                    <button type="submit" style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        backgroundColor: 'var(--primary-blue)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}>Crear Reparto</button>
                </div>
            </form>
        </Modal>
    );
};

export default RepartoFormModal;
