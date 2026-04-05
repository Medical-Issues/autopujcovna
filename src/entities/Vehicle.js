/**
 * Vehicle Entity - Business entita Vozidlo
 * Odpovědnost: Veselský Jan
 * Reprezentuje konkrétní automobil v půjčovně
 */

import { generateId } from '../utils/crypto.js';

export const VehicleStatus = {
    DRAFT: 'DRAFT',
    AVAILABLE: 'AVAILABLE',
    RENTED: 'RENTED',
    MAINTENANCE: 'MAINTENANCE',
    DECOMMISSIONED: 'DECOMMISSIONED'
};

export const VehicleTransitions = {
    [VehicleStatus.DRAFT]: [VehicleStatus.AVAILABLE],
    [VehicleStatus.AVAILABLE]: [VehicleStatus.RENTED, VehicleStatus.MAINTENANCE, VehicleStatus.DECOMMISSIONED],
    [VehicleStatus.RENTED]: [VehicleStatus.AVAILABLE, VehicleStatus.MAINTENANCE],
    [VehicleStatus.MAINTENANCE]: [VehicleStatus.AVAILABLE, VehicleStatus.DECOMMISSIONED],
    [VehicleStatus.DECOMMISSIONED]: []
};

export class Vehicle {
    constructor(data = {}) {
        this.id = data.id || generateId();
        this.brand = data.brand || '';
        this.model = data.model || '';
        this.year = data.year || new Date().getFullYear();
        this.licensePlate = data.licensePlate || '';
        this.status = data.status || VehicleStatus.DRAFT;
        this.mileage = data.mileage || 0;
        this.dailyRate = data.dailyRate || 0;
        this.description = data.description || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Kontrola, zda je přechod mezi stavy povolen
     */
    canTransitionTo(newStatus) {
        const allowedTransitions = VehicleTransitions[this.status] || [];
        return allowedTransitions.includes(newStatus);
    }

    /**
     * Aktualizace stavu vozidla s validací přechodu
     */
    updateStatus(newStatus, userRole) {
        if (!this.canTransitionTo(newStatus)) {
            return {
                success: false,
                error: `Nepovolený přechod: ${this.status} → ${newStatus}`
            };
        }

        // Validace práv pro přechody
        const adminTransitions = [
            VehicleStatus.MAINTENANCE,
            VehicleStatus.DECOMMISSIONED,
            VehicleStatus.AVAILABLE
        ];
        
        if (adminTransitions.includes(newStatus) && userRole !== 'admin') {
            return {
                success: false,
                error: 'Nedostatečná práva pro tuto operaci'
            };
        }

        this.status = newStatus;
        this.updatedAt = new Date().toISOString();
        
        return { success: true, vehicle: this };
    }

    /**
     * Aktualizace stavu tachometru
     * Invariant: Nový stav nesmí být nižší než předchozí
     */
    updateMileage(newMileage) {
        if (newMileage < this.mileage) {
            return {
                success: false,
                error: `Stav tachometru nesmí klesnout: ${this.mileage} → ${newMileage}`
            };
        }

        this.mileage = newMileage;
        this.updatedAt = new Date().toISOString();
        
        return { success: true, vehicle: this };
    }

    /**
     * Kontrola dostupnosti vozidla pro rezervaci
     */
    checkAvailability() {
        return this.status === VehicleStatus.AVAILABLE;
    }

    /**
     * Validace před vytvořením rezervace
     * Invariant: Vozidlo ve stavu RENTED nelze smazat ani vyřadit
     */
    canDeleteOrDecommission() {
        if (this.status === VehicleStatus.RENTED) {
            return {
                success: false,
                error: 'Vozidlo je aktuálně vypůjčeno - nelze smazat ani vyřadit'
            };
        }
        return { success: true };
    }

    /**
     * Kontrola, zda lze vytvořit rezervaci
     * Invariant: Pokud status ≠ AVAILABLE, nelze vytvářet nové CONFIRMED rezervace
     */
    canCreateReservation() {
        if (this.status !== VehicleStatus.AVAILABLE) {
            return {
                success: false,
                error: `Vozidlo není dostupné (status: ${this.status})`
            };
        }
        return { success: true };
    }

    toJSON() {
        return {
            id: this.id,
            brand: this.brand,
            model: this.model,
            year: this.year,
            licensePlate: this.licensePlate,
            status: this.status,
            mileage: this.mileage,
            dailyRate: this.dailyRate,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(data) {
        return new Vehicle(data);
    }
}

/**
 * Factory function pro vytvoření nového vozidla
 */
export function createVehicle(data) {
    return new Vehicle(data);
}
