import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import VehiculoFormModal from './VehiculoFormModal';

const VehiculosListModal = ({ isOpen, onClose }) => {
    const [vehiculos, setVehiculos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [vehiculoAEditar, setVehiculoAEditar] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const cargarVehiculos = () => {
        const guardados = JSON.parse(localStorage.getItem('aquagest_vehiculos') || '[]');
        setVehiculos(guardados);
    };

    useEffect(() => {
        if (isOpen) {
            cargarVehiculos();
        }
    }, [isOpen]);

    const handleEdit = (vehiculo) => {
        setVehiculoAEditar(vehiculo);
        setIsEditModalOpen(true);
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        setVehiculoAEditar(null);
        cargarVehiculos();
    };

    const filteredVehiculos = vehiculos.filter(v =>
        v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.patente.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '1rem',
        fontSize: '0.875rem'
    };

    const thStyle = {
        textAlign: 'left',
        padding: '0.75rem',
        borderBottom: '2px solid var(--border-color)',
        color: 'var(--text-gray)',
        fontWeight: '600'
    };

    const tdStyle = {
        padding: '0.75rem',
        borderBottom: '1px solid var(--border-color)'
    };

    const getStatusStyle = (estado) => {
        switch (estado) {
            case 'activo': return { backgroundColor: '#d1fae5', color: '#065f46' };
            case 'taller': return { backgroundColor: '#fef3c7', color: '#92400e' };
            case 'baja': return { backgroundColor: '#fee2e2', color: '#991b1b' };
            default: return {};
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="🚐 Listado de Vehículos">
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar por marca, modelo o patente..."
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius-md)',
                            fontSize: '1rem'
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Vehículo</th>
                                <th style={thStyle}>Patente</th>
                                <th style={thStyle}>Carga (kg)</th>
                                <th style={thStyle}>Estado</th>
                                <th style={thStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVehiculos.length > 0 ? filteredVehiculos.map(v => (
                                <tr key={v.id}>
                                    <td style={tdStyle}>
                                        <strong>{v.marca}</strong> {v.modelo}
                                    </td>
                                    <td style={tdStyle}>{v.patente.toUpperCase()}</td>
                                    <td style={tdStyle}>{v.capacidadCarga || '-'}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            ...getStatusStyle(v.estado)
                                        }}>
                                            {v.estado.charAt(0).toUpperCase() + v.estado.slice(1)}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => handleEdit(v)}
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#f3f4f6',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            ✏️ Editar
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>
                                        No hay resultados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                    <button onClick={onClose} style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--primary-blue)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--border-radius-md)',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}>
                        Cerrar
                    </button>
                </div>
            </Modal>

            <VehiculoFormModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEdit}
                vehiculoAEditar={vehiculoAEditar}
            />
        </>
    );
};

export default VehiculosListModal;
