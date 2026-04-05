/**
 * Selektory (IR05) - Výběr dat ze stavu
 * Odpovědnost: Málek Jan
 * Zajišťuje: filtrování kolekcí, odvozené hodnoty (isAvailable, canReserve, totalPrice),
 *            pojmenování významových stavů aplikace, přípravu dat pro konkrétní pohled
 */

import { VehicleStatus } from '../entities/Vehicle.js';
import { ReservationStatus } from '../entities/Reservation.js';

/**
 * Získání všech vozidel jako pole
 */
export function selectAllVehicles(state) {
    return state.vehicles.allIds.map(id => state.vehicles.byId[id]);
}

/**
 * Získání všech rezervací jako pole
 */
export function selectAllReservations(state) {
    return state.reservations.allIds.map(id => state.reservations.byId[id]);
}

/**
 * Získání konkrétního vozidla podle ID
 */
export function selectVehicleById(state, vehicleId) {
    return state.vehicles.byId[vehicleId] || null;
}

/**
 * Získání konkrétní rezervace podle ID
 */
export function selectReservationById(state, reservationId) {
    return state.reservations.byId[reservationId] || null;
}

/**
 * Odvozená hodnota: Je vozidlo dostupné?
 */
export function selectIsVehicleAvailable(state, vehicleId) {
    const vehicle = selectVehicleById(state, vehicleId);
    return vehicle?.status === VehicleStatus.AVAILABLE;
}

/**
 * Odvozená hodnota: Lze vytvořit rezervaci na vozidlo?
 */
export function selectCanCreateReservation(state, vehicleId) {
    const vehicle = selectVehicleById(state, vehicleId);
    return vehicle?.status === VehicleStatus.AVAILABLE;
}

/**
 * Filtrovaná vozidla podle UI filtrů
 */
export function selectFilteredVehicles(state) {
    const { status, search } = state.ui.filters.vehicles;
    let vehicles = selectAllVehicles(state);
    
    // Filtrování podle statusu
    if (status && status !== 'all') {
        vehicles = vehicles.filter(v => v.status === status);
    }
    
    // Filtrování podle vyhledávání
    if (search) {
        const searchLower = search.toLowerCase();
        vehicles = vehicles.filter(v => 
            v.brand?.toLowerCase().includes(searchLower) ||
            v.model?.toLowerCase().includes(searchLower) ||
            v.licensePlate?.toLowerCase().includes(searchLower) ||
            v.description?.toLowerCase().includes(searchLower)
        );
    }
    
    return vehicles;
}

/**
 * Filtrované rezervace podle UI filtrů
 */
export function selectFilteredReservations(state) {
    const { status, search } = state.ui.filters.reservations;
    let reservations = selectAllReservations(state);
    
    // Filtrování podle statusu
    if (status && status !== 'all') {
        reservations = reservations.filter(r => r.status === status);
    }
    
    // Filtrování podle vyhledávání
    if (search) {
        const searchLower = search.toLowerCase();
        reservations = reservations.filter(r => 
            r.customerName?.toLowerCase().includes(searchLower) ||
            r.customerEmail?.toLowerCase().includes(searchLower) ||
            r.notes?.toLowerCase().includes(searchLower)
        );
    }
    
    return reservations;
}

/**
 * Odvozená hodnota: Počet vozidel podle statusu
 */
export function selectVehicleCounts(state) {
    const vehicles = selectAllVehicles(state);
    return {
        total: vehicles.length,
        available: vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length,
        rented: vehicles.filter(v => v.status === VehicleStatus.RENTED).length,
        maintenance: vehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length,
        decommissioned: vehicles.filter(v => v.status === VehicleStatus.DECOMMISSIONED).length,
        draft: vehicles.filter(v => v.status === VehicleStatus.DRAFT).length
    };
}

/**
 * Odvozená hodnota: Počet rezervací podle statusu
 */
