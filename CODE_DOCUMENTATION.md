# Dokumentace Autopůjčovny - Kompletní vysvětlení kódu

## 1. ARCHITEKTURA APLIKACE

### 1.1 Struktura projektu
```
autopujcovna/
├── src/
│   ├── entities/          # Business logika (Domain Layer)
│   │   ├── Vehicle.js     # Entita vozidla
│   │   └── Reservation.js # Entita rezervace
│   ├── infrastructure/    # Infrastrukturní vrstva
│   │   ├── state.js       # Správa stavu (IR01)
│   │   ├── dispatcher.js  # Zpracování akcí (IR02)
│   │   └── handlers.js    # UI handlers (IR07)
│   ├── views/             # Prezentační vrstva (IR06)
│   │   ├── components.js  # UI komponenty
│   │   ├── vehicles.js    # Zobrazení vozidel
│   │   ├── reservations.js# Zobrazení rezervací
│   │   ├── modals.js      # Modální okna
│   │   ├── auth.js        # Autentizace (IR08)
│   │   └── layout.js      # Layout aplikace
│   ├── api/               # API vrstva (IR03)
│   │   └── mockApi.js     # Mock API
│   └── main.js            # Vstupní bod
├── tests/                 # Testy
│   ├── test_veselsky.js   # Testy pro Veselského
│   ├── test_malek.js      # Testy pro Málka
│   ├── VeselskyJan-tests.md
│   └── MalekJan-tests.md
├── index.html             # HTML vstup
└── style.css              # Styly
```

### 1.2 Architektonické vzory

#### Flux architektura (Redux-like)
Aplikace používá jednosměrný datový tok:
```
UI → Action → Dispatcher → Business Logic → State → UI
```

Komponenty:
- **Actions**: Objekty `{ type: 'ACTION_NAME', payload: data }`
- **Dispatcher**: Centrální bod pro zpracování akcí
- **State**: Jediný zdroj pravdy o aplikaci
- **Views**: Čisté funkce pro renderování UI

#### Domain-Driven Design (DDD)
- **Entity**: Vehicle, Reservation - obsahují business logiku
- **Value Objects**: Stavy, ceny
- **State Management**: Centralizovaný stav aplikace

---

## 2. INFRASTRUKTURA

### 2.1 State Management (src/infrastructure/state.js)

#### Globální stav
```javascript
const initialState = {
    vehicles: { byId: {}, allIds: [] },
    reservations: { byId: {}, allIds: [] },
    auth: { isAuthenticated: false, user: null, token: null },
    ui: { currentView: 'vehicles', filters: {}, modal: null },
    notifications: []
};
```

#### Funkce:
- `getState()` - vrací aktuální stav (neměnit přímo!)
- `mutate(action)` - jediný způsob změny stavu
- `subscribe(callback)` - notifikace o změnách

#### Mutace:
Každá mutace je čistá funkce: `(state, payload) => newState`
Příklad:
```javascript
mutate({ type: 'ADD_VEHICLE', payload: vehicle });
mutate({ type: 'UPDATE_VEHICLE', payload: updatedVehicle });
mutate({ type: 'SET_USER', payload: user });
```

### 2.2 Dispatcher (src/infrastructure/dispatcher.js)

Centrální bod pro všechny operace. Příklad průběhu:

```javascript

dispatch({ type: 'CREATE_RESERVATION', payload: { vehicleId: 'v1', ... } });


const handler = actionHandlers.get('CREATE_RESERVATION');


const result = await handler(payload, getState);


mutate({ type: 'ADD_RESERVATION', payload: savedReservation });


```

#### Bezpečnost:
Role se berou ze stavu, ne z UI:
```javascript
const userRole = state.auth.user?.role || 'guest';
```

### 2.3 Mock API (src/api/mockApi.js)

Simuluje asynchronní API volání:
- `mockApiCall('GET', '/vehicles')` - načte vozidla
- `mockApiCall('POST', '/reservations', data)` - vytvoří rezervaci
- `mockApiCall('POST', '/auth/login', credentials)` - přihlášení

