import React, { useState } from 'react';
import ClienteFormModal from './ClienteFormModal';
import RepartoFormModal from './RepartoFormModal';
import StockFormModal from './StockFormModal';
import ZonaRepartoFormModal from './ZonaRepartoFormModal';
import VehiculoFormModal from './VehiculoFormModal';
import OperacionFormModal from './OperacionFormModal';
import UsuarioFormModal from './UsuarioFormModal';
import ResumenFormModal from './ResumenFormModal';
import DispenserFormModal from './DispenserFormModal';

const ActionButton = ({ icon, label, onClick }) => (
    <button className="action-btn" onClick={onClick}>
        <div className="action-icon">{icon}</div>
        <div className="action-label">{label}</div>
    </button>
);

const QuickActions = ({ onOpenMassiveWA, onOpenAddPedido }) => {
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isRepartoModalOpen, setIsRepartoModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isZonaModalOpen, setIsZonaModalOpen] = useState(false);
    const [isVehiculoModalOpen, setIsVehiculoModalOpen] = useState(false);
    const [isOperacionModalOpen, setIsOperacionModalOpen] = useState(false);
    const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
    const [isResumenModalOpen, setIsResumenModalOpen] = useState(false);
    const [isDispenserModalOpen, setIsDispenserModalOpen] = useState(false);

    const actions = [
        { icon: '👥', label: 'Agregar Cliente' },
        { icon: '🗺️', label: 'Agregar Reparto' },
        { icon: '📍', label: 'Agregar Zona de Reparto' },
        { icon: '🚐', label: 'Agregar Vehículo' },
        { icon: '🛒', label: 'Agregar Pedido' },
        { icon: '💵', label: 'Agregar Operación' },
        { icon: '👤', label: 'Agregar Usuario' },
        { icon: '📊', label: 'Agregar Resumen' },
        { icon: '📈', label: 'Agregar Stock' },
        { icon: '🚰', label: 'Agregar Dispenser' },
        { icon: '📢', label: 'Mensaje Masivo' },
    ];

    return (
        <div className="quick-actions">
            <h3>Acciones Rápidas</h3>
            <div className="actions-row">
                {actions.map((action, index) => {
                    let clickHandler = undefined;
                    if (action.label === 'Agregar Cliente') clickHandler = () => setIsClientModalOpen(true);
                    if (action.label === 'Agregar Reparto') clickHandler = () => setIsRepartoModalOpen(true);
                    if (action.label === 'Agregar Pedido') clickHandler = onOpenAddPedido;
                    if (action.label === 'Agregar Stock') clickHandler = () => setIsStockModalOpen(true);
                    if (action.label === 'Agregar Zona de Reparto') clickHandler = () => setIsZonaModalOpen(true);
                    if (action.label === 'Agregar Vehículo') clickHandler = () => setIsVehiculoModalOpen(true);
                    if (action.label === 'Agregar Operación') clickHandler = () => setIsOperacionModalOpen(true);
                    if (action.label === 'Agregar Usuario') clickHandler = () => setIsUsuarioModalOpen(true);
                    if (action.label === 'Agregar Resumen') clickHandler = () => setIsResumenModalOpen(true);
                    if (action.label === 'Agregar Dispenser') clickHandler = () => setIsDispenserModalOpen(true);
                    if (action.label === 'Mensaje Masivo') clickHandler = onOpenMassiveWA;

                    return (
                        <ActionButton
                            key={index}
                            icon={action.icon}
                            label={action.label}
                            onClick={clickHandler}
                        />
                    );
                })}
            </div>

            <ClienteFormModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
            />

            <RepartoFormModal
                isOpen={isRepartoModalOpen}
                onClose={() => setIsRepartoModalOpen(false)}
            />

            <StockFormModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
            />

            <ZonaRepartoFormModal
                isOpen={isZonaModalOpen}
                onClose={() => setIsZonaModalOpen(false)}
            />

            <VehiculoFormModal
                isOpen={isVehiculoModalOpen}
                onClose={() => setIsVehiculoModalOpen(false)}
            />

            <OperacionFormModal
                isOpen={isOperacionModalOpen}
                onClose={() => setIsOperacionModalOpen(false)}
            />

            <UsuarioFormModal
                isOpen={isUsuarioModalOpen}
                onClose={() => setIsUsuarioModalOpen(false)}
            />

            <ResumenFormModal
                isOpen={isResumenModalOpen}
                onClose={() => setIsResumenModalOpen(false)}
            />

            <DispenserFormModal
                isOpen={isDispenserModalOpen}
                onClose={() => setIsDispenserModalOpen(false)}
            />
        </div>
    );
};

export default QuickActions;
