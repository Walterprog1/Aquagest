import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const StatCard = ({ title, value, colorClass, linkLabel, onClick, onSecondaryClick, secondaryLinkLabel }) => (
    <div className={`stat-card ${colorClass}`} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <div className="stat-content">
            <h3 className="stat-title">{title}</h3>
            <div className="stat-value">{value}</div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                {linkLabel && (
                    <span
                        className="stat-link"
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        style={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', textDecoration: 'underline' }}
                    >
                        {linkLabel}
                    </span>
                )}
                {secondaryLinkLabel && (
                    <span
                        className="stat-link"
                        onClick={(e) => { e.stopPropagation(); onSecondaryClick(); }}
                        style={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', opacity: 0.8, textDecoration: 'underline' }}
                    >
                        {secondaryLinkLabel}
                    </span>
                )}
            </div>
        </div>
        <div className="stat-icon-bg"></div>
    </div>
);

const StatCards = ({ onOpenClientes, onOpenVehiculos, onOpenZonas, onOpenUsuarios, onOpenPendientes, onOpenDispensers, onOpenOperaciones }) => {
    const [filtroPeriodo, setFiltroPeriodo] = useState('total');
    const [stats, setStats] = useState({
        pedidosPendientes: 0,
        clientesRegistrados: 0,
        vehiculosRegistrados: 0,
        zonasRegistradas: 0,
        usuariosRegistrados: 0,
        ingresoDia: 0,
        dispensersTotal: 0,
        dispensersInstalados: 0,
        balanceCaja: 0
    });

    useEffect(() => {
        const calcularStats = async () => {
            try {
                const hoy = new Date().toISOString().split('T')[0];
                
                // Cálculo de límites de fechas
                const fechaActual = new Date();
                const hace7Dias = new Date();
                hace7Dias.setDate(fechaActual.getDate() - 7);
                const isoHace7Dias = hace7Dias.toISOString().split('T')[0];
                
                const esteMes = hoy.substring(0, 7); // YYYY-MM
                const esteAnio = hoy.substring(0, 4); // YYYY

                const [
                    { data: pedidos },
                    { count: clientes },
                    { count: vehiculos },
                    { count: zonas },
                    { data: dispensers },
                    { data: operaciones }
                ] = await Promise.all([
                    supabase.from('pedidos').select('total, fecha, estado, pago_estado'),
                    supabase.from('clientes').select('*', { count: 'exact', head: true }),
                    supabase.from('vehiculos').select('*', { count: 'exact', head: true }),
                    supabase.from('zonas_reparto').select('*', { count: 'exact', head: true }),
                    supabase.from('dispensers').select('estado'),
                    supabase.from('operaciones').select('tipo, monto, fecha')
                ]);

                // Cálculo de ingresos hoy (para la tarjeta de gestión si fuera necesario, pero la usamos para pedidos)
                const income = pedidos
                    ?.filter(o => o.fecha === hoy && o.estado !== 'Anulado')
                    .reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

                // Cálculo de pedidos pendientes
                const pendientes = pedidos
                    ?.filter(o => 
                        (o.estado?.toLowerCase() === 'pendiente') || 
                        (o.pago_estado?.toLowerCase() === 'pendiente')
                    ).length || 0;

                // Cálculo de dispensers
                const totalDispensers = dispensers?.length || 0;
                const instalados = dispensers?.filter(d => d.estado === 'instalado').length || 0;

                // Cálculo de balance de caja filtrado por período
                const balance = (operaciones || []).reduce((acc, op) => {
                    const monto = Number(op.monto) || 0;
                    const fechaOp = op.fecha;
                    
                    // Aplicar filtro de período
                    let cumpleFiltro = true;
                    if (filtroPeriodo === 'hoy') cumpleFiltro = (fechaOp === hoy);
                    else if (filtroPeriodo === 'semana') cumpleFiltro = (fechaOp >= isoHace7Dias);
                    else if (filtroPeriodo === 'mes') cumpleFiltro = (fechaOp && fechaOp.startsWith(esteMes));
                    else if (filtroPeriodo === 'anio') cumpleFiltro = (fechaOp && fechaOp.startsWith(esteAnio));

                    if (!cumpleFiltro) return acc;

                    if (op.tipo === 'ingreso') return acc + monto;
                    if (op.tipo === 'gasto') return acc - monto;
                    if (op.tipo === 'ajuste') return acc + monto;
                    return acc;
                }, 0);

                setStats({
                    pedidosPendientes: pendientes,
                    clientesRegistrados: clientes || 0,
                    vehiculosRegistrados: vehiculos || 0,
                    zonasRegistradas: zonas || 0,
                    usuariosRegistrados: 1,
                    ingresoDia: income,
                    dispensersTotal: totalDispensers,
                    dispensersInstalados: instalados,
                    balanceCaja: balance
                });
            } catch (error) {
                console.error("Error al calcular estadísticas:", error);
            }
        };

        calcularStats();
        const interval = setInterval(calcularStats, 15000);
        return () => clearInterval(interval);
    }, [filtroPeriodo]);

    return (
        <div className="stats-grid">
            <StatCard
                title="Gestión de Pedidos"
                value={stats.pedidosPendientes}
                colorClass="dark-blue"
                linkLabel="Ver Listado Integral"
                onClick={onOpenPendientes}
            />
            <StatCard
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>Caja y Movimientos</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {['hoy', 'semana', 'mes', 'anio', 'total'].map(p => (
                                <button
                                    key={p}
                                    onClick={(e) => { e.stopPropagation(); setFiltroPeriodo(p); }}
                                    style={{
                                        padding: '2px 6px',
                                        fontSize: '0.65rem',
                                        borderRadius: '4px',
                                        border: 'none',
                                        backgroundColor: filtroPeriodo === p ? 'rgba(255,255,255,0.3)' : 'transparent',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {p.charAt(0)}
                                </button>
                            ))}
                        </div>
                    </div>
                }
                value={`$${stats.balanceCaja.toLocaleString()}`}
                colorClass={stats.balanceCaja >= 0 ? "green" : "red"}
                linkLabel="Ver historial de caja"
                onClick={onOpenOperaciones}
            />
            <StatCard
                title="Clientes y Staff"
                value={`${stats.clientesRegistrados} / ${stats.usuariosRegistrados}`}
                colorClass="orange"
                linkLabel="Clientes"
                onClick={onOpenClientes}
                secondaryLinkLabel="Staff/Usuarios"
                onSecondaryClick={onOpenUsuarios}
            />
            <StatCard
                title="Dispensers F/C"
                value={`${stats.dispensersInstalados} / ${stats.dispensersTotal}`}
                colorClass="light-blue"
                linkLabel="Control y Registro"
                onClick={onOpenDispensers}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <StatCard
                    title="Vehículos"
                    value={stats.vehiculosRegistrados}
                    colorClass="light-blue"
                    linkLabel="Lista"
                    onClick={onOpenVehiculos}
                />
                <StatCard
                    title="Zonas"
                    value={stats.zonasRegistradas}
                    colorClass="dark-blue"
                    linkLabel="Lista"
                    onClick={onOpenZonas}
                />
            </div>
        </div>
    );
};

export default StatCards;
