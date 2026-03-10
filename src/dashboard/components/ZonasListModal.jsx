import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ZonaRepartoFormModal from './ZonaRepartoFormModal';

const ZonasListModal = ({ isOpen, onClose }) => {
    const [zonas, setZonas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [zonaAEditar, setZonaAEditar] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const cargarZonas = () => {
        const guardados = JSON.parse(localStorage.getItem('aquagest_zonas') || '[]');
        setZonas(guardados);
    };

    useEffect(() => {
        if (isOpen) {
            cargarZonas();
        }
    }, [isOpen]);

    const handleEdit = (zona) => {
        setZonaAEditar(zona);
        setIsEditModalOpen(true);
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        setZonaAEditar(null);
        cargarZonas();
    };

    const filteredZonas = zonas.filter(z =>
        z.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        z.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
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

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="📍 Listado de Zonas de Reparto">
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar por nombre o descripción..."
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
                                <th style={thStyle}>Zona</th>
                                <th style={thStyle}>Descripción</th>
                                <th style={thStyle}>Días</th>
                                <th style={thStyle}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredZonas.length > 0 ? filteredZonas.map(z => (
                                <tr key={z.id}>
                                    <td style={tdStyle}><strong>{z.nombre}</strong></td>
                                    <td style={tdStyle}>{z.descripcion || '-'}</td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {(z.diasVisita || []).map(dia => (
                                                <span key={dia} style={{ fontSize: '0.65rem', backgroundColor: '#e2e8f0', padding: '1px 4px', borderRadius: '4px' }}>
                                                    {dia.slice(0, 2)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <button
                                            onClick={() => handleEdit(z)}
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
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>
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

            <ZonaRepartoFormModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEdit}
                zonaAEditar={zonaAEditar}
            />
        </>
    );
};

export default ZonasListModal;
