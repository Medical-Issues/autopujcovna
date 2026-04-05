/**
 * Modalní okna a formuláře
 */

import { el, button, input, select } from './components.js';
import * as handlers from '../infrastructure/handlers.js';

/**
 * Render modal podle typu
 */
export function renderModal(state, _selectors) {
    const { modal } = state.ui;
    
    if (!modal.isOpen) return null;
    
    let content;
    switch (modal.type) {
        case 'create-vehicle':
            content = renderCreateVehicleModal();
            break;
        case 'create-reservation':
            content = renderCreateReservationModal(state, modal.data);
            break;
        case 'complete-reservation':
            content = renderCompleteReservationModal(state, modal.data);
            break;
        default:
            content = el('p', {}, 'Neznámý typ modalu');
    }
    
    return el('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
    },
        el('div', {
            className: 'bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto'
        },
            el('div', { className: 'p-6' }, content)
        )
    );
}

function renderCreateVehicleModal() {
    const formData = {};
    
    const form = el('form', {
        className: 'space-y-4',
        onSubmit: (e) => {
            e.preventDefault();
            handlers.onCreateVehicle(formData).then(result => {
                if (result.success) {
                    handlers.onCloseModal();
                }
            });
        }
    },
        el('h2', { className: 'text-xl font-bold mb-4' }, 'Nové vozidlo'),
        
        input('Značka', '', (v) => formData.brand = v, { required: true }),
        input('Model', '', (v) => formData.model = v, { required: true }),
        input('Rok výroby', new Date().getFullYear(), (v) => formData.year = parseInt(v), { 
            type: 'number', 
            min: 1900, 
            max: new Date().getFullYear() + 1 
        }),
        input('SPZ', '', (v) => formData.licensePlate = v),
        input('Stav tachometru (km)', 0, (v) => formData.mileage = parseInt(v) || 0, { 
            type: 'number', 
            min: 0 
        }),
        input('Cena za den (Kč)', '', (v) => formData.dailyRate = parseInt(v) || 0, { 
            type: 'number', 
            min: 0,
            required: true
        }),
        input('Popis', '', (v) => formData.description = v, { 
            placeholder: 'Volitelný popis vozidla...'
        }),
        
        el('div', { className: 'flex gap-3 pt-4' },
            button('Vytvořit', null, { 
                variant: 'primary', 
                className: 'flex-1',
                type: 'submit'
            }),
            button('Zrušit', () => handlers.onCloseModal(), { 
                variant: 'secondary', 
                className: 'flex-1' 
            })
        )
    );
    
    return form;
}

function renderCreateReservationModal(state, data) {
    const formData = {
        vehicleId: data?.vehicleId || null,
        startDate: '',
        endDate: '',
        customerName: '',
        customerEmail: '',
        notes: ''
    };
    
    const vehicles = state.vehicles.allIds
        .map(id => state.vehicles.byId[id])
        .filter(v => v.status === 'AVAILABLE')
        .map(v => ({
            value: v.id,
            label: `${v.brand} ${v.model} (${v.licensePlate || 'bez SPZ'})`
        }));
    
    const form = el('form', {
        className: 'space-y-4',
        onSubmit: (e) => {
            e.preventDefault();
            handlers.onCreateReservation(formData).then(result => {
                if (result.success) {
                    handlers.onCloseModal();
                }
            });
        }
    },
        el('h2', { className: 'text-xl font-bold mb-4' }, 'Nová rezervace'),
        
        vehicles.length > 0 
            ? select('Vozidlo', formData.vehicleId, vehicles, (v) => formData.vehicleId = v, { required: true })
            : el('p', { className: 'text-red-600' }, 'Žádná dostupná vozidla'),
        
        input('Datum vyzvednutí', '', (v) => formData.startDate = v, { 
            type: 'datetime-local', 
            required: true 
        }),
        input('Datum vrácení', '', (v) => formData.endDate = v, { 
            type: 'datetime-local', 
            required: true 
        }),
        input('Jméno zákazníka', '', (v) => formData.customerName = v, { required: true }),
        input('Email zákazníka', '', (v) => formData.customerEmail = v, { type: 'email' }),
        input('Poznámky', '', (v) => formData.notes = v),
        
        el('div', { className: 'flex gap-3 pt-4' },
            button('Vytvořit', null, { 
                variant: 'primary', 
                className: 'flex-1',
                type: 'submit',
                disabled: vehicles.length === 0
            }),
            button('Zrušit', () => handlers.onCloseModal(), { 
                variant: 'secondary', 
                className: 'flex-1' 
            })
        )
    );
    
    return form;
}

function renderCompleteReservationModal(state, data) {
    const reservationId = data?.reservationId;
    const reservation = state.reservations.byId[reservationId];
    
    if (!reservation) {
        return el('div', { className: 'p-6' },
            el('p', { className: 'text-red-600' }, 'Rezervace nenalezena'),
            button('Zavřít', () => handlers.onCloseModal(), { variant: 'secondary', className: 'mt-4' })
        );
    }
    
    const vehicle = state.vehicles.byId[reservation.vehicleId];
    
    const formData = {
        finalMileage: vehicle?.mileage || 0,
        notes: ''
    };
    
    const form = el('form', {
        className: 'space-y-4',
        onSubmit: (e) => {
            e.preventDefault();
            handlers.onCompleteReservation(reservationId, 'admin', formData.finalMileage).then(result => {
                if (result.success) {
                    handlers.onCloseModal();
                }
            });
        }
    },
        el('h2', { className: 'text-xl font-bold mb-4' }, 'Dokončení rezervace'),
        
        el('p', { className: 'text-gray-600 mb-4' },
            `Rezervace #${reservationId?.slice(0, 8)}... - ${reservation?.customerName}`
        ),
        
        vehicle && el('p', { className: 'text-sm text-gray-500 mb-4' },
            `Aktuální stav tachometru: ${vehicle.mileage?.toLocaleString()} km`
        ),
        
        input('Konečný stav tachometru (km)', formData.finalMileage, (v) => {
            formData.finalMileage = parseInt(v) || 0;
        }, { 
            type: 'number', 
            min: vehicle?.mileage || 0,
            required: true
        }),
        
        input('Poznámky k vrácení', '', (v) => formData.notes = v, {
            placeholder: 'Stav vozidla, případné poškození...'
        }),
        
        el('div', { className: 'flex gap-3 pt-4' },
            button('Dokončit', null, { 
                variant: 'success', 
                className: 'flex-1',
                type: 'submit'
            }),
            button('Zrušit', () => handlers.onCloseModal(), { 
                variant: 'secondary', 
                className: 'flex-1' 
            })
        )
    );
    
    return form;
}
