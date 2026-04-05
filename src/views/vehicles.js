/**
 * Pohled na seznam vozidel
 */

import { el, list, icon, button, statusBadge, input, select } from './components.js';
import * as handlers from '../infrastructure/handlers.js';

export function renderVehiclesView(state, selectors) {
    const filteredVehicles = selectors.selectFilteredVehicles(state);
    const counts = selectors.selectVehicleCounts(state);
    const { filters } = state.ui;
    
    const header = el('div', { className: 'flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6' },
        el('div', {},
            el('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Správa vozidel'),
            el('p', { className: 'text-gray-600' }, `Celkem ${counts.total} vozidel, ${counts.available} dostupných`)
        ),
        button('Přidat vozidlo', () => handlers.onOpenModal('create-vehicle'), {
            variant: 'primary',
            icon: icon('plus', 18),
            disabled: !state.auth.isAuthenticated
        })
    );
    
    const filtersEl = el('div', { className: 'bg-white p-4 rounded-lg border border-gray-200 mb-6' },
        el('div', { className: 'flex flex-wrap gap-4' },
            el('div', { className: 'flex-1 min-w-[200px]' },
                input(null, filters.vehicles.search, (value) => {
                    handlers.onSetVehicleFilters({ search: value });
                }, { placeholder: 'Hledat vozidlo...', type: 'search' })
            ),
            el('div', { className: 'w-48' },
                select(null, filters.vehicles.status, [
                    { value: 'all', label: 'Všechny stavy' },
                    { value: 'AVAILABLE', label: 'Dostupné' },
                    { value: 'RENTED', label: 'Vypůjčeno' },
                    { value: 'MAINTENANCE', label: 'Servis' },
                    { value: 'DECOMMISSIONED', label: 'Vyřazeno' }
                ], (value) => handlers.onSetVehicleFilters({ status: value }))
            )
        )
    );
    
    const vehicleList = el('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
        list(filteredVehicles, (vehicle) => renderVehicleCard(vehicle, state), () =>
            el('div', { className: 'col-span-full text-center py-12' },
                el('p', { className: 'text-gray-500' }, 'Žádná vozidla neodpovídají filtrům')
            )
        )
    );
    
    return el('div', { className: 'space-y-6' }, header, filtersEl, vehicleList);
}

function renderVehicleCard(vehicle, state) {
    const canReserve = vehicle.status === 'AVAILABLE';
    
    return el('div', {
        className: 'bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer',
        onClick: () => handlers.onSelectVehicle(vehicle.id)
    },
        el('div', { className: 'p-4' },
            el('div', { className: 'flex items-start justify-between mb-3' },
                el('div', {},
                    el('h3', { className: 'text-lg font-semibold text-gray-900' }, 
                        `${vehicle.brand} ${vehicle.model}`
                    ),
                    el('p', { className: 'text-sm text-gray-500' }, vehicle.year)
                ),
                statusBadge(vehicle.status)
            ),
            
            el('div', { className: 'space-y-2 text-sm' },
                el('div', { className: 'flex items-center gap-2 text-gray-600' },
                    icon('key', 16),
                    vehicle.licensePlate || 'Není zadána'
                ),
                el('div', { className: 'flex items-center gap-2 text-gray-600' },
                    icon('mapPin', 16),
                    `${vehicle.mileage?.toLocaleString() || 0} km`
                ),
                el('div', { className: 'flex items-center gap-2 text-gray-600' },
                    icon('dollar', 16),
                    `${vehicle.dailyRate || 0} Kč/den`
                )
            ),
            
            vehicle.description && el('p', { 
                className: 'mt-3 text-sm text-gray-600 line-clamp-2' 
            }, vehicle.description),
            
            el('div', { className: 'mt-4 pt-4 border-t border-gray-100 flex gap-2' },
                button('Detail', (e) => {
                    e.stopPropagation();
                    handlers.onSelectVehicle(vehicle.id);
                }, { variant: 'secondary', size: 'sm' }),
                canReserve && button('Rezervovat', (e) => {
                    e.stopPropagation();
                    handlers.onOpenModal('create-reservation', { vehicleId: vehicle.id });
                }, { variant: 'primary', size: 'sm', icon: icon('plus', 14) })
            )
        )
    );
}

/**
 * Pohled na detail vozidla
 */
