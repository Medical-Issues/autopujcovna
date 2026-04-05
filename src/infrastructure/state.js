/**
 * State Management (IR01) - Správa stavu aplikace
 * Odpovědnost: Veselský Jan
 * Zajišťuje: návrh globálního stavu, inicializaci, oddělení doménových/technických dat, řízené aktualizace
 */

import { Vehicle } from '../entities/Vehicle.js';
import { Reservation } from '../entities/Reservation.js';

// Počáteční stav aplikace
export const initialState = {
    // Doménová data
    vehicles: {
        byId: {},
        allIds: [],
        loading: false,
        error: null
    },
    reservations: {
        byId: {},
        allIds: [],
        loading: false,
        error: null
    },
    
    // UI stav
    ui: {
        currentView: 'vehicles', // 'vehicles', 'reservations', 'vehicle-detail', 'reservation-detail'
        selectedVehicleId: null,
        selectedReservationId: null,
        modal: {
            isOpen: false,
            type: null, // 'create-vehicle', 'edit-vehicle', 'create-reservation', 'edit-reservation'
            data: null
        },
        notifications: [],
        filters: {
            vehicles: {
                status: 'all',
                search: ''
            },
            reservations: {
                status: 'all',
                search: ''
            }
        }
    },
    
    // Autentizace
    auth: {
        user: null,
        isAuthenticated: false,
        token: null,
        loading: false,
        error: null
    }
};

// Aktuální stav aplikace
let currentState = JSON.parse(JSON.stringify(initialState));

// Subscribers pro notifikace o změnách
const subscribers = new Set();

/**
 * Získání aktuálního stavu
 * Vrací immutable kopii stavu
 */
export function getState() {
    return JSON.parse(JSON.stringify(currentState));
}

/**
 * Registrace subscribera pro změny stavu
 */
export function subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
}

/**
 * Notifikace všech subscriberů o změně stavu
 */
function notifySubscribers(oldState, newState, mutation) {
    subscribers.forEach(callback => {
        try {
            callback(newState, oldState, mutation);
        } catch (error) {
            console.error('Error in state subscriber:', error);
        }
    });
}

/**
 * Mutace stavu - jediný způsob, jak měnit stav
 * Invariant: Žádná přímá mutace stavu mimo dispatcher
 */