Uživatelé:
- admin@autopujcovna.cz / admin123 (role: admin)
- zamestnanec@autopujcovna.cz / emp123 (role: employee)

---

## 3. ENTITY - BUSINESS LOGIKA

### 3.1 Vehicle (src/entities/Vehicle.js)

#### Stavy vozidla (FSM):
```
DRAFT → AVAILABLE → RENTED → AVAILABLE
   ↓         ↓          ↓
DECOMMISSIONED  MAINTENANCE
```

#### Povolené přechody:
- DRAFT: → AVAILABLE, DECOMMISSIONED
- AVAILABLE: → RENTED, MAINTENANCE, DECOMMISSIONED
- RENTED: → AVAILABLE
- MAINTENANCE: → AVAILABLE, DECOMMISSIONED
- DECOMMISSIONED: → (žádné)

#### Autorizace:
```javascript
vehicle.updateStatus(newStatus, userRole)



```

#### Invarianty:
- Nelze smazat vozidlo s aktivní rezervací
- Tachometr nemůže klesnout
- DECOMMISSIONED je nevratný stav

### 3.2 Reservation (src/entities/Reservation.js)

#### Stavy rezervace (FSM):
```
NEW → CONFIRMED → ACTIVE → COMPLETED
  ↓        ↓
CANCELED  CANCELED
```

#### Povolené přechody:
- NEW: → CONFIRMED, CANCELED
- CONFIRMED: → ACTIVE, CANCELED
- ACTIVE: → COMPLETED
- COMPLETED: → (žádné)
- CANCELED: → (žádné)

#### Invarianty:
```javascript

const customerActive = reservations.filter(
    r => r.customerEmail === email && r.status === 'ACTIVE'
);
if (customerActive.length > 0) throw Error('Již má aktivní rezervaci');


if (endDate <= startDate) throw Error('Neplatné datum');


vehicle.canCreateReservation(); 
```

#### Cenotvorba:
```javascript
reservation.calculateTotalPrice(dailyRate);

```

---

## 4. VIEWS - UI KOMPONENTY

### 4.1 components.js - Základní stavební kameny

#### `el(tag, attrs, ...children)`
Vytvoří DOM element:
```javascript
el('div', { className: 'card', onClick: handler }, 
    el('h2', { text: 'Titulek' }),
    el('button', { text: 'Klikni' })
);
```

#### `icon(name, size)`
SVG ikony: car, calendar, user, check, x, plus, edit, trash, ...

#### `button(text, onClick, options)`
Tlačítka s variantami: primary, secondary, danger, success, ghost

#### `statusBadge(status)`
Barevné štítky pro stavy vozidel a rezervací

#### `input(label, value, onChange, options)`
Formulářové pole s validací

#### `select(label, value, options, onChange, config)`
Dropdown výběr

### 4.2 vehicles.js - Zobrazení vozidel

#### renderVehicleList(vehicles, state, handlers)
- Seznam vozidel s filtrováním
- Tlačítka akcí podle stavu a role uživatele
- Navigace na detail

#### renderVehicleCard(vehicle, state, handlers)
- Karta vozidla s obrázkem, informacemi
- Akce: Rezervovat, Editovat, Smazat (podle stavu)

#### renderVehicleDetail(vehicle, reservations, state, handlers)
- Detailní pohled na vozidlo
- Seznam rezervací tohoto vozidla
- Historie změn

#### renderStatusActions(vehicle, userRole, handlers)
Tlačítka pro změnu stavu:
- DRAFT → AVAILABLE
- AVAILABLE → RENTED, MAINTENANCE
- RENTED → AVAILABLE
- atd.

### 4.3 reservations.js - Zobrazení rezervací

#### renderReservationList(reservations, state, handlers)
- Seznam rezervací s filtrováním
- Status badge, datumy, zákazník

#### renderReservationRow(reservation, state, handlers)
- Řádek rezervace v tabulce
- Akce: Potvrdit, Aktivovat, Dokončit, Zrušit