export function selectReservationCounts(state) {
    const reservations = selectAllReservations(state);
    return {
        total: reservations.length,
        new: reservations.filter(r => r.status === ReservationStatus.NEW).length,
        confirmed: reservations.filter(r => r.status === ReservationStatus.CONFIRMED).length,
        active: reservations.filter(r => r.status === ReservationStatus.ACTIVE).length,
        completed: reservations.filter(r => r.status === ReservationStatus.COMPLETED).length,
        canceled: reservations.filter(r => r.status === ReservationStatus.CANCELED).length
    };
}

/**
 * Odvozená hodnota: Celkový výnos z rezervací
 */
export function selectTotalRevenue(state) {
    const reservations = selectAllReservations(state);
    return reservations
        .filter(r => r.status === ReservationStatus.COMPLETED || r.status === ReservationStatus.ACTIVE)
        .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
}

/**
 * Odvozená hodnota: Aktivní rezervace pro zákazníka
 * Invariant: Zákazník může mít maximálně jednu ACTIVE rezervaci
 */
export function selectActiveReservationForCustomer(state, customerId) {
    const reservations = selectAllReservations(state);
    return reservations.find(r => 
        r.customerId === customerId && r.status === ReservationStatus.ACTIVE
    ) || null;
}

/**
 * Odvozená hodnota: Rezervace v kolizi s daným termínem
 */
export function selectConflictingReservations(state, vehicleId, startDate, endDate, excludeId = null) {
    const reservations = selectAllReservations(state);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return reservations.filter(r => {
        if (r.vehicleId !== vehicleId) return false;
        if (r.id === excludeId) return false;
        if (r.status === ReservationStatus.CANCELED) return false;
        
        const rStart = new Date(r.startDate);
        const rEnd = new Date(r.endDate);
        
        // Kolize: start < rEnd && end > rStart
        return start < rEnd && end > rStart;
    });
}

/**
 * Příprava dat pro detail vozidla
 */
export function selectVehicleDetailData(state, vehicleId) {
    const vehicle = selectVehicleById(state, vehicleId);
    if (!vehicle) return null;
    
    const reservations = selectAllReservations(state).filter(r => 
        r.vehicleId === vehicleId && r.status !== ReservationStatus.CANCELED
    );
    
    return {
        vehicle,
        reservations,
        isAvailable: vehicle.status === VehicleStatus.AVAILABLE,
        canEdit: true, // Lze rozšířit o kontrolu práv
        canDelete: vehicle.status !== VehicleStatus.RENTED && 
                   vehicle.status !== VehicleStatus.DECOMMISSIONED,
        canCreateReservation: vehicle.status === VehicleStatus.AVAILABLE
    };
}

/**
 * Příprava dat pro detail rezervace
 */
export function selectReservationDetailData(state, reservationId) {
    const reservation = selectReservationById(state, reservationId);
    if (!reservation) return null;
    
    const vehicle = selectVehicleById(state, reservation.vehicleId);
    
    return {
        reservation,
        vehicle,
        canEdit: reservation.status !== ReservationStatus.COMPLETED && 
                 reservation.status !== ReservationStatus.CANCELED,
        canCancel: reservation.status === ReservationStatus.NEW || 
                   reservation.status === ReservationStatus.CONFIRMED,
        canActivate: reservation.status === ReservationStatus.CONFIRMED,
        canComplete: reservation.status === ReservationStatus.ACTIVE
    };
}

/**
 * Významové stavy aplikace pro přehled
 */
export function selectAppStateSummary(state) {
    const vehicleCounts = selectVehicleCounts(state);
    const reservationCounts = selectReservationCounts(state);
    const totalRevenue = selectTotalRevenue(state);
    
    return {
        vehicles: vehicleCounts,
        reservations: reservationCounts,
        revenue: totalRevenue,
        isLoading: state.vehicles.loading || state.reservations.loading,
        hasError: !!(state.vehicles.error || state.reservations.error),
        user: state.auth.user,
        isAuthenticated: state.auth.isAuthenticated
    };
}

/**
 * Získání notifikací
 */
export function selectNotifications(state) {
    return state.ui.notifications;
}

/**
 * Získání aktuálního modálu
 */
export function selectCurrentModal(state) {
    return state.ui.modal;
}
