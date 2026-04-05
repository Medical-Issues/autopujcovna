import { VehicleStatus } from '../entities/Vehicle.js';
import { ReservationStatus } from '../entities/Reservation.js';

export function selectAllVehicles(state) {
    return state.vehicles.allIds.map(id => state.vehicles.byId[id]);
}

export function selectAllReservations(state) {
    return state.reservations.allIds.map(id => state.reservations.byId[id]);
}

export function selectVehicleById(state, vehicleId) {
    return state.vehicles.byId[vehicleId] || null;
}

export function selectReservationById(state, reservationId) {
    return state.reservations.byId[reservationId] || null;
}

export function selectIsVehicleAvailable(state, vehicleId) {
    const vehicle = selectVehicleById(state, vehicleId);
    return vehicle?.status === VehicleStatus.AVAILABLE;
}

export function selectCanCreateReservation(state, vehicleId) {
    const vehicle = selectVehicleById(state, vehicleId);
    return vehicle?.status === VehicleStatus.AVAILABLE;
}

export function selectFilteredVehicles(state) {
    const { status, search } = state.ui.filters.vehicles;
    let vehicles = selectAllVehicles(state);

    if (status && status !== 'all') {
        vehicles = vehicles.filter(v => v.status === status);
    }

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

export function selectFilteredReservations(state) {
    const { status, search } = state.ui.filters.reservations;
    let reservations = selectAllReservations(state);

    if (status && status !== 'all') {
        reservations = reservations.filter(r => r.status === status);
    }

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

export function selectTotalRevenue(state) {
    const reservations = selectAllReservations(state);
    return reservations
        .filter(r => r.status === ReservationStatus.COMPLETED || r.status === ReservationStatus.ACTIVE)
        .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
}


export function selectActiveReservationForCustomer(state, customerId) {
    const reservations = selectAllReservations(state);
    return reservations.find(r => 
        r.customerId === customerId && r.status === ReservationStatus.ACTIVE
    ) || null;
}

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

export function selectNotifications(state) {
    return state.ui.notifications;
}

export function selectCurrentModal(state) {
    return state.ui.modal;
}
