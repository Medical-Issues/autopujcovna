import { el, list, icon, button, statusBadge, input, select } from './components.js';
import * as handlers from '../infrastructure/handlers.js';

export function renderReservationsView(state, selectors) {
    const filteredReservations = selectors.selectFilteredReservations(state);
    const counts = selectors.selectReservationCounts(state);
    const { filters } = state.ui;
    
    const header = el('div', { className: 'flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6' },
        el('div', {},
            el('h1', { className: 'text-2xl font-bold text-gray-900' }, 'Správa rezervací'),
            el('p', { className: 'text-gray-600' }, 
                `${counts.total} rezervací, ${counts.active} aktivních, ${counts.confirmed} potvrzených`
            )
        )
    );
    
    const filtersEl = el('div', { className: 'bg-white p-4 rounded-lg border border-gray-200 mb-6' },
        el('div', { className: 'flex flex-wrap gap-4' },
            el('div', { className: 'flex-1 min-w-[200px]' },
                input(null, filters.reservations.search, (value) => {
                    handlers.onSetReservationFilters({ search: value });
                }, { placeholder: 'Hledat podle jména...', type: 'search' })
            ),
            el('div', { className: 'w-48' },
                select(null, filters.reservations.status, [
                    { value: 'all', label: 'Všechny stavy' },
                    { value: 'NEW', label: 'Nové' },
                    { value: 'CONFIRMED', label: 'Potvrzené' },
                    { value: 'ACTIVE', label: 'Aktivní' },
                    { value: 'COMPLETED', label: 'Dokončené' },
                    { value: 'CANCELED', label: 'Zrušené' }
                ], (value) => handlers.onSetReservationFilters({ status: value }))
            )
        )
    );
    
    const reservationList = el('div', { className: 'space-y-3' },
        list(filteredReservations, (reservation) => renderReservationRow(reservation, state), () =>
            el('div', { className: 'text-center py-12 bg-white rounded-lg border border-gray-200' },
                el('p', { className: 'text-gray-500' }, 'Žádné rezervace neodpovídají filtrům')
            )
        )
    );
    
    return el('div', { className: 'space-y-6' }, header, filtersEl, reservationList);
}

function renderReservationRow(reservation, state) {
    const startDate = new Date(reservation.startDate).toLocaleDateString('cs-CZ');
    const endDate = new Date(reservation.endDate).toLocaleDateString('cs-CZ');
    
    const statusActions = [];
    const isAuthenticated = state.auth.isAuthenticated;
    
    if (reservation.status === 'NEW') {
        statusActions.push(button('Potvrdit', (e) => {
            e.stopPropagation();
            handlers.onConfirmReservation(reservation.id);
        }, { variant: 'success', size: 'sm', disabled: !isAuthenticated }));
        statusActions.push(button('Zrušit', (e) => {
            e.stopPropagation();
            handlers.onCancelReservation(reservation.id, 'Zrušeno operátorem');
        }, { variant: 'danger', size: 'sm', disabled: !isAuthenticated }));
    }
    
    if (reservation.status === 'CONFIRMED') {
        statusActions.push(button('Vydat vozidlo', (e) => {
            e.stopPropagation();
            handlers.onActivateReservation(reservation.id);
        }, { variant: 'primary', size: 'sm', disabled: !isAuthenticated }));
    }
    
    if (reservation.status === 'ACTIVE') {
        statusActions.push(button('Přijmout vozidlo', (e) => {
            e.stopPropagation();
            handlers.onOpenModal('complete-reservation', { reservationId: reservation.id });
        }, { variant: 'success', size: 'sm', disabled: !isAuthenticated }));
    }
    
    return el('div', {
        className: 'bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer',
        onClick: () => handlers.onSelectReservation(reservation.id)
    },
        el('div', { className: 'flex flex-col md:flex-row md:items-center justify-between gap-4' },
            el('div', { className: 'flex-1' },
                el('div', { className: 'flex items-center gap-3 mb-2' },
                    el('h3', { className: 'font-semibold text-gray-900' }, 
                        reservation.customerName
                    ),
                    statusBadge(reservation.status)
                ),
                el('div', { className: 'flex flex-wrap gap-4 text-sm text-gray-600' },
                    el('span', { className: 'flex items-center gap-1' },
                        icon('car', 14),
                        `Vozidlo: ${reservation.vehicleId?.slice(0, 8)}...`
                    ),
                    el('span', { className: 'flex items-center gap-1' },
                        icon('calendar', 14),
                        `${startDate} - ${endDate}`
                    ),
                    el('span', { className: 'flex items-center gap-1' },
                        icon('dollar', 14),
                        `${reservation.totalPrice?.toLocaleString() || 0} Kč`
                    )
                )
            ),
            el('div', { className: 'flex gap-2' }, ...statusActions)
        )
    );
}

