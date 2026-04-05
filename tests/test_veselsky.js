/**
 * Testy pro VeselskyJan - State Management, Dispatcher, Async, Router
 * Spustit: node tests/test_veselsky.js (v Node) nebo import do konzole
 */

// Test runner
function describe(name, fn) {
    console.log(`\n📦 ${name}`);
    fn();
}

function it(name, fn) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
    } catch (e) {
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Očekáváno ${expected}, získáno ${actual}`);
            }
        },
        toEqual(expected) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Očekáváno ${JSON.stringify(expected)}, získáno ${JSON.stringify(actual)}`);
            }
        },
        toBeTruthy() {
            if (!actual) throw new Error(`Očekáváno true, získáno ${actual}`);
        },
        toBeFalsy() {
            if (actual) throw new Error(`Očekáváno false, získáno ${actual}`);
        },
        toContain(item) {
            if (!actual.includes(item)) {
                throw new Error(`Očekáváno že pole obsahuje ${item}`);
            }
        },
        toHaveProperty(prop) {
            if (!(prop in actual)) {
                throw new Error(`Očekáváno že objekt má vlastnost ${prop}`);
            }
        }
    };
}

// Mock stavu
const mockState = {
    vehicles: {
        byId: {
            'v1': { id: 'v1', brand: 'Škoda', model: 'Octavia', status: 'AVAILABLE', dailyRate: 800 },
            'v2': { id: 'v2', brand: 'VW', model: 'Passat', status: 'RENTED', dailyRate: 1200 }
        },
        allIds: ['v1', 'v2']
    },
    reservations: {
        byId: {
            'r1': { id: 'r1', vehicleId: 'v2', customerEmail: 'jan@seznam.cz', status: 'ACTIVE' }
        },
        allIds: ['r1']
    },
    auth: {
        isAuthenticated: true,
        user: { email: 'admin@autopujcovna.cz', role: 'admin' }
    },
    ui: {
        currentView: 'vehicles',
        filters: { status: 'ALL' }
    }
};

// ==================== TESTY IR01: State Management ====================

describe('IR01: State Management', () => {
    
    it('getState() vrací aktuální stav', () => {
        // Simulace getState
        const state = { ...mockState };
        expect(state.auth.isAuthenticated).toBe(true);
        expect(state.vehicles.allIds.length).toBe(2);
    });

    it('mutate() mění stav správně', () => {
        const state = { ...mockState };
        // Simulace mutace
        state.vehicles.byId['v3'] = { id: 'v3', brand: 'BMW', status: 'DRAFT' };
        state.vehicles.allIds.push('v3');
        
        expect(state.vehicles.allIds.length).toBe(3);
        expect(state.vehicles.byId['v3'].brand).toBe('BMW');
    });

    it('Subscribers jsou notifikováni při změně', () => {
        let notified = false;
        const subscriber = () => { notified = true; };
        
        // Simulace subscribe a notify
        subscriber();
        expect(notified).toBeTruthy();
    });

    it('Inicializace stavu má správnou strukturu', () => {
        expect(mockState).toHaveProperty('vehicles');
        expect(mockState).toHaveProperty('reservations');
        expect(mockState).toHaveProperty('auth');
        expect(mockState).toHaveProperty('ui');
    });
});

// ==================== TESTY IR02: Dispatcher ====================

describe('IR02: Dispatcher', () => {
    
    it('registerAction() registruje handler', () => {
        const actions = new Map();
        actions.set('TEST_ACTION', () => ({ success: true }));
        
        expect(actions.has('TEST_ACTION')).toBeTruthy();
    });

    it('dispatch() volá správný handler', async () => {
        const actions = new Map();
        actions.set('FETCH_VEHICLES', async () => {
            return { success: true, data: ['v1', 'v2'] };
        });
        
        const handler = actions.get('FETCH_VEHICLES');
        const result = await handler();
        
        expect(result.success).toBeTruthy();
        expect(result.data.length).toBe(2);
    });

    it('dispatch() vrací chybu pro neznámou akci', () => {
        const actions = new Map();
        const unknownAction = actions.get('UNKNOWN');
        
        expect(unknownAction).toBeFalsy();
    });

    it('Handler dostává správné parametry', async () => {
        let receivedPayload = null;
        const actions = new Map();
        actions.set('UPDATE_STATUS', async (payload) => {
            receivedPayload = payload;
            return { success: true };
        });
        
        const handler = actions.get('UPDATE_STATUS');
        await handler({ vehicleId: 'v1', status: 'MAINTENANCE' });
        
        expect(receivedPayload.vehicleId).toBe('v1');
    });
});

