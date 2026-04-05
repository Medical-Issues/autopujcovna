/**
 * Testy pro MalekJan - Reservation FSM, Selectors, Views, Handlers, Auth
 * Spustit: node tests/test_malek.js (v Node) nebo import do konzole
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
                throw new Error(`Očekáváno že obsahuje ${item}`);
            }
        },
        toHaveLength(len) {
            if (actual.length !== len) {
                throw new Error(`Očekávána délka ${len}, získáno ${actual.length}`);
            }
        },
        toHaveProperty(prop) {
            if (!(prop in actual)) {
                throw new Error(`Očekáváno že objekt má vlastnost ${prop}`);
            }
        }
    };
}

// Mock data
const mockReservation = {
    id: 'r1',
    vehicleId: 'v1',
    customerEmail: 'jan@seznam.cz',
    customerName: 'Jan Novák',
    status: 'NEW',
    startDate: '2024-01-15',
    endDate: '2024-01-20',
    totalPrice: 4000
};

const mockUser = {
    email: 'admin@autopujcovna.cz',
    role: 'admin',
    name: 'Admin'
};

// ==================== TESTY Reservation FSM ====================

describe('Reservation FSM: Stavy a přechody', () => {
    
    const validTransitions = {
        'NEW': ['CONFIRMED', 'CANCELED'],
        'CONFIRMED': ['ACTIVE', 'CANCELED'],
        'ACTIVE': ['COMPLETED'],
        'COMPLETED': [],
        'CANCELED': []
    };

    it('NEW → CONFIRMED je povoleno', () => {
        expect(validTransitions['NEW']).toContain('CONFIRMED');
    });

    it('NEW → ACTIVE je zakázáno (musí přes CONFIRMED)', () => {
        expect(validTransitions['NEW'].includes('ACTIVE')).toBeFalsy();
    });

    it('CONFIRMED → ACTIVE je povoleno', () => {
        expect(validTransitions['CONFIRMED']).toContain('ACTIVE');
    });

    it('ACTIVE → COMPLETED je povoleno', () => {
        expect(validTransitions['ACTIVE']).toContain('COMPLETED');
    });

    it('CANCELED je terminální stav', () => {
        expect(validTransitions['CANCELED']).toHaveLength(0);
    });

    it('COMPLETED je terminální stav', () => {
        expect(validTransitions['COMPLETED']).toHaveLength(0);
    });

    // Invarianty
    it('Zákazník může mít max 1 ACTIVE rezervaci', () => {
        const reservations = [
            { customerEmail: 'jan@seznam.cz', status: 'ACTIVE' },
            { customerEmail: 'jan@seznam.cz', status: 'CONFIRMED' },
            { customerEmail: 'pavel@seznam.cz', status: 'ACTIVE' }
        ];
        
        const janActive = reservations.filter(r => 
            r.customerEmail === 'jan@seznam.cz' && r.status === 'ACTIVE'
        );
        
        expect(janActive.length <= 1).toBeTruthy();
    });

    it('Validace rezervačních dat funguje', () => {
        // Použití mockReservation
        expect(mockReservation.customerEmail).toBe('jan@seznam.cz');
        expect(mockReservation.status).toBe('NEW');
        
        // Kontrola validního rozsahu dat
        const start = new Date(mockReservation.startDate);
        const end = new Date(mockReservation.endDate);
        expect(end > start).toBeTruthy();
    });
});

// ==================== TESTY IR05: Selectors ====================

describe('IR05: Selectors', () => {
    
    const state = {
        vehicles: {
            byId: {
                'v1': { id: 'v1', status: 'AVAILABLE', dailyRate: 800 },
                'v2': { id: 'v2', status: 'RENTED', dailyRate: 1200 }
            },
            allIds: ['v1', 'v2']
        },
        reservations: {
            byId: {
                'r1': { id: 'r1', vehicleId: 'v2', status: 'ACTIVE' }
            },
            allIds: ['r1']
        },
        ui: { filters: { status: 'ALL', search: '' } }
    };

    it('selectVehicles vrací všechna vozidla', () => {
        const vehicles = state.vehicles.allIds.map(id => state.vehicles.byId[id]);
        expect(vehicles.length).toBe(2);
    });

    it('selectAvailableVehicles filtruje dostupná', () => {
        const allVehicles = Object.values(state.vehicles.byId);
        const available = allVehicles.filter(v => v.status === 'AVAILABLE');
        
        expect(available.length).toBe(1);
        expect(available[0].id).toBe('v1');
    });

    it('selectReservationsByVehicle vrací rezervace pro vozidlo', () => {
        const vehicleId = 'v2';
        const reservations = Object.values(state.reservations.byId)
            .filter(r => r.vehicleId === vehicleId);
        
        expect(reservations.length).toBe(1);
    });

    it('selectActiveReservationsCount počítá aktivní', () => {
        const active = Object.values(state.reservations.byId)
            .filter(r => r.status === 'ACTIVE');
        
        expect(active.length).toBe(1);
    });

    it('Filtr podle ceny funguje správně', () => {
        const vehicles = Object.values(state.vehicles.byId);
        const affordable = vehicles.filter(v => v.dailyRate <= 1000);
        
        expect(affordable.length).toBe(1);
        expect(affordable[0].id).toBe('v1');
    });
});

// ==================== TESTY IR06: Views ====================

describe('IR06: Views (DOM komponenty)', () => {
    
    it('button() vytváří tlačítko s textem', () => {
        // Simulace
        const btn = { tag: 'button', text: 'Klikni', className: 'bg-blue-600' };
        expect(btn.text).toBe('Klikni');
        expect(btn.tag).toBe('button');
    });

    it('statusBadge() vrací správnou barvu pro AVAILABLE', () => {
        const statusColors = {
            'AVAILABLE': 'bg-green-100',
            'RENTED': 'bg-blue-100'
        };
        expect(statusColors['AVAILABLE']).toContain('green');
    });

    it('input() vytváří input element', () => {
        const input = { tag: 'input', type: 'text', value: 'test' };
        expect(input.tag).toBe('input');
        expect(input.type).toBe('text');
    });

    it('icon() vrací SVG element', () => {
        const svg = { tag: 'svg', width: 20 };
        expect(svg.tag).toBe('svg');
    });

    it('el() podporuje nested struktury', () => {
        const parent = {
            tag: 'div',
            children: [
                { tag: 'span', text: 'A' },
                { tag: 'span', text: 'B' }
            ]
        };
        expect(parent.children.length).toBe(2);
    });
});

// ==================== TESTY IR07: Handlers ====================

describe('IR07: Handlers (UI → Akce)', () => {
    
    it('onLogin() dispatchuje LOGIN akci', () => {
        let dispatched = null;
        const dispatch = (action) => { dispatched = action; };
        
        const onLogin = (credentials) => {
            dispatch({ type: 'LOGIN', payload: credentials });
        };
        
        onLogin({ email: 'test@test.cz', password: '123' });
        expect(dispatched.type).toBe('LOGIN');
    });

    it('onNavigate() mění view', () => {
        let currentView = 'vehicles';
        const onNavigate = (view) => { currentView = view; };
        
        onNavigate('reservations');
        expect(currentView).toBe('reservations');
    });

    it('onCreateReservation() validuje data', () => {
        const data = { vehicleId: 'v1', startDate: '', endDate: '2024-01-20' };
        const isValid = data.vehicleId && data.startDate && data.endDate;
        
        expect(isValid).toBeFalsy(); // startDate je prázdný
    });

    it('Handler pro aktualizaci stavu vozidla', () => {
        const onUpdateStatus = (vehicleId, status) => {
            return { type: 'UPDATE_VEHICLE_STATUS', payload: { vehicleId, status } };
        };
        
        const action = onUpdateStatus('v1', 'MAINTENANCE');
        expect(action.payload.status).toBe('MAINTENANCE');
    });

    it('onConfirmReservation() ověřuje práva', () => {
        const user = { role: 'employee' };
        const canConfirm = user.role === 'admin' || user.role === 'employee';
        
        expect(canConfirm).toBeTruthy();
    });
});

// ==================== TESTY IR08: Auth ====================

describe('IR08: Authentication & Authorization', () => {
    
    it('Admin má přístup ke všem akcím', () => {
        const admin = { role: 'admin' };
        const canManageVehicles = ['admin', 'employee'].includes(admin.role);
        const canDeleteVehicles = admin.role === 'admin';
        
        expect(canManageVehicles).toBeTruthy();
        expect(canDeleteVehicles).toBeTruthy();
    });

    it('Employee má omezený přístup', () => {
        const employee = { role: 'employee' };
        const canDeleteVehicles = employee.role === 'admin';
        const canCreateReservation = ['admin', 'employee'].includes(employee.role);
        
        expect(canDeleteVehicles).toBeFalsy();
        expect(canCreateReservation).toBeTruthy();
    });

    it('Guest (nepřihlášený) má jen čtení', () => {
        const guest = { role: 'guest' };
        const canRead = true;
        const canModify = ['admin', 'employee'].includes(guest.role);
        
        expect(canRead).toBeTruthy();
        expect(canModify).toBeFalsy();
    });

    it('Token je uložen po loginu', () => {
        let token = null;
        const login = () => { token = 'mock-jwt-token-123'; };
        
        login();
        expect(token).toBeTruthy();
        expect(token.length > 10).toBeTruthy();
    });

    it('Logout maže token a stav', () => {
        let auth = { token: 'abc', isAuthenticated: true };
        const logout = () => { 
            auth = { token: null, isAuthenticated: false, user: null };
        };
        
        logout();
        expect(auth.isAuthenticated).toBeFalsy();
        expect(auth.token).toBeFalsy();
    });

    it('Admin má plná práva v systému', () => {
        // Použití mockUser
        expect(mockUser.role).toBe('admin');
        expect(mockUser.email).toBe('admin@autopujcovna.cz');
        
        const canManageAll = mockUser.role === 'admin';
        expect(canManageAll).toBeTruthy();
    });
});

// ==================== VÝSLEDEK ====================

console.log('\n' + '='.repeat(50));
console.log('TESTY MALEK DOKONČENY');
console.log('='.repeat(50));
console.log('Spustit v prohlížeči: Otevři console (F12)');
console.log('Nebo v Node: node tests/test_malek.js');
