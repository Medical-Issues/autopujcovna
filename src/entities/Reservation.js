/**
 * Reservation Entity - Business entita Rezervace
 * Odpovědnost: Málek Jan
 * Reprezentuje proces výpůjčky vozidla zákazníkem
 */

import { generateId } from '../utils/crypto.js';

export const ReservationStatus = {
    NEW: 'NEW',
    CONFIRMED: 'CONFIRMED',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELED: 'CANCELED'
};

export const ReservationTransitions = {
    [ReservationStatus.NEW]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELED],
    [ReservationStatus.CONFIRMED]: [ReservationStatus.ACTIVE, ReservationStatus.CANCELED],
    [ReservationStatus.ACTIVE]: [ReservationStatus.COMPLETED, ReservationStatus.CONFIRMED],
    [ReservationStatus.COMPLETED]: [],
    [ReservationStatus.CANCELED]: []
};

export class Reservation {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.vehicleId = data.vehicleId || null;
        this.customerId = data.customerId || null;
        this.customerName = data.customerName || '';
        this.customerEmail = data.customerEmail || '';
        this.status = data.status || ReservationStatus.NEW;
        this.startDate = data.startDate || null;
        this.endDate = data.endDate || null;
        this.actualStartDate = data.actualStartDate || null;
        this.actualEndDate = data.actualEndDate || null;
        this.totalPrice = data.totalPrice || 0;
        this.notes = data.notes || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.createdBy = data.createdBy || 'system';
    }

    /**
     * Kontrola, zda je přechod mezi stavy povolen
     */
    canTransitionTo(newStatus) {
        const allowedTransitions = ReservationTransitions[this.status] || [];
        return allowedTransitions.includes(newStatus);
    }

    /**
     * Vytvoření rezervace s validací
     * Invariant: Datum vrácení musí být striktně po datu půjčení
     * Invariant: Vozidlo musí být AVAILABLE pro potvrzení
     */
    static createReservation(data, vehicle) {
        // Validace dat
        if (!data.startDate || !data.endDate) {
            return {
                success: false,
                error: 'Počáteční a koncové datum jsou povinné'
            };
        }

        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        // Invariant: Datum vrácení musí být striktně po datu půjčení
        if (endDate <= startDate) {
            return {
                success: false,
                error: 'Datum vrácení musí být po datu půjčení'
            };
        }

        const reservation = new Reservation(data);
        return { success: true, reservation };
    }

    /**
     * Přechod do stavu CONFIRMED
     * Invariant: Pokud vehicle.status ≠ AVAILABLE, nelze přejít do CONFIRMED
     */
    confirm(vehicle, userRole) {
        if (!this.canTransitionTo(ReservationStatus.CONFIRMED)) {
            return {
                success: false,
                error: `Nepovolený přechod: ${this.status} → CONFIRMED`
            };
        }

        // Invariant: Vozidlo musí být dostupné
        if (vehicle && vehicle.status !== 'AVAILABLE') {
            return {
                success: false,
                error: 'Vozidlo není dostupné pro rezervaci'
            };
        }

        this.status = ReservationStatus.CONFIRMED;
        this.updatedAt = new Date().toISOString();

        return { success: true, reservation: this };
    }

    /**
     * Přechod do stavu ACTIVE (fyzické předání vozu)
     */
    confirmPickup(userRole) {
        if (!this.canTransitionTo(ReservationStatus.ACTIVE)) {
            return {
                success: false,
                error: `Nepovolený přechod: ${this.status} → ACTIVE`
            };
        }

        if (userRole !== 'admin' && userRole !== 'employee') {
            return {
                success: false,
                error: 'Nedostatečná práva pro tuto operaci'
            };
        }

        this.status = ReservationStatus.ACTIVE;
        this.actualStartDate = new Date().toISOString();
        this.updatedAt = new Date().toISOString();

        return { success: true, reservation: this };
    }

    /**
     * Přechod do stavu COMPLETED (vrácení vozu)
     */
    confirmReturn(userRole) {
        if (!this.canTransitionTo(ReservationStatus.COMPLETED)) {
            return {
                success: false,
                error: `Nepovolený přechod: ${this.status} → COMPLETED`
            };
        }

        if (userRole !== 'admin' && userRole !== 'employee') {
            return {
                success: false,
                error: 'Nedostatečná práva pro tuto operaci'
            };
        }

        this.status = ReservationStatus.COMPLETED;
        this.actualEndDate = new Date().toISOString();
        this.updatedAt = new Date().toISOString();

        return { success: true, reservation: this };
    }

    /**
     * Zrušení rezervace
     */
    cancel(userRole, reason = '') {
        if (!this.canTransitionTo(ReservationStatus.CANCELED)) {
            return {
                success: false,
                error: `Nelze zrušit rezervaci ve stavu: ${this.status}`
            };
        }

        // Zákazník může zrušit pouze NEW nebo CONFIRMED
        if (userRole === 'customer' && this.status === ReservationStatus.ACTIVE) {
            return {
                success: false,
                error: 'Nelze zrušit aktivní rezervaci'
            };
        }

        this.status = ReservationStatus.CANCELED;
        this.notes = reason ? `Zrušeno: ${reason}` : this.notes;
        this.updatedAt = new Date().toISOString();

        return { success: true, reservation: this };
    }

    /**
     * Reakce na změnu dostupnosti vozidla
     * Pokud vozidlo přejde do MAINTENANCE → řešení kolizních rezervací
     */
    handleVehicleMaintenance() {
        if (this.status === ReservationStatus.CONFIRMED) {
            // Můžeme zrušit nebo přeložit rezervaci
            return {
                success: true,
                action: 'BLOCKED',
                message: 'Vozidlo je v údržbě - rezervace je blokována'
            };
        }

        if (this.status === ReservationStatus.ACTIVE) {
            // Aktivní rezervace musí být dokončena nebo převedena na náhradní vozidlo
            return {
                success: true,
                action: 'URGENT',
                message: 'Vozidlo v aktivní rezervaci je v údržbě'
            };
        }

        return { success: true, action: 'NONE' };
    }

    /**
     * Výpočet celkové ceny rezervace
     */
    calculateTotalPrice(dailyRate) {
        if (!this.startDate || !this.endDate) return 0;

        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        this.totalPrice = days * dailyRate;
        return this.totalPrice;
    }

    /**
     * Kontrola kolize termínů s jinou rezervací
     */
    hasDateConflict(otherReservation) {
        if (this.status === ReservationStatus.CANCELED || 
            otherReservation.status === ReservationStatus.CANCELED) {
            return false;
        }

        const thisStart = new Date(this.startDate);
        const thisEnd = new Date(this.endDate);
        const otherStart = new Date(otherReservation.startDate);
        const otherEnd = new Date(otherReservation.endDate);

        return (thisStart < otherEnd && thisEnd > otherStart);
    }

    toJSON() {
        return {
            id: this.id,
            vehicleId: this.vehicleId,
            customerId: this.customerId,
            customerName: this.customerName,
            customerEmail: this.customerEmail,
            status: this.status,
            startDate: this.startDate,
            endDate: this.endDate,
            actualStartDate: this.actualStartDate,
            actualEndDate: this.actualEndDate,
            totalPrice: this.totalPrice,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            createdBy: this.createdBy
        };
    }

    static fromJSON(data) {
        return new Reservation(data);
    }
}

/**
 * Factory function pro vytvoření rezervace
 */
export function createReservation(data, vehicle = null) {
    return Reservation.createReservation(data, vehicle);
}
