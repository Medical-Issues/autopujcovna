/**
 * Handlery a vazba UI → akce (IR07)
 * Odpovědnost: Málek Jan
 * Zajišťuje: definici handlerů (onReserve, onCancel), mapování interakcí na dispatch(action),
 *            izolaci UI od business logiky
 * Invariant: Žádná přímá mutace stavu z UI, žádná autorizace v UI
 */

import { dispatch } from './dispatcher.js';

// ----- Vehicle Handlers -----

export function onCreateVehicle(vehicleData) {
    return dispatch({
        type: 'CREATE_VEHICLE',
        payload: vehicleData
    });
}

export function onUpdateVehicleStatus(vehicleId, newStatus) {
    return dispatch({
        type: 'UPDATE_VEHICLE_STATUS',
        payload: { vehicleId, newStatus }
    });
}

export function onUpdateVehicleMileage(vehicleId, mileage) {
    return dispatch({
        type: 'UPDATE_VEHICLE_MILEAGE',
        payload: { vehicleId, mileage }
    });
}

export function onDeleteVehicle(vehicleId) {
    return dispatch({
        type: 'DELETE_VEHICLE',
        payload: { vehicleId }
    });
}

// ----- Reservation Handlers -----

export function onCreateReservation(reservationData) {
    return dispatch({
        type: 'CREATE_RESERVATION',
        payload: reservationData
    });
}

export function onConfirmReservation(reservationId) {
    return dispatch({
        type: 'CONFIRM_RESERVATION',
        payload: { reservationId }
    });
}

export function onActivateReservation(reservationId) {
    return dispatch({
        type: 'ACTIVATE_RESERVATION',
        payload: { reservationId }
    });
}

export function onCompleteReservation(reservationId, finalMileage) {
    return dispatch({
        type: 'COMPLETE_RESERVATION',
        payload: { reservationId, finalMileage }
    });
}

export function onCancelReservation(reservationId, reason) {
    return dispatch({
        type: 'CANCEL_RESERVATION',
        payload: { reservationId, reason }
    });
}

// ----- Navigation Handlers -----

export function onNavigate(view, params = {}) {
    return dispatch({
        type: 'NAVIGATE',
        payload: { view, ...params }
    });
}

export function onOpenModal(type, data = null) {
    return dispatch({
        type: 'OPEN_MODAL',
        payload: { type, data }
    });
}

export function onCloseModal() {
    return dispatch({ type: 'CLOSE_MODAL' });
}

export function onSelectVehicle(vehicleId) {
    return dispatch({
        type: 'NAVIGATE',
        payload: { view: 'vehicle-detail', vehicleId }
    });
}

export function onSelectReservation(reservationId) {
    return dispatch({
        type: 'NAVIGATE',
        payload: { view: 'reservation-detail', reservationId }
    });
}

// ----- Filter Handlers -----

export function onSetVehicleFilters(filters) {
    return dispatch({
        type: 'SET_FILTERS',
        payload: { type: 'vehicles', filters }
    });
}

export function onSetReservationFilters(filters) {
    return dispatch({
        type: 'SET_FILTERS',
        payload: { type: 'reservations', filters }
    });
}

// ----- Auth Handlers -----

export function onLogin(credentials) {
    return dispatch({
        type: 'LOGIN',
        payload: credentials
    });
}

export function onLogout() {
    return dispatch({ type: 'LOGOUT' });
}

// ----- Notification Handlers -----

export function onRemoveNotification(notificationId) {
    return dispatch({
        type: 'REMOVE_NOTIFICATION',
        payload: notificationId
    });
}