#### renderReservationDetail(reservation, vehicle, state, handlers)
- Detail rezervace
- Informace o vozidle, zákazníkovi
- Timeline stavů

### 4.4 modals.js - Modální okna

#### renderCreateReservationModal(vehicle, handlers)
Formulář pro vytvoření rezervace:
- Výběr vozidla (předvyplněno)
- Zákazník (jméno, email, telefon)
- Datum vyzvednutí a vrácení
- Výpočet ceny (dynamicky)

#### renderLoginModal(handlers)
Přihlašovací formulář s demo účty

#### renderCompleteReservationModal(reservation, vehicle, handlers)
Formulář pro dokončení rezervace:
- Finální stav tachometru
- Poznámky
- Výpočet případných pokut/přejezdů

### 4.5 auth.js - Autentizace

#### renderLoginView(handlers)
Celá stránka přihlášení s:
- Formulářem
- Demo účty (admin, employee)
- Validací

### 4.6 layout.js - Layout

#### renderNavigation(state, handlers)
Horní navigace s:
- Logem
- Menu (Vozidla, Rezervace)
- Tlačítko přihlášení/uživatel

#### renderNotifications(notifications, handlers)
Toast notifikace (success, error, warning)

---

## 5. HANDLERS - UI → AKCE

Soubor: `src/infrastructure/handlers.js`

Převádí uživatelské interakce na dispatch akcí:

```javascript
export function createHandlers(dispatch) {
    return {
        
        onLogin: (credentials) => dispatch({ type: 'LOGIN', payload: credentials }),
        onLogout: () => dispatch({ type: 'LOGOUT' }),
        
        
        onNavigate: (view) => dispatch({ type: 'NAVIGATE', payload: { view } }),
        
        
        onUpdateVehicleStatus: (id, status) => 
            dispatch({ type: 'UPDATE_VEHICLE_STATUS', payload: { vehicleId: id, newStatus: status } }),
        onDeleteVehicle: (id) => 
            dispatch({ type: 'DELETE_VEHICLE', payload: { vehicleId: id } }),
        
        
        onCreateReservation: (data) => 
            dispatch({ type: 'CREATE_RESERVATION', payload: data }),
        onConfirmReservation: (id) => 
            dispatch({ type: 'CONFIRM_RESERVATION', payload: { reservationId: id } }),
        onActivateReservation: (id) => 
            dispatch({ type: 'ACTIVATE_RESERVATION', payload: { reservationId: id } }),
        onCompleteReservation: (id, mileage) => 
            dispatch({ type: 'COMPLETE_RESERVATION', payload: { reservationId: id, finalMileage: mileage } }),
        onCancelReservation: (id, reason) => 
            dispatch({ type: 'CANCEL_RESERVATION', payload: { reservationId: id, reason } }),
        
        
        onOpenModal: (type, data) => 
            dispatch({ type: 'OPEN_MODAL', payload: { type, data } }),
        onCloseModal: () => dispatch({ type: 'CLOSE_MODAL' }),
    };
}
```

---

## 6. MAIN.JS - VSTUPNÍ BOD

Inicializace aplikace:

```javascript

registerAllActions();


dispatch({ type: 'FETCH_VEHICLES' });
dispatch({ type: 'FETCH_RESERVATIONS' });


render();


subscribe(() => render());
```

---

## 7. PŘÍKLADY POUŽITÍ

### 7.1 Vytvoření rezervace

```javascript

handlers.onOpenModal('createReservation', { vehicleId: 'v1' });


handlers.onCreateReservation({
    vehicleId: 'v1',
    customerName: 'Jan Novák',
    customerEmail: 'jan@seznam.cz',
    startDate: '2024-01-15',
    endDate: '2024-01-20'
});









```

### 7.2 Změna stavu rezervace

```javascript

handlers.onConfirmReservation('r1');







handlers.onActivateReservation('r1');





handlers.onCompleteReservation('r1', 45200);



```

### 7.3 Autorizace

