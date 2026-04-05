/**
 * Asynchronní operace a side-effects (IR03)
 * Odpovědnost: Veselský Jan
 * Zajišťuje: komunikaci s Mock API, práci s časem, zpracování SUCCESS/REJECTED/ERROR,
 *            přechody do loading a error stavů
 */

// Simulace síťové latence
const NETWORK_DELAY = 300;

// In-memory úložiště pro mock data
let mockDatabase = {
    vehicles: [
        {
            id: 'v1',
            brand: 'Škoda',
            model: 'Octavia',
            year: 2022,
            licensePlate: 'ABC-1234',
            status: 'AVAILABLE',
            mileage: 45000,
            dailyRate: 800,
            description: 'Rodinný vůz, diesel, automat',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'v2',
            brand: 'Volkswagen',
            model: 'Golf',
            year: 2023,
            licensePlate: 'XYZ-5678',
            status: 'AVAILABLE',
            mileage: 23000,
            dailyRate: 650,
            description: 'Kompaktní hatchback, benzín, manuál',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'v3',
            brand: 'BMW',
            model: 'X5',
            year: 2021,
            licensePlate: 'BMW-9999',
            status: 'RENTED',
            mileage: 67000,
            dailyRate: 1500,
            description: 'Luxusní SUV, diesel, automat',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'v4',
            brand: 'Hyundai',
            model: 'i30',
            year: 2023,
            licensePlate: 'HYU-1111',
            status: 'MAINTENANCE',
            mileage: 15000,
            dailyRate: 550,
            description: 'Servisní prohlídka',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    reservations: [
        {
            id: 'r1',
            vehicleId: 'v3',
            customerId: 'c1',
            customerName: 'Petr Novák',
            customerEmail: 'petr@example.com',
            status: 'ACTIVE',
            startDate: new Date(Date.now() - 86400000).toISOString(),
            endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
            actualStartDate: new Date(Date.now() - 86400000).toISOString(),
            totalPrice: 4500,
            notes: '',
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'r2',
            vehicleId: 'v1',
            customerId: 'c2',
            customerName: 'Marie Svobodová',
            customerEmail: 'marie@example.com',
            status: 'CONFIRMED',
            startDate: new Date(Date.now() + 86400000 * 2).toISOString(),
            endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
            totalPrice: 2400,
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    users: [
        {
            id: 'admin1',
            email: 'admin@autopujcovna.cz',
            name: 'Admin',
            role: 'admin',
            password: 'admin123'
        },
        {
            id: 'emp1',
            email: 'zamestnanec@autopujcovna.cz',
            name: 'Zaměstnanec',
            role: 'employee',
            password: 'emp123'
        }
    ]
};

/**
 * Simulace asynchronního API volání
 * @param {string} method - HTTP metoda
 * @param {string} endpoint - API endpoint
 * @param {object} data - Data pro POST/PUT
 * @returns {Promise} - Vrací data nebo chybu
 */
export async function mockApiCall(method, endpoint, data = null) {
    // Simulace síťové latence
    await new Promise(resolve => setTimeout(resolve, NETWORK_DELAY));
    
    // Simulace náhodné chyby (5%)
    if (Math.random() < 0.05) {
        throw new Error('Síťová chyba - zkuste to znovu');
    }
    
    const url = endpoint.replace(/^\//, '');
    const parts = url.split('/');
    const resource = parts[0];
    const id = parts[1];
    
    switch (resource) {
        case 'vehicles':
            return handleVehicleRequest(method, id, data);
            
        case 'reservations':
            return handleReservationRequest(method, id, data);
            
        case 'auth':
            return handleAuthRequest(method, parts[1], data);
            
        default:
            throw new Error(`Neznámý endpoint: ${endpoint}`);
    }
}

function handleVehicleRequest(method, id, data) {
    switch (method) {
        case 'GET':
            if (id) {
                const vehicle = mockDatabase.vehicles.find(v => v.id === id);
                if (!vehicle) throw new Error('Vozidlo nenalezeno');
                return vehicle;
            }
            return [...mockDatabase.vehicles];
            
        case 'POST':
            const newVehicle = {
                ...data,
                id: data.id || crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockDatabase.vehicles.push(newVehicle);
            return newVehicle;
            
        case 'PUT':
            const index = mockDatabase.vehicles.findIndex(v => v.id === id);
            if (index === -1) throw new Error('Vozidlo nenalezeno');
            mockDatabase.vehicles[index] = {
                ...mockDatabase.vehicles[index],
                ...data,
                updatedAt: new Date().toISOString()
            };
            return mockDatabase.vehicles[index];
            
        case 'DELETE':
            const deleteIndex = mockDatabase.vehicles.findIndex(v => v.id === id);
            if (deleteIndex === -1) throw new Error('Vozidlo nenalezeno');
            mockDatabase.vehicles.splice(deleteIndex, 1);
            return { success: true };
            
        default:
            throw new Error(`Nepodporovaná metoda: ${method}`);
    }
}

function handleReservationRequest(method, id, data) {
    switch (method) {
        case 'GET':
            if (id) {
                const reservation = mockDatabase.reservations.find(r => r.id === id);
                if (!reservation) throw new Error('Rezervace nenalezena');
                return reservation;
            }
            return [...mockDatabase.reservations];
            
        case 'POST':
            const newReservation = {
                ...data,
                id: data.id || crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            mockDatabase.reservations.push(newReservation);
            return newReservation;
            
        case 'PUT':
            const index = mockDatabase.reservations.findIndex(r => r.id === id);
            if (index === -1) throw new Error('Rezervace nenalezena');
            mockDatabase.reservations[index] = {
                ...mockDatabase.reservations[index],
                ...data,
                updatedAt: new Date().toISOString()
            };
            return mockDatabase.reservations[index];
            
        case 'DELETE':
            const deleteIndex = mockDatabase.reservations.findIndex(r => r.id === id);
            if (deleteIndex === -1) throw new Error('Rezervace nenalezena');
            mockDatabase.reservations.splice(deleteIndex, 1);
            return { success: true };
            
        default:
            throw new Error(`Nepodporovaná metoda: ${method}`);
    }
}

function handleAuthRequest(method, action, data) {
    if (method === 'POST' && action === 'login') {
        const user = mockDatabase.users.find(
            u => u.email === data.email && u.password === data.password
        );
        
        if (!user) {
            throw new Error('Neplatné přihlašovací údaje');
        }
        
        // Simulace JWT tokenu
        const token = btoa(JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            exp: Date.now() + 3600000 // 1 hodina
        }));
        
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        };
    }
    
    throw new Error('Neplatný auth požadavek');
}

/**
 * Reset mock databáze na výchozí stav
 */
export function resetMockDatabase() {
    mockDatabase = {
        vehicles: [...mockDatabase.vehicles],
        reservations: [...mockDatabase.reservations],
        users: [...mockDatabase.users]
    };
}

/**
 * Získání aktuálního stavu mock databáze (pro testování)
 */
export function getMockDatabase() {
    return { ...mockDatabase };
}
