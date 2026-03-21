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

const StatCards = ({ onOpenClientes, onOpenVehiculos, onOpenZonas, onOpenUsuarios, onOpenPendientes, onOpenDispensers }) => {
    const [stats, setStats] = useState({
        pedidosPendientes: 0,
        clientesRegistrados: 0,
        vehiculosRegistrados: 0,
        zonasRegistradas: 0,
        usuariosRegistrados: 0,
        ingresoDia: 0,
        dispensersTotal: 0,
        dispensersInstalados: 0
    });

    useEffect(() => {
        const calcularStats = async () => {
            try {
                const hoy = new Date().toISOString().split('T')[0];
                
                const [
                    { data: pedidos },
                    { count: clientes },
                    { count: vehiculos },
                    { count: zonas },
                    { data: dispensers }
                ] = await Promise.all([
                    supabase.from('pedidos').select('total, fecha, estado, pago_estado'),
                    supabase.from('clientes').select('*', { count: 'exact', head: true }),
                    supabase.from('vehiculos').select('*', { count: 'exact', head: true }),
                    supabase.from('zonas_reparto').select('*', { count: 'exact', head: true }),
                    supabase.from('dispensers').select('estado')
                ]);

                // Cálculo de ingresos hoy
                const income = pedidos
                    ?.filter(o => o.fecha === hoy && o.estado !== 'Anulado')
                    .reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

                // Cálculo de pedidos pendientes (No entregados O No pagados)
                const pendientes = pedidos
                    ?.filter(o => 
                        (o.estado?.toLowerCase() === 'pendiente') || 
                        (o.pago_estado?.toLowerCase() === 'pendiente')
                    ).length || 0;

                // Cálculo de dispensers
                const totalDispensers = dispensers?.length || 0;
                const instalados = dispensers?.filter(d => d.estado === 'instalado').length || 0;

                setStats({
                    pedidosPendientes: pendientes,
                    clientesRegistrados: clientes || 0,
                    vehiculosRegistrados: vehiculos || 0,
                    zonasRegistradas: zonas || 0,
                    usuariosRegistrados: 1,
                    ingresoDia: income,
                    dispensersTotal: totalDispensers,
                    dispensersInstalados: instalados
                });
            } catch (error) {
                console.error("Error al calcular estadísticas:", error);
            }
        };

        calcularStats();
        const interval = setInterval(calcularStats, 15000); // 15 segundos
        return () => clearInterval(interval);
    }, []);

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