```javascript

if (userRole === 'admin') {
    
    
    
}


if (userRole === 'employee') {
    
    
    
}


if (!isAuthenticated) {
    
    
    
}
```

---

## 8. BEZPEČNOSTNÍ ASPEKTY

### 8.1 Autentizace
- JWT token uložen v paměti (ne localStorage - XSS)
- Role ze serveru, ne z UI
- Každá akce ověřuje oprávnění

### 8.2 Autorizace
```

const userRole = getState().auth.user?.role;


function handler(data, userRole) { ... } 
```

### 8.3 Validace dat
- Všechny vstupy validovány v entitách
- Datumy kontrolovány (vrácení > vyzvednutí)
- Email formát, telefonní čísla
- Číselné hodnoty (tachometr, cena)

### 8.4 Invarianty
```

- Max 1 ACTIVE rezervace na zákazníka
- Vozidlo není dvakrát půjčeno současně
- Tachometr neroste zpětně
- Stavy FSM dodržují přechody
```

---

## 9. TESTY

### 9.1 Testovací strategie

**Jednotkové testy (test_malek.js, test_veselsky.js):**
- Testují izolované funkce
- Mock datové vrstvy
- Kontrola FSM přechodů
- Validace invariantů

**Integrační testy:**
- Dispatcher + State
- Entity + Mock API

**E2E testy:**
- Celé uživatelské scénáře
- UI interakce

### 9.2 Spuštění testů

```bash
# Node.js
node tests/test_veselsky.js
node tests/test_malek.js

# Prohlížeč - otevřít console a vložit kód
```

### 9.3 Co testy kontrolují

**Vehicle FSM:**
- Povolené a zakázané přechody stavů
- Autorizace podle rolí
- Invarianty (DECOMMISSIONED nevratný)

**Reservation FSM:**
- Správný tok stavů
- Zákaz jedné ACTIVE rezervace
- Validace dat

**State Management:**
- Immutabilita stavu
- Správné mutace
- Subscribers notifikace

**Dispatcher:**
- Registrace handlerů
- Správné volání akcí
- Error handling

---

## 10. TECHNICKÉ DETaily

### 10.1 Vanilla JS - Bez frameworku
Aplikace používá čistý JavaScript:
- `document.createElement()` místo JSX
- `addEventListener()` místo onClick props
- `className` string místo CSS-in-JS
- Manuální DOM diffing (jednoduchý)

### 10.2 Proč bez frameworku?
- Jasná architektura (žádná magie)
- Plná kontrola nad DOM
- Malá velikost (žádný bundle)
- Výuka principů (ne API frameworku)

### 10.3 Tailwind CSS
Utility-first CSS framework:
- `bg-blue-600` = modré pozadí
- `px-4 py-2` = padding
- `rounded-lg` = zaoblené rohy
- `hover:bg-blue-700` = hover stav

### 10.4 Modularizace
ES6 moduly:
```javascript
import { Vehicle } from './entities/Vehicle.js';
import { dispatch } from './infrastructure/dispatcher.js';
import { el, button } from './views/components.js';
```

---

## 11. ODPovědnosti (Podle zadání)

### 11.1 Honza Málek (MalekJan)
**Domain Layer:**
- `Reservation.js` - FSM rezervací
- `Vehicle.js` - částečně (spolupráce)

**Infrastructure:**
- `handlers.js` - UI handlers (IR07)

**Views:**
- `components.js` - UI komponenty (IR06)
- `reservations.js` - zobrazení rezervací
- `modals.js` - modální okna
- `auth.js` - autentizace (IR08)

**Tests:**
- `test_malek.js` - 41 testů
- `MalekJan-tests.md` - dokumentace testů

### 11.2 Honza Veselský (VeselskyJan)
**Infrastructure:**
- `state.js` - State Management (IR01)
- `dispatcher.js` - Dispatcher (IR02)
- `mockApi.js` - Async operations (IR03)
- Router (IR04) - v `main.js`

**Views:**
- `vehicles.js` - zobrazení vozidel
- `layout.js` - layout aplikace