export function renderReservationDetailView(state, selectors) {
    const reservationId = state.ui.selectedReservationId;
    const data = selectors.selectReservationDetailData(state, reservationId);
    
    if (!data) {
        return el('div', { className: 'text-center py-12' },
            el('p', { className: 'text-gray-500' }, 'Rezervace nenalezena'),
            button('Zpět na seznam', () => handlers.onNavigate('reservations'), { 
                variant: 'secondary', 
                className: 'mt-4' 
            })
        );
    }
    
    const { reservation, vehicle, canCancel, canActivate, canComplete } = data;
    const isAuthenticated = state.auth.isAuthenticated;
    
    const startDate = new Date(reservation.startDate).toLocaleDateString('cs-CZ');
    const endDate = new Date(reservation.endDate).toLocaleDateString('cs-CZ');
    
    const header = el('div', { className: 'flex items-center justify-between mb-6' },
        el('div', { className: 'flex items-center gap-4' },
            button('← Zpět', () => handlers.onNavigate('reservations'), { 
                variant: 'ghost', 
                size: 'sm' 
            }),
            el('h1', { className: 'text-2xl font-bold text-gray-900' },
                `Rezervace #${reservation.id.slice(0, 8)}`
            ),
            statusBadge(reservation.status)
        ),
        el('div', { className: 'flex gap-2' },
            canActivate && isAuthenticated && button('Vydat vozidlo', () => {
                handlers.onActivateReservation(reservation.id);
            }, { variant: 'primary', icon: icon('key', 18) }),
            canComplete && isAuthenticated && button('Přijmout vozidlo', () => {
                handlers.onOpenModal('complete-reservation', { reservationId: reservation.id });
            }, { variant: 'success', icon: icon('check', 18) }),
            canCancel && isAuthenticated && button('Zrušit rezervaci', () => {
                if (confirm('Opravdu chcete zrušit tuto rezervaci?')) {
                    handlers.onCancelReservation(reservation.id, 'Zrušeno uživatelem');
                }
            }, { variant: 'danger', icon: icon('x', 18) })
        )
    );
    
    const details = el('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-6' },
        el('div', { className: 'bg-white p-6 rounded-lg border border-gray-200' },
            el('h2', { className: 'text-lg font-semibold mb-4' }, 'Informace o rezervaci'),
            el('dl', { className: 'space-y-3' },
                renderDetailItem('Zákazník', reservation.customerName),
                renderDetailItem('Email', reservation.customerEmail || 'Není uveden'),
                renderDetailItem('Období', `${startDate} - ${endDate}`),
                renderDetailItem('Celková cena', `${reservation.totalPrice?.toLocaleString() || 0} Kč`),
                reservation.actualStartDate && renderDetailItem(
                    'Skutečné vyzvednutí', 
                    new Date(reservation.actualStartDate).toLocaleString('cs-CZ')
                ),
                reservation.actualEndDate && renderDetailItem(
                    'Skutečné vrácení', 
                    new Date(reservation.actualEndDate).toLocaleString('cs-CZ')
                ),
                reservation.notes && renderDetailItem('Poznámky', reservation.notes)
            )
        ),
        
        vehicle && el('div', { className: 'bg-white p-6 rounded-lg border border-gray-200' },
            el('h2', { className: 'text-lg font-semibold mb-4' }, 'Vozidlo'),
            el('dl', { className: 'space-y-3' },
                renderDetailItem('Značka/model', `${vehicle.brand} ${vehicle.model}`),
                renderDetailItem('SPZ', vehicle.licensePlate || 'Není zadána'),
                renderDetailItem('Stav vozidla', el('span', {}, statusBadge(vehicle.status)))
            ),
            button('Zobrazit vozidlo', () => {
                handlers.onSelectVehicle(vehicle.id);
            }, { variant: 'secondary', className: 'mt-4 w-full' })
        )
    );

    const history = el('div', { className: 'bg-white rounded-lg border border-gray-200' },
        el('div', { className: 'p-4 border-b border-gray-200' },
            el('h2', { className: 'text-lg font-semibold' }, 'Historie rezervace')
        ),
        el('div', { className: 'p-4' },
            renderTimeline(reservation)
        )
    );
    
    return el('div', { className: 'space-y-6' }, header, details, history);
}

function renderDetailItem(label, value) {
    return el('div', { className: 'flex justify-between' },
        el('dt', { className: 'text-gray-600' }, label),
        el('dd', { className: 'font-medium text-gray-900' }, value)
    );
    }

function renderTimeline(reservation) {
    const timeline = [];

    timeline.push({
        status: 'NEW',
        label: 'Vytvořena',
        date: reservation.createdAt,
        active: ['NEW', 'CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(reservation.status)
    });

    if (reservation.status !== 'NEW' && reservation.status !== 'CANCELED') {
        timeline.push({
            status: 'CONFIRMED',
            label: 'Potvrzena',
            date: reservation.startDate,
            active: ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(reservation.status)
        });
    }

    if (reservation.actualStartDate || ['ACTIVE', 'COMPLETED'].includes(reservation.status)) {
        timeline.push({
            status: 'ACTIVE',
            label: 'Vyzvednuto',
            date: reservation.actualStartDate || reservation.startDate,
            active: ['ACTIVE', 'COMPLETED'].includes(reservation.status)
        });
    }

    if (reservation.status === 'COMPLETED') {
        timeline.push({
            status: 'COMPLETED',
            label: 'Vráceno',
            date: reservation.actualEndDate || reservation.endDate,
            active: true
        });
    }

    if (reservation.status === 'CANCELED') {
        timeline.push({
            status: 'CANCELED',
            label: 'Zrušena',
            date: reservation.updatedAt,
            active: true
        });
    }
    
    return el('div', { className: 'space-y-4' },
        timeline.map((item, index) => el('div', {
            className: `flex items-center gap-4 ${item.active ? 'opacity-100' : 'opacity-50'}`
        },
            el('div', {
                className: `w-8 h-8 rounded-full flex items-center justify-center ${
                    item.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`
            }, index + 1),
            el('div', {},
                el('p', { className: 'font-medium' }, item.label),
                el('p', { className: 'text-sm text-gray-500' },
                    new Date(item.date).toLocaleString('cs-CZ')
                )
            )
        ))
    );
}
