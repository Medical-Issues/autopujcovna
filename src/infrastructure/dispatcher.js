/**
 * Dispatcher (IR02) - Interpretace akcí
 * Odpovědnost: Veselský Jan
 * Zajišťuje: centrální zpracování akcí, interpretaci action.type,
 *            volání business funkcí, vyvolání změn stavu
 */

import { mutate, getState } from './state.js';
import { Vehicle, VehicleStatus } from '../entities/Vehicle.js';
import { Reservation, ReservationStatus } from '../entities/Reservation.js';
import { mockApiCall } from '../api/mockApi.js';

// Registry akcí
const actionHandlers = new Map();

/**
 * Registrace handleru pro akci
 */
export function registerAction(type, handler) {
    actionHandlers.set(type, handler);
}

/**
 * Dispatch akce - centrální vstupní bod
 */
export async function dispatch(action) {
    if (!action || !action.type) {
        console.error('Invalid action:', action);
        return { success: false, error: 'Invalid action' };
    }

    console.log('[Dispatch]', action.type, action.payload);

    const handler = actionHandlers.get(action.type);
    
    if (!handler) {
        console.warn('No handler for action:', action.type);
        return { success: false, error: `No handler for action: ${action.type}` };
    }

    try {
        return await handler(action.payload, getState);
    } catch (error) {
        console.error('Error in action handler:', error);
        return { success: false, error: error.message };
    }
}

// ==================== REGISTRACE HANDLERŮ ====================

// ----- Vehicle Actions -----

registerAction('FETCH_VEHICLES', async (payload, getState) => {
    mutate({ type: 'SET_VEHICLES_LOADING', payload: true });
    
    try {
        const vehicles = await mockApiCall('GET', '/vehicles');
        mutate({ type: 'SET_VEHICLES', payload: vehicles });
        mutate({ type: 'SET_VEHICLES_LOADING', payload: false });
        return { success: true, data: vehicles };
    } catch (error) {
        mutate({ type: 'SET_VEHICLES_ERROR', payload: error.message });
        mutate({ type: 'SET_VEHICLES_LOADING', payload: false });
        return { success: false, error: error.message };
    }
});

registerAction('CREATE_VEHICLE', async (payload, getState) => {
    const vehicle = new Vehicle(payload);
    
    try {
        const saved = await mockApiCall('POST', '/vehicles', vehicle.toJSON());
        mutate({ type: 'ADD_VEHICLE', payload: saved });
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'success', message: 'Vozidlo bylo vytvořeno' }
        });
        return { success: true, data: saved };
    } catch (error) {
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'error', message: `Chyba: ${error.message}` }
        });
        return { success: false, error: error.message };
    }
});

registerAction('UPDATE_VEHICLE_STATUS', async (payload, getState) => {
    const { vehicleId, newStatus } = payload;
    const state = getState();
    // Role se bere ze stavu, ne z UI - zabránění podvržení
    const userRole = state.auth.user?.role || 'guest';
    const vehicleData = state.vehicles.byId[vehicleId];
    
    if (!vehicleData) {
        return { success: false, error: 'Vozidlo nenalezeno' };
    }
    
    const vehicle = Vehicle.fromJSON(vehicleData);
    const result = vehicle.updateStatus(newStatus, userRole);
    
    if (!result.success) {
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'error', message: result.error }
        });
        return result;
    }
    
    try {
        const saved = await mockApiCall('PUT', `/vehicles/${vehicleId}`, vehicle.toJSON());
        mutate({ type: 'UPDATE_VEHICLE', payload: saved });
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'success', message: `Stav vozidla změněn na: ${newStatus}` }
        });
        return { success: true, data: saved };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

registerAction('UPDATE_VEHICLE_MILEAGE', async (payload, getState) => {
    const { vehicleId, mileage } = payload;
    const state = getState();
    const vehicleData = state.vehicles.byId[vehicleId];
    
    if (!vehicleData) {
        return { success: false, error: 'Vozidlo nenalezeno' };
    }
    
    const vehicle = Vehicle.fromJSON(vehicleData);
    const result = vehicle.updateMileage(mileage);
    
    if (!result.success) {
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'error', message: result.error }
        });
        return result;
    }
    
    try {
        const saved = await mockApiCall('PUT', `/vehicles/${vehicleId}`, vehicle.toJSON());
        mutate({ type: 'UPDATE_VEHICLE', payload: saved });
        return { success: true, data: saved };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

registerAction('DELETE_VEHICLE', async (payload, getState) => {
    const { vehicleId } = payload;
    const state = getState();
    const vehicleData = state.vehicles.byId[vehicleId];
    
    if (!vehicleData) {
        return { success: false, error: 'Vozidlo nenalezeno' };
    }
    
    const vehicle = Vehicle.fromJSON(vehicleData);
    const check = vehicle.canDeleteOrDecommission();
    
    if (!check.success) {
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'error', message: check.error }
        });
        return check;
    }
    
    try {
        await mockApiCall('DELETE', `/vehicles/${vehicleId}`);
        mutate({ type: 'REMOVE_VEHICLE', payload: vehicleId });
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'success', message: 'Vozidlo bylo smazáno' }
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// ----- Reservation Actions -----

