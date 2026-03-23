import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../lib/supabase';

const OperacionesListModal = ({ isOpen, onClose }) => {
    const [operaciones, setOperaciones] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroPeriodo, setFiltroPeriodo] = useState('total');
    const [searchTerm, setSearchTerm] = useState('');

    const cargarOperaciones = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('operaciones')
                .select('*')
                .order('fecha', { ascending: false })
                .order('created_at', { ascending: false });

            if (filtroTipo !== 'todos') {
                query = query.eq('tipo', filtroTipo);
            }

            const { data, error } = await query;
            if (error) throw error;
            setOperaciones(data || []);
        } catch (error) {
            console.error('Error al cargar operaciones:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            cargarOperaciones();
        }
    }, [isOpen, filtroTipo]);

    const eliminarOperacion = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este registro de caja?')) return;

        try {
            const { error } = await supabase
                .from('operaciones')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setOperaciones(prev => prev.filter(op => op.id !== id));
        } catch (error) {
            console.error('Error al eliminar operación:', error);
            alert('No se pudo eliminar el registro.');
        }
    };

    const filtrarOperaciones = () => {
        const hoy = new Date().toISOString().split('T')[0];
        const fechaActual = new Date();
        const hace7Dias = new Date();
        hace7Dias.setDate(fechaActual.getDate() - 7);
        const isoHace7Dias = hace7Dias.toISOString().split('T')[0];
        const esteMes = hoy.substring(0, 7);
        const esteAnio = hoy.substring(0, 4);

        let filtradas = operaciones;

        // Filtrar por período
        if (filtroPeriodo === 'hoy') filtradas = filtradas.filter(op => op.fecha === hoy);
        else if (filtroPeriodo === 'semana') filtradas = filtradas.filter(op => op.fecha >= isoHace7Dias);
        else if (filtroPeriodo === 'mes') filtradas = filtradas.filter(op => op.fecha?.startsWith(esteMes));
        else if (filtroPeriodo === 'anio') filtradas = filtradas.filter(op => op.fecha?.startsWith(esteAnio));

        if (!searchTerm) return filtradas;
        return filtradas.filter(op => 
            op.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            op.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            op.entidad_referencia?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const opsFiltradas = filtrarOperaciones();

    const calcularBalance = () => {
        const ingresos = opsFiltradas.filter(op => op.tipo === 'ingreso').reduce((sum, op) => sum + Number(op.monto), 0);
        const gastos = opsFiltradas.filter(op => op.tipo === 'gasto').reduce((sum, op) => sum + Number(op.monto), 0);
        const ajustes = opsFiltradas.filter(op => op.tipo === 'ajuste').reduce((sum, op) => sum + Number(op.monto), 0);
        return ingresos - gastos + ajustes;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📜 Historial de Operaciones (Caja)">
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
                    <div style={{ flex: 1 }}>
                        <input
                            type="text"
                            placeholder="Buscar por concepto o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem',
                                borderRadius: 'var(--border-radius-md)',
                                border: '1px solid var(--border-color)'
                            }}
                        />
                    </div>
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        style={{
                            padding: '0.6rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <option value="todos">Todos los tipos</option>
                        <option value="ingreso">Solo Ingresos</option>
                        <option value="gasto">Solo Gastos</option>
                        <option value="ajuste">Solo Ajustes</option>
                    </select>
                    <select
                        value={filtroPeriodo}
                        onChange={(e) => setFiltroPeriodo(e.target.value)}
                        style={{
                            padding: '0.6rem',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <option value="total">Balance Total</option>
                        <option value="hoy">Solo Hoy</option>
                        <option value="semana">Últimos 7 días</option>
                        <option value="mes">Este Mes</option>
                        <option value="anio">Este Año</option>
                    </select>
                </div>

                <div style={{ 
                    padding: '0.6rem 1.2rem', 
                    backgroundColor: 'var(--background-gray)', 
                    borderRadius: 'var(--border-radius-md)',
                    fontWeight: '700',
                    color: calcularBalance() >= 0 ? '#16a34a' : '#dc2626'
                }}>
                    Balance: ${calcularBalance().toLocaleString()}
                </div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '60vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Fecha</th>
                            <th style={{ padding: '0.75rem' }}>Tipo</th>
                            <th style={{ padding: '0.75rem' }}>Categoría</th>
                            <th style={{ padding: '0.75rem' }}>Concepto</th>
                            <th style={{ padding: '0.75rem' }}>Monto</th>
                            <th style={{ padding: '0.75rem' }}>M. Pago</th>
                            <th style={{ padding: '0.75rem' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Cargando movimientos...</td></tr>
                        ) : opsFiltradas.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron operaciones.</td></tr>
                        ) : (
                            opsFiltradas.map(op => (
                                <tr key={op.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '0.75rem' }}>{formatDate(op.fecha)}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            backgroundColor: op.tipo === 'ingreso' ? '#dcfce7' : op.tipo === 'gasto' ? '#fee2e2' : '#fef9c3',
                                            color: op.tipo === 'ingreso' ? '#16a34a' : op.tipo === 'gasto' ? '#dc2626' : '#a16207'
                                        }}>
                                            {op.tipo.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{op.categoria}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div>{op.concepto}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                                        ${Number(op.monto).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{op.metodo_pago}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <button 
                                            onClick={() => eliminarOperacion(op.id)}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--primary-blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    cursor: 'pointer',
                    fontWeight: '500'
                }}>
                    Cerrar Historial
                </button>
            </div>
        </Modal>
    );
};

export default OperacionesListModal;
