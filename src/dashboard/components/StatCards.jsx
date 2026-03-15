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

const StatCards = ({ onOpenClientes, onOpenVehiculos, onOpenZonas, onOpenUsuarios }) => {
    const [stats, setStats] = useState({
        pedidosPendientes: 0,
        clientesRegistrados: 0,
        vehiculosRegistrados: 0,
        zonasRegistradas: 0,
        usuariosRegistrados: 0,
        ingresoDia: 0
    });

    useEffect(() => {
        const calcularStats = async () => {
            try {
                const hoy = new Date().toISOString().split('T')[0];
                
                // Realizamos consultas en paralelo para mejor rendimiento
                const [
                    { count: pendientes },
                    { count: clientes },
                    { count: vehiculos },
                    { count: zonas },
                    { data: pedidosHoy }
                ] = await Promise.all([
                    supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'Pendiente'),
                    supabase.from('clientes').select('*', { count: 'exact', head: true }),
                    supabase.from('vehiculos').select('*', { count: 'exact', head: true }),
                    supabase.from('zonas_reparto').select('*', { count: 'exact', head: true }),
                    supabase.from('pedidos').select('total').eq('fecha', hoy).neq('estado', 'Anulado')
                ]);

                const income = pedidosHoy?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

                setStats({
                    pedidosPendientes: pendientes || 0,
                    clientesRegistrados: clientes || 0,
                    vehiculosRegistrados: vehiculos || 0,
                    zonasRegistradas: zonas || 0,
                    usuariosRegistrados: 1, // Por ahora el admin actual
                    ingresoDia: income
                });
            } catch (error) {
                console.error("Error al calcular estadísticas:", error);
            }
        };

        calcularStats();
        const interval = setInterval(calcularStats, 10000); // 10 segundos
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="stats-grid">
            <StatCard
                title="Pedidos Pendientes"
                value={stats.pedidosPendientes}
                colorClass="dark-blue"
                linkLabel={`Ingresos Hoy: $${stats.ingresoDia.toFixed(0)}`}
                onClick={() => { }}
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
                title="Vehículos"
                value={stats.vehiculosRegistrados}
                colorClass="light-blue"
                linkLabel="Gestionar Lista"
                onClick={onOpenVehiculos}
            />
            <StatCard
                title="Zonas de Reparto"
                value={stats.zonasRegistradas}
                colorClass="dark-blue"
                linkLabel="Ver Mapa/Lista"
                onClick={onOpenZonas}
            />
        </div>
    );
};

export default StatCards;