**Domain:**
- `Vehicle.js` - FSM vozidel (spolupráce)

**Tests:**
- `test_veselsky.js` - 35 testů
- `VeselskyJan-tests.md` - dokumentace testů

---

## 12. ČASTÉ SCÉNÁŘE

### 12.1 Přidání nového vozidla
1. Admin klikne "Nové vozidlo"
2. Vyplní formulář (značka, model, SPZ, cena)
3. Vozidlo se vytvoří ve stavu DRAFT
4. Admin změní stav na AVAILABLE

### 12.2 Rezervace zákazníka
1. Zákazník vybere AVAILABLE vozidlo
2. Klikne "Rezervovat"
3. Vyplní kontaktní údaje a termín
4. Systém vytvoří rezervaci ve stavu NEW
5. Zaměstnanec rezervaci potvrdí (CONFIRMED)

### 12.3 Vyzvednutí vozidla
1. Zákazník přijde v domluvený termín
2. Zaměstnanec najde rezervaci (CONFIRMED)
3. Klikne "Aktivovat"
4. Systém zkontroluje:
   - Zákazník nemá jinou aktivní rezervaci
   - Vozidlo je dostupné
5. Rezervace → ACTIVE, vozidlo → RENTED

### 12.4 Vrácení vozidla
1. Zákazník vrátí vozidlo
2. Zaměstnanec zapíše finální stav tachometru
3. Klikne "Dokončit"
4. Systém:
   - Změní rezervaci na COMPLETED
   - Uvolní vozidlo (AVAILABLE)
   - Aktualizuje tachometr

### 12.5 Servis vozidla
1. Vozidlo je poškozené
2. Admin změní stav na MAINTENANCE
3. Vozidlo není nabízeno k rezervaci
4. Po opravě: MAINTENANCE → AVAILABLE

### 12.6 Zrušení rezervace
1. Zákazník zavolá o zrušení
2. Zaměstnanec najde rezervaci (NEW nebo CONFIRMED)
3. Klikne "Zrušit" se zdůvodněním
4. Rezervace → CANCELED
5. Pokud byla CONFIRMED → vozidlo → AVAILABLE

---

## 13. PROBLÉMY A ŘEŠENÍ

### 13.1 Výkon
**Problém:** Velký seznam vozidel/rezervací zpomaluje render.
**Řešení:** Virtual scrolling, paginace, nebo filtry na serveru.

### 13.2 Konkurence
**Problém:** Dva uživatelé chtějí stejné vozidlo současně.
**Řešení:** Optimistic locking, nebo atomic operace na backendu.

### 13.3 Offline
**Problém:** Uživatel ztratí připojení.
**Řešení:** Service Worker, localStorage sync, queue akcí.

---

## 14. DALŠÍ ROZVOJ

### 14.1 Možná vylepšení
- Real-time notifikace (WebSocket)
- Platební brána
- Systém recenzí
- Sledování polohy vozidla (GPS)
- Automatické upomínky
- Statistiky a reporting

### 14.2 Technické vylepšení
- TypeScript pro typovou bezpečnost
- Unit testy s Jest
- E2E testy s Playwright
- CI/CD pipeline
- Docker containerizace

---

## 15. ZÁVĚR

Tato aplikace demonstruje:
- **Flux architekturu** bez Redux
- **Domain-Driven Design** v JavaScriptu
- **Finite State Machines** pro business logiku
- **Čistou separaci** UI, business logiky a infrastruktury
- **Bezpečnost** pomocí autorizace na backendu

**Klíčové principy:**
1. Jeden zdroj pravdy (State)
2. Jednosměrný datový tok (Dispatcher)
3. Čisté funkce pro UI (Views)
4. Enkapsulace business logiky (Entities)
5. Bezpečnost na všech vrstvách

**Pro obhajobu:**
- Rozumíte architektuře Flux
- Umíte vysvětlit FSM a invariety
- Dokážete obhájit rozdělení odpovědností
- Máte testy pokrývající kritické cesty
