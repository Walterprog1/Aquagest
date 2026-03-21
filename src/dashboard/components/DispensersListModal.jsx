import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';
import DispenserFormModal from './DispenserFormModal';

const DispensersListModal = ({ isOpen, onClose }) => {
    const [dispensers, setDispensers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [dispenserAEditar, setDispenserAEditar] = useState(null);

    const fetchDispensers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('dispensers')
                .select(`
                    *,
                    clientes (nombre)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDispensers(data || []);
        } catch (error) {
            console.error("Error al obtener dispensers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchDispensers();
        }
    }, [isOpen]);

    const handleEdit = (dispenser) => {
        setDispenserAEditar(dispenser);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este dispenser? Esta acción no se puede deshacer.')) {
            const { error } = await supabase.from('dispensers').delete().eq('id', id);
            if (error) alert("Error al eliminar: " + error.message);
            else fetchDispensers();
        }
    };

    const filteredDispensers = dispensers.filter(d => 
        (d.modelo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusStyle = (estado) => {
        switch (estado) {
            case 'disponible': return { backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' };
            case 'instalado': return { backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' };
            case 'mantenimiento': return { backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' };
            case 'baja': return { backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' };
            default: return {};
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="🚰 Listado y Control de Dispensers">
            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="🔍 Buscar por modelo, serie o cliente..."
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--border-radius-md)'
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={{ overflowX: 'auto', minHeight: '300px' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando inventario...</div>
                ) : filteredDispensers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>
                        No se encontraron dispensers que coincidan.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead style={{ backgroundColor: 'var(--background-gray)', textAlign: 'left' }}>
                            <tr>
                                <th style={{ padding: '0.75rem' }}>Modelo</th>
                                <th style={{ padding: '0.75rem' }}>Nº Serie</th>
                                <th style={{ padding: '0.75rem' }}>Estado</th>
                                <th style={{ padding: '0.75rem' }}>Ubicación / Cliente</th>
                                <th style={{ padding: '0.75rem' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDispensers.map(d => (
                                <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{d.modelo}</td>
                                    <td style={{ padding: '0.75rem' }}><code>{d.numero_serie || 'S/N'}</code></td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={getStatusStyle(d.estado)}>{d.estado.toUpperCase()}</span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {d.estado === 'instalado' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '500' }}>📍 {d.clientes?.nombre || 'Cliente desconocido'}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-gray)' }}>Instalado el: {d.fecha_instalacion || 'N/A'}</span>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-gray)' }}>N/A</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button 
                                                onClick={() => handleEdit(d)}
                                                style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #356bd6', color: '#356bd6', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(d.id)}
                                                style={{ padding: '4px 8px', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <DispenserFormModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setDispenserAEditar(null);
                    fetchDispensers();
                }}
                dispenserAEditar={dispenserAEditar}
            />
        </Modal>
    );
};

export default DispensersListModal;