registerAction('FETCH_RESERVATIONS', async (payload, getState) => {
    mutate({ type: 'SET_RESERVATIONS_LOADING', payload: true });
    
    try {
        const reservations = await mockApiCall('GET', '/reservations');
        mutate({ type: 'SET_RESERVATIONS', payload: reservations });
        mutate({ type: 'SET_RESERVATIONS_LOADING', payload: false });
        return { success: true, data: reservations };
    } catch (error) {
        mutate({ type: 'SET_RESERVATIONS_ERROR', payload: error.message });
        mutate({ type: 'SET_RESERVATIONS_LOADING', payload: false });
        return { success: false, error: error.message };
    }
});

registerAction('CREATE_RESERVATION', async (payload, getState) => {
    const { vehicleId, ...reservationData } = payload;
    const state = getState();
    
    // Kontrola dostupnosti vozidla
    const vehicleData = state.vehicles.byId[vehicleId];
    if (!vehicleData) {
        return { success: false, error: 'Vozidlo nenalezeno' };
    }
    
    const vehicle = Vehicle.fromJSON(vehicleData);
    const availabilityCheck = vehicle.canCreateReservation();
    
    if (!availabilityCheck.success) {
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'error', message: availabilityCheck.error }
        });
        return availabilityCheck;
    }
    
    // Validace dat rezervace
    const result = Reservation.createReservation({
        ...reservationData,
        vehicleId,
        status: ReservationStatus.NEW
    }, vehicle);
    
    if (!result.success) {
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'error', message: result.error }
        });
        return result;
    }
    
    // Výpočet ceny
    result.reservation.calculateTotalPrice(vehicle.dailyRate);
    
    try {
        const saved = await mockApiCall('POST', '/reservations', result.reservation.toJSON());
        mutate({ type: 'ADD_RESERVATION', payload: saved });
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'success', message: 'Rezervace byla vytvořena' }
        });
        return { success: true, data: saved };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

registerAction('CONFIRM_RESERVATION', async (payload, getState) => {
    const { reservationId } = payload;
    const state = getState();
    // Role se bere ze stavu, ne z UI - zabránění podvržení
    const userRole = state.auth.user?.role || 'guest';
    const reservationData = state.reservations.byId[reservationId];
    
    if (!reservationData) {
        return { success: false, error: 'Rezervace nenalezena' };
    }
    
    const vehicleData = state.vehicles.byId[reservationData.vehicleId];
    const vehicle = vehicleData ? Vehicle.fromJSON(vehicleData) : null;
    
    const reservation = Reservation.fromJSON(reservationData);
    const result = reservation.confirm(vehicle, userRole);
    
    if (!result.success) {
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'error', message: result.error }
        });
        return result;
    }
    
    try {
        const saved = await mockApiCall('PUT', `/reservations/${reservationId}`, reservation.toJSON());
        mutate({ type: 'UPDATE_RESERVATION', payload: saved });
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'success', message: 'Rezervace byla potvrzena' }
        });
        return { success: true, data: saved };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

registerAction('ACTIVATE_RESERVATION', async (payload, getState) => {
    const { reservationId } = payload;
    const state = getState();
    // Role se bere ze stavu, ne z UI - zabránění podvržení
    const userRole = state.auth.user?.role || 'guest';
    const reservationData = state.reservations.byId[reservationId];
    
    if (!reservationData) {
        return { success: false, error: 'Rezervace nenalezena' };
    }
    
    // Připravit seznam všech rezervací pro kontrolu invariantu
    const existingReservations = Object.values(state.reservations.byId);
    
    const reservation = Reservation.fromJSON(reservationData);
    const result = reservation.confirmPickup(userRole, existingReservations);
    
    if (!result.success) {
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'error', message: result.error }
        });
        return result;
    }
    
    try {
        const saved = await mockApiCall('PUT', `/reservations/${reservationId}`, reservation.toJSON());
        mutate({ type: 'UPDATE_RESERVATION', payload: saved });
        
        // Aktualizace stavu vozidla na RENTED
        await dispatch({
            type: 'UPDATE_VEHICLE_STATUS',
            payload: {
                vehicleId: reservationData.vehicleId,
                newStatus: VehicleStatus.RENTED
            }
        });
        
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'success', message: 'Vozidlo bylo vydáno klientovi' }
        });
        return { success: true, data: saved };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