export function renderVehicleDetailView(state, selectors) {
    const vehicleId = state.ui.selectedVehicleId;
    const data = selectors.selectVehicleDetailData(state, vehicleId);
    
    if (!data) {
        return el('div', { className: 'text-center py-12' },
            el('p', { className: 'text-gray-500' }, 'Vozidlo nenalezeno'),
            button('Zpět na seznam', () => handlers.onNavigate('vehicles'), { 
                variant: 'secondary', 
                className: 'mt-4' 
            })
        );
    }
    
    const { vehicle, reservations, canCreateReservation } = data;
    
    const header = el('div', { className: 'flex items-center justify-between mb-6' },
        el('div', { className: 'flex items-center gap-4' },
            button('← Zpět', () => handlers.onNavigate('vehicles'), { 
                variant: 'ghost', 
                size: 'sm' 
            }),
            el('h1', { className: 'text-2xl font-bold text-gray-900' },
                `${vehicle.brand} ${vehicle.model}`
            ),
            statusBadge(vehicle.status)
        ),
        el('div', { className: 'flex gap-2' },
            canCreateReservation && button('Vytvořit rezervaci', () => {
                handlers.onOpenModal('create-reservation', { vehicleId: vehicle.id });
            }, { variant: 'primary', icon: icon('plus', 18) })
        )
    );
    
    const details = el('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6' },
        el('div', { className: 'bg-white p-6 rounded-lg border border-gray-200' },
            el('h2', { className: 'text-lg font-semibold mb-4' }, 'Informace o vozidle'),
            el('dl', { className: 'space-y-3' },
                renderDetailItem('SPZ', vehicle.licensePlate || 'Není zadána'),
                renderDetailItem('Rok výroby', vehicle.year),
                renderDetailItem('Najeto', `${vehicle.mileage?.toLocaleString() || 0} km`),
                renderDetailItem('Cena za den', `${vehicle.dailyRate || 0} Kč`),
                renderDetailItem('Popis', vehicle.description || 'Bez popisu')
            )
        ),
        
        el('div', { className: 'bg-white p-6 rounded-lg border border-gray-200' },
            el('h2', { className: 'text-lg font-semibold mb-4' }, 'Správa stavu'),
            el('div', { className: 'space-y-3' },
                renderStatusActions(vehicle, state)
            )
        )
    );
    
    const reservationsSection = el('div', { className: 'bg-white rounded-lg border border-gray-200' },
        el('div', { className: 'p-4 border-b border-gray-200' },
            el('h2', { className: 'text-lg font-semibold' }, 
                `Rezervace (${reservations.length})`
            )
        ),
        el('div', { className: 'p-4' },
            reservations.length > 0 
                ? el('div', { className: 'space-y-3' }, 
                    reservations.map(r => renderReservationItem(r))
                  )
                : el('p', { className: 'text-gray-500 text-center py-8' }, 
                    'Žádné rezervace'
                  )
        )
    );
    
    return el('div', { className: 'space-y-6' }, header, details, reservationsSection);
}

function renderDetailItem(label, value) {
    return el('div', { className: 'flex justify-between' },
        el('dt', { className: 'text-gray-600' }, label),
        el('dd', { className: 'font-medium text-gray-900' }, value)
    );
}

function renderStatusActions(vehicle, state) {
    const actions = [];
    
    // DRAFT → AVAILABLE
    if (vehicle.status === 'DRAFT') {
        actions.push(button('Aktivovat (Dostupné)', () => {
            handlers.onUpdateVehicleStatus(vehicle.id, 'AVAILABLE');
        }, { variant: 'success', className: 'w-full', disabled: !state.auth.isAuthenticated }));
    }
    
    // AVAILABLE → MAINTENANCE
    if (vehicle.status === 'AVAILABLE') {
        actions.push(button('Odeslat do servisu', () => {
            handlers.onUpdateVehicleStatus(vehicle.id, 'MAINTENANCE');
        }, { variant: 'secondary', className: 'w-full', icon: icon('tool', 16), disabled: !state.auth.isAuthenticated }));
    }
    
    // MAINTENANCE → AVAILABLE
    if (vehicle.status === 'MAINTENANCE') {
        actions.push(button('Servis dokončen', () => {
            handlers.onUpdateVehicleStatus(vehicle.id, 'AVAILABLE');
        }, { variant: 'success', className: 'w-full', disabled: !state.auth.isAuthenticated }));
    }
    
    // AVAILABLE → DECOMMISSIONED
    if (vehicle.status === 'AVAILABLE' || vehicle.status === 'MAINTENANCE') {
        actions.push(button('Vyřadit z provozu', () => {
            if (confirm('Opravdu chcete vyřadit toto vozidlo?')) {
                handlers.onUpdateVehicleStatus(vehicle.id, 'DECOMMISSIONED');
            }
        }, { variant: 'danger', className: 'w-full', disabled: !state.auth.isAuthenticated }));
    }
    
    if (actions.length === 0) {
        return el('p', { className: 'text-gray-500 text-sm' }, 
            'Pro tento stav nejsou dostupné žádné akce'
        );
    }
    
    return el('div', { className: 'space-y-2' }, ...actions);
}

function renderReservationItem(reservation) {
    const startDate = new Date(reservation.startDate).toLocaleDateString('cs-CZ');
    const endDate = new Date(reservation.endDate).toLocaleDateString('cs-CZ');
    
    return el('div', {
        className: 'flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100',
        onClick: () => handlers.onSelectReservation(reservation.id)
    },
        el('div', {},
            el('p', { className: 'font-medium' }, reservation.customerName),
            el('p', { className: 'text-sm text-gray-500' }, 
                `${startDate} - ${endDate}`
            )
        ),
        statusBadge(reservation.status)
    );
}
