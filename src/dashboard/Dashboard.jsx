import React from 'react';
import Header from './components/Header';
import MigrationTool from './components/MigrationTool';
import StatCards from './components/StatCards';
import QuickActions from './components/QuickActions';
import TodayDeliveries from './components/TodayDeliveries';
import OrdersTable from './components/OrdersTable';
import MapWidget from './components/MapWidget';
import ClientesListModal from './components/ClientesListModal';
import VehiculosListModal from './components/VehiculosListModal';
import ZonasListModal from './components/ZonasListModal';
import UsuariosListModal from './components/UsuariosListModal';
import PedidoFormModal from './components/PedidoFormModal';
import DispensersListModal from './components/DispensersListModal';
import OperacionesListModal from './components/OperacionesListModal';
import WhatsappMassiveModal from './components/WhatsappMassiveModal';
import PedidosListModal from './components/PedidosListModal';
import RepartosListModal from './components/RepartosListModal';
import ResumenRepartoModal from './components/ResumenRepartoModal';

const Dashboard = ({ user, onLogout }) => {
    const [showClientes, setShowClientes] = React.useState(false);
    const [showVehiculos, setShowVehiculos] = React.useState(false);
    const [showZonas, setShowZonas] = React.useState(false);
    const [showUsuarios, setShowUsuarios] = React.useState(false);
    const [showDispensers, setShowDispensers] = React.useState(false);
    const [showOperaciones, setShowOperaciones] = React.useState(false);
    const [showMassiveWA, setShowMassiveWA] = React.useState(false);
    const [showPedidos, setShowPedidos] = React.useState(false);
    const [showRepartos, setShowRepartos] = React.useState(false);
    const [showAlquileres, setShowAlquileres] = React.useState(false);
    
    // Modal de Resumen Detallado de un Reparto
    const [repartoEnDetalle, setRepartoEnDetalle] = React.useState(null);

    // Modal de Edición/Creación de Pedidos
    const [isPedidoModalOpen, setIsPedidoModalOpen] = React.useState(false);
    const [pedidoAEditar, setPedidoAEditar] = React.useState(null);

    const openAddPedido = () => {
        setPedidoAEditar(null);
        setIsPedidoModalOpen(true);
    };

    const openEditPedido = (pedido) => {
        setPedidoAEditar(pedido);
        setIsPedidoModalOpen(true);
    };

    return (
        <div className="dashboard-container">
            <Header user={user} onLogout={onLogout} />

            <main className="content">
                <h1 className="page-title">
                    <span>📦</span> Escritorio
                </h1>

                <MigrationTool user={user} />

                <StatCards
                    onOpenClientes={() => setShowClientes(true)}
                    onOpenVehiculos={() => setShowVehiculos(true)}
                    onOpenZonas={() => setShowZonas(true)}
                    onOpenUsuarios={() => setShowUsuarios(true)}
                    onOpenPendientes={() => setShowPedidos(true)}
                    onOpenDispensers={() => setShowDispensers(true)}
                    onOpenOperaciones={() => setShowOperaciones(true)}
                    onOpenAlquileres={() => setShowAlquileres(true)}
                />

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <button style={{
                        padding: '0.5rem 2rem',
                        backgroundColor: '#356bd6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                    }}>
                        Ver todas las estadísticas &gt;
                    </button>
                </div>

                <QuickActions 
                    onOpenMassiveWA={() => setShowMassiveWA(true)} 
                    onOpenAddPedido={openAddPedido}
                    onOpenAlquileres={() => setShowAlquileres(true)}
                />

                <div className="dashboard-grid">
                    <TodayDeliveries 
                        onOpenHistory={() => setShowRepartos(true)} 
                        onOpenResumen={(r) => setRepartoEnDetalle(r)}
                    />
                    <OrdersTable onOpenEditPedido={openEditPedido} />
                    <MapWidget />
                </div>
            </main>

            <ClientesListModal
                isOpen={showClientes}
                onClose={() => setShowClientes(false)}
            />
            <VehiculosListModal
                isOpen={showVehiculos}
                onClose={() => setShowVehiculos(false)}
            />
            <ZonasListModal
                isOpen={showZonas}
                onClose={() => setShowZonas(false)}
            />
            <UsuariosListModal
                isOpen={showUsuarios}
                onClose={() => setShowUsuarios(false)}
            />
            <DispensersListModal
                isOpen={showDispensers}
                onClose={() => setShowDispensers(false)}
            />
            <OperacionesListModal
                isOpen={showOperaciones}
                onClose={() => setShowOperaciones(false)}
            />
            <WhatsappMassiveModal
                isOpen={showMassiveWA}
                onClose={() => setShowMassiveWA(false)}
            />
            <PedidosListModal 
                isOpen={showPedidos}
                onClose={() => setShowPedidos(false)}
                onOpenEditPedido={openEditPedido}
            />
            <RepartosListModal
                isOpen={showRepartos}
                onClose={() => setShowRepartos(false)}
                onOpenResumen={(r) => setRepartoEnDetalle(r)}
            />
            <ResumenRepartoModal
                isOpen={!!repartoEnDetalle}
                onClose={() => setRepartoEnDetalle(null)}
                reparto={repartoEnDetalle}
            />
            <PedidoFormModal
                key={pedidoAEditar ? `edit-${pedidoAEditar.id}` : 'new-pedido'}
                isOpen={isPedidoModalOpen}
                onClose={() => {
                    setIsPedidoModalOpen(false);
                    setPedidoAEditar(null);
                }}
                pedidoAEditar={pedidoAEditar}
            />
            <AlquileresListModal
                isOpen={showAlquileres}
                onClose={() => setShowAlquileres(false)}
            />
        </div>
    );
};

export default Dashboard;