export function mutate(mutation) {
    const oldState = getState();
    
    switch (mutation.type) {
        // Vehicle mutations
        case 'SET_VEHICLES':
            currentState.vehicles.byId = mutation.payload.reduce((acc, v) => {
                acc[v.id] = v instanceof Vehicle ? v.toJSON() : v;
                return acc;
            }, {});
            currentState.vehicles.allIds = mutation.payload.map(v => v.id || v);
            break;
            
        case 'ADD_VEHICLE':
            const vehicleData = mutation.payload instanceof Vehicle 
                ? mutation.payload.toJSON() 
                : mutation.payload;
            currentState.vehicles.byId[vehicleData.id] = vehicleData;
            if (!currentState.vehicles.allIds.includes(vehicleData.id)) {
                currentState.vehicles.allIds.push(vehicleData.id);
            }
            break;
            
        case 'UPDATE_VEHICLE':
            const updateData = mutation.payload instanceof Vehicle 
                ? mutation.payload.toJSON() 
                : mutation.payload;
            if (currentState.vehicles.byId[updateData.id]) {
                currentState.vehicles.byId[updateData.id] = {
                    ...currentState.vehicles.byId[updateData.id],
                    ...updateData,
                    updatedAt: new Date().toISOString()
                };
            }
            break;
            
        case 'REMOVE_VEHICLE':
            delete currentState.vehicles.byId[mutation.payload];
            currentState.vehicles.allIds = currentState.vehicles.allIds.filter(
                id => id !== mutation.payload
            );
            break;
            
        case 'SET_VEHICLES_LOADING':
            currentState.vehicles.loading = mutation.payload;
            break;
            
        case 'SET_VEHICLES_ERROR':
            currentState.vehicles.error = mutation.payload;
            break;
            
        // Reservation mutations
        case 'SET_RESERVATIONS':
            currentState.reservations.byId = mutation.payload.reduce((acc, r) => {
                acc[r.id] = r instanceof Reservation ? r.toJSON() : r;
                return acc;
            }, {});
            currentState.reservations.allIds = mutation.payload.map(r => r.id || r);
            break;
            
        case 'ADD_RESERVATION':
            const reservationData = mutation.payload instanceof Reservation 
                ? mutation.payload.toJSON() 
                : mutation.payload;
            currentState.reservations.byId[reservationData.id] = reservationData;
            if (!currentState.reservations.allIds.includes(reservationData.id)) {
                currentState.reservations.allIds.push(reservationData.id);
            }
            break;
            
        case 'UPDATE_RESERVATION':
            const resUpdateData = mutation.payload instanceof Reservation 
                ? mutation.payload.toJSON() 
                : mutation.payload;
            if (currentState.reservations.byId[resUpdateData.id]) {
                currentState.reservations.byId[resUpdateData.id] = {
                    ...currentState.reservations.byId[resUpdateData.id],
                    ...resUpdateData,
                    updatedAt: new Date().toISOString()
                };
            }
            break;
            
        case 'REMOVE_RESERVATION':
            delete currentState.reservations.byId[mutation.payload];
            currentState.reservations.allIds = currentState.reservations.allIds.filter(
                id => id !== mutation.payload
            );
            break;
            
        case 'SET_RESERVATIONS_LOADING':
            currentState.reservations.loading = mutation.payload;
            break;
            
        case 'SET_RESERVATIONS_ERROR':
            currentState.reservations.error = mutation.payload;
            break;
            
        // UI mutations
        case 'SET_CURRENT_VIEW':
            currentState.ui.currentView = mutation.payload;
            break;
            
        case 'SELECT_VEHICLE':
            currentState.ui.selectedVehicleId = mutation.payload;
            break;
            
        case 'SELECT_RESERVATION':
            currentState.ui.selectedReservationId = mutation.payload;
            break;
            
        case 'OPEN_MODAL':
            currentState.ui.modal = {
                isOpen: true,
                type: mutation.payload.type,
                data: mutation.payload.data || null
            };
            break;
            
        case 'CLOSE_MODAL':
            currentState.ui.modal = {
                isOpen: false,
                type: null,
                data: null
            };
            break;
            
        case 'ADD_NOTIFICATION':
            currentState.ui.notifications.push({
                id: crypto.randomUUID(),
                ...mutation.payload,
                timestamp: new Date().toISOString()
            });
            break;
            
        case 'REMOVE_NOTIFICATION':
            currentState.ui.notifications = currentState.ui.notifications.filter(
                n => n.id !== mutation.payload
            );
            break;
            
        case 'SET_VEHICLE_FILTER':
            currentState.ui.filters.vehicles = {
                ...currentState.ui.filters.vehicles,
                ...mutation.payload
            };
            break;
            
        case 'SET_RESERVATION_FILTER':
            currentState.ui.filters.reservations = {
                ...currentState.ui.filters.reservations,
                ...mutation.payload
            };
            break;
            
        // Auth mutations
        case 'SET_USER':
            currentState.auth.user = mutation.payload;
            currentState.auth.isAuthenticated = !!mutation.payload;
            break;
            
        case 'SET_TOKEN':
            currentState.auth.token = mutation.payload;
            break;
            
        case 'SET_AUTH_LOADING':
            currentState.auth.loading = mutation.payload;
            break;
            
        case 'SET_AUTH_ERROR':
            currentState.auth.error = mutation.payload;
            break;
            
        case 'LOGOUT':
            currentState.auth = {
                user: null,
                isAuthenticated: false,
                token: null,
                loading: false,
                error: null
            };
            break;
            
        case 'RESET_STATE':
            currentState = JSON.parse(JSON.stringify(initialState));
            break;
            
        default:
            console.warn('Unknown mutation type:', mutation.type);
            return false;
    }
    
    // Notifikace subscriberů
    notifySubscribers(oldState, getState(), mutation);
    
    return true;
}

/**
 * Reset stavu na počáteční hodnoty
 */
export function resetState() {
    mutate({ type: 'RESET_STATE' });
}

/**
 * Helper pro sériové mutace
 */
export function batchMutations(mutations) {
    const oldState = getState();
    
    mutations.forEach(mutation => {
        mutate(mutation);
    });
    
    // Jedna notifikace po všech mutacích
    notifySubscribers(oldState, getState(), { type: 'BATCH', mutations });
}