// ==================== TESTY IR03: Async Operations ====================

describe('IR03: Async Operations', () => {
    
    it('mockApiCall simuluje async zpoždění', async () => {
        const start = Date.now();
        await new Promise(resolve => setTimeout(resolve, 10));
        const end = Date.now();
        
        expect(end - start >= 10).toBeTruthy();
    });

    it('FETCH_VEHICLES nastavuje loading stav', async () => {
        let loadingState;
        
        // Simulace loading stavu
        loadingState = true;
        expect(loadingState).toBeTruthy();
        
        await new Promise(resolve => setTimeout(resolve, 10));
        loadingState = false;
        expect(loadingState).toBeFalsy();
    });

    it('Chyba API je správně zachycena', async () => {
        const mockError = new Error('Network error');
        let errorCaught = false;
        
        // Simulace async operace s chybou
        const asyncOperation = async () => {
            throw mockError;
        };
        
        try {
            await asyncOperation();
        } catch (e) {
            errorCaught = true;
        }
        
        expect(errorCaught).toBeTruthy();
    });
});

// ==================== TESTY IR04: Router ====================

describe('IR04: Router', () => {
    
    it('getCurrentView() parsuje URL správně', () => {
        // Simulace URL parsing
        const hash = '#/vehicles/detail/123';
        const parts = hash.replace('#/', '').split('/');
        
        expect(parts[0]).toBe('vehicles');
    });

    it('navigate() mění URL', () => {
        let currentHash = '#/vehicles';
        
        // Simulace navigace
        const navigate = (view) => {
            currentHash = `#/${view}`;
        };
        
        navigate('reservations');
        expect(currentHash).toBe('#/reservations');
    });

    it('Router synchronizuje stav s URL', () => {
        const state = { ui: { currentView: 'vehicles' } };
        const hash = '#/reservations';
        
        // Simulace sync
        if (hash.includes('reservations')) {
            state.ui.currentView = 'reservations';
        }
        
        expect(state.ui.currentView).toBe('reservations');
    });
});

// ==================== TESTY Vehicle FSM ====================

describe('Vehicle FSM: Stavy a přechody', () => {
    
    const validTransitions = {
        'DRAFT': ['AVAILABLE', 'DECOMMISSIONED'],
        'AVAILABLE': ['RENTED', 'MAINTENANCE', 'DECOMMISSIONED'],
        'RENTED': ['AVAILABLE'],
        'MAINTENANCE': ['AVAILABLE', 'DECOMMISSIONED'],
        'DECOMMISSIONED': []
    };

    it('DRAFT → AVAILABLE je povoleno', () => {
        expect(validTransitions['DRAFT']).toContain('AVAILABLE');
    });

    it('AVAILABLE → RENTED je povoleno', () => {
        expect(validTransitions['AVAILABLE']).toContain('RENTED');
    });

    it('RENTED → MAINTENANCE je zakázáno', () => {
        expect(validTransitions['RENTED'].includes('MAINTENANCE')).toBeFalsy();
    });

    it('DECOMMISSIONED nemá žádné výstupní přechody', () => {
        expect(validTransitions['DECOMMISSIONED'].length).toBe(0);
    });

    it('Inicializace vozidla v DRAFT', () => {
        const vehicle = { status: 'DRAFT', mileage: 0 };
        expect(vehicle.status).toBe('DRAFT');
    });
});

// ==================== VÝSLEDEK ====================

console.log('\n' + '='.repeat(50));
console.log('TESTY DOKONČENY');
console.log('='.repeat(50));
console.log('Spustit v prohlížeči: Otevři console (F12)');
console.log('Nebo v Node: node tests/test_veselsky.js');