registerAction('COMPLETE_RESERVATION', async (payload, getState) => {
    const { reservationId, finalMileage } = payload;
    const state = getState();
    // Role se bere ze stavu, ne z UI - zabránění podvržení
    const userRole = state.auth.user?.role || 'guest';
    const reservationData = state.reservations.byId[reservationId];
    
    if (!reservationData) {
        return { success: false, error: 'Rezervace nenalezena' };
    }
    
    const reservation = Reservation.fromJSON(reservationData);
    const result = reservation.confirmReturn(userRole);
    
    if (!result.success) {
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'error', message: result.error }
        });
        return result;
    }
    
    try {
        const saved = await mockApiCall('PUT', `/reservations/${reservationId}`, reservation.toJSON());
        mutate({ type: 'UPDATE_RESERVATION', payload: saved });
        
        // Aktualizace stavu vozidla na AVAILABLE
        await dispatch({
            type: 'UPDATE_VEHICLE_STATUS',
            payload: {
                vehicleId: reservationData.vehicleId,
                newStatus: VehicleStatus.AVAILABLE
            }
        });
        
        // Aktualizace stavu tachometru
        if (finalMileage) {
            await dispatch({
                type: 'UPDATE_VEHICLE_MILEAGE',
                payload: {
                    vehicleId: reservationData.vehicleId,
                    mileage: finalMileage
                }
            });
        }
        
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'success', message: 'Rezervace byla dokončena, vozidlo vráceno' }
        });
        return { success: true, data: saved };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

registerAction('CANCEL_RESERVATION', async (payload, getState) => {
    const { reservationId, reason } = payload;
    const state = getState();
    // Role se bere ze stavu, ne z UI - zabránění podvržení
    const userRole = state.auth.user?.role || 'guest';
    const reservationData = state.reservations.byId[reservationId];
    
    if (!reservationData) {
        return { success: false, error: 'Rezervace nenalezena' };
    }
    
    const reservation = Reservation.fromJSON(reservationData);
    const result = reservation.cancel(userRole, reason);
    
    if (!result.success) {
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'error', message: result.error }
        });
        return result;
    }
    
    try {
        const saved = await mockApiCall('PUT', `/reservations/${reservationId}`, reservation.toJSON());
        mutate({ type: 'UPDATE_RESERVATION', payload: saved });
        mutate({ 
            type: 'ADD_NOTIFICATION', 
            payload: { type: 'success', message: 'Rezervace byla zrušena' }
        });
        return { success: true, data: saved };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// ----- UI Actions -----

registerAction('NAVIGATE', async (payload, getState) => {
    mutate({ type: 'SET_CURRENT_VIEW', payload: payload.view });
    if (payload.vehicleId !== undefined) {
        mutate({ type: 'SELECT_VEHICLE', payload: payload.vehicleId });
    }
    if (payload.reservationId !== undefined) {
        mutate({ type: 'SELECT_RESERVATION', payload: payload.reservationId });
    }
    return { success: true };
});

registerAction('OPEN_MODAL', async (payload, getState) => {
    mutate({ type: 'OPEN_MODAL', payload });
    return { success: true };
});

registerAction('CLOSE_MODAL', async (payload, getState) => {
    mutate({ type: 'CLOSE_MODAL' });
    return { success: true };
});

registerAction('REMOVE_NOTIFICATION', async (payload, getState) => {
    mutate({ type: 'REMOVE_NOTIFICATION', payload });
    return { success: true };
});

registerAction('SET_FILTERS', async (payload, getState) => {
    if (payload.type === 'vehicles') {
        mutate({ type: 'SET_VEHICLE_FILTER', payload: payload.filters });
    } else if (payload.type === 'reservations') {
        mutate({ type: 'SET_RESERVATION_FILTER', payload: payload.filters });
    }
    return { success: true };
});

// ----- Auth Actions -----

registerAction('LOGIN', async (payload, getState) => {
    mutate({ type: 'SET_AUTH_LOADING', payload: true });
    
    try {
        const result = await mockApiCall('POST', '/auth/login', payload);
        mutate({ type: 'SET_USER', payload: result.user });
        mutate({ type: 'SET_TOKEN', payload: result.token });
        mutate({ type: 'SET_AUTH_LOADING', payload: false });
        return { success: true, data: result };
    } catch (error) {
        mutate({ type: 'SET_AUTH_ERROR', payload: error.message });
        mutate({ type: 'SET_AUTH_LOADING', payload: false });
        return { success: false, error: error.message };
    }
});

registerAction('LOGOUT', async (payload, getState) => {
    mutate({ type: 'LOGOUT' });
    return { success: true };
});
