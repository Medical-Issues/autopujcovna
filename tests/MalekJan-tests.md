# Testovací scénáře - Málek Jan
## Odpovědnost: Reservation Entity + IR05-IR08 (Selectors, Views, Handlers, Auth)

---

## Část 1: Business Entita - Reservation (Stavový automat)

### TC-RES1: Inicializace rezervace s výchozím stavem NEW
**Vstup:** `new Reservation({customerName: 'Petr Novák', vehicleId: 'v1'})`
**Očekávaný výstup:** 
- `reservation.status === 'NEW'`
- `reservation.id` je vygenerováno
- `reservation.createdAt` je nastaveno

### TC-RES2: Validní přechod NEW → CONFIRMED (vozidlo AVAILABLE)
**Vstup:** 
- Reservation se stavem `NEW`
- Vehicle se stavem `AVAILABLE`
- `userRole = 'admin'`
**Akce:** `reservation.confirm(vehicle, 'admin')`
**Očekávaný výstup:**
- `{success: true, reservation: {...}}`
- `reservation.status === 'CONFIRMED'`
- `reservation.updatedAt` aktualizováno

### TC-RES3: Nevalidní přechod NEW → CONFIRMED (vozidlo není AVAILABLE)
**Vstup:** 
- Reservation se stavem `NEW`
- Vehicle se stavem `MAINTENANCE`
**Akce:** `reservation.confirm(vehicle, 'admin')`
**Očekávaný výstup:**
- `{success: false, error: 'Vozidlo není dostupné pro rezervaci'}`
- Stav zůstává `NEW`

### TC-RES4: Přechod CONFIRMED → ACTIVE (fyzické předání vozu)
**Vstup:** 
- Reservation se stavem `CONFIRMED`
- `userRole = 'employee'`
**Akce:** `reservation.confirmPickup('employee')`
**Očekávaný výstup:**
- `{success: true, reservation: {...}}`
- `reservation.status === 'ACTIVE'`
- `reservation.actualStartDate` je nastaveno
- `reservation.updatedAt` aktualizováno

### TC-RES5: Nevalidní přechod CONFIRMED → ACTIVE (nedostatečná práva)
**Vstup:** Reservation se stavem `CONFIRMED`
**Akce:** `reservation.confirmPickup('customer')`
**Očekávaný výstup:**
- `{success: false, error: 'Nedostatečná práva pro tuto operaci'}`

### TC-RES6: Přechod ACTIVE → COMPLETED (vrácení vozu)
**Vstup:** 
- Reservation se stavem `ACTIVE`
- `userRole = 'admin'`
**Akce:** `reservation.confirmReturn('admin')`
**Očekávaný výstup:**
- `{success: true, reservation: {...}}`
- `reservation.status === 'COMPLETED'`
- `reservation.actualEndDate` je nastaveno

### TC-RES7: Přechod CONFIRMED → CANCELED (storno zákazníkem)
**Vstup:** 
- Reservation se stavem `CONFIRMED`
- `userRole = 'customer'`
**Akce:** `reservation.cancel('customer', 'Změna plánů')`
**Očekávaný výstup:**
- `{success: true, reservation: {...}}`
- `reservation.status === 'CANCELED'`
- `reservation.notes` obsahuje 'Zrušeno: Změna plánů'

### TC-RES8: Nevalidní přechod ACTIVE → CANCELED (zákazník nemůže zrušit aktivní)
**Vstup:** 
- Reservation se stavem `ACTIVE`
- `userRole = 'customer'`
**Akce:** `reservation.cancel('customer', 'Změna plánů')`
**Očekávaný výstup:**
- `{success: false, error: 'Nelze zrušit aktivní rezervaci'}`

### TC-RES9: Invariant - datum vrácení musí být po datu půjčení
**Vstup:** 
- `startDate = '2024-01-15'`
- `endDate = '2024-01-10'` (před startem)
**Akce:** `Reservation.createReservation({startDate, endDate, ...})`
**Očekávaný výstup:**
- `{success: false, error: 'Datum vrácení musí být po datu půjčení'}`

### TC-RES10: Validní vytvoření rezervace s výpočtem ceny
**Vstup:**
- `startDate = '2024-01-10'`
- `endDate = '2024-01-15'` (5 dní)
- `vehicle.dailyRate = 500`
**Akce:** `Reservation.createReservation({...}, vehicle)`
**Očekávaný výstup:**
- `{success: true, reservation: {...}}`
- `reservation.totalPrice === 2500` (5 × 500)

### TC-RES11: Detekce kolize termínů
**Vstup:**
- Existující rezervace: 10.1. - 15.1.
- Nová rezervace: 12.1. - 18.1. (překryv)
**Akce:** `reservation1.hasDateConflict(reservation2)`
**Očekávaný výstup:** `true`

### TC-RES12: Žádná kolize pro zrušené rezervace
**Vstup:**
- Rezervace 1: CANCELED, 10.1. - 15.1.
- Rezervace 2: NEW, 12.1. - 18.1.
**Akce:** `reservation2.hasDateConflict(reservation1)`
**Očekávaný výstup:** `false`

### TC-RES13: Reakce na změnu dostupnosti vozidla (MAINTENANCE)
**Vstup:** 
- Reservation se stavem `CONFIRMED`
- Vehicle přešlo do `MAINTENANCE`
**Akce:** `reservation.handleVehicleMaintenance()`
**Očekávaný výstup:**
- `{success: true, action: 'BLOCKED', message: 'Vozidlo je v údržbě...'}`

### TC-RES14: Terminální stav COMPLETED - nelze měnit
**Vstup:** Reservation se stavem `COMPLETED`
**Akce:** `reservation.canTransitionTo('ACTIVE')`
**Očekávaný výstup:** `false`

### TC-RES15: Terminální stav CANCELED - nelze měnit
**Vstup:** Reservation se stavem `CANCELED`
**Akce:** `reservation.canTransitionTo('CONFIRMED')`
**Očekávaný výstup:** `false`

---

## Část 2: IR05 - Selektory

### TC-SEL1: selectAllVehicles vrací pole všech vozidel
**Vstup:** Stav s 3 vozidly v `byId`
**Akce:** `selectAllVehicles(state)`
**Očekávaný výstup:** Pole s 3 objekty vozidel

### TC-SEL2: selectFilteredVehicles filtruje podle statusu
**Vstup:** 
- 2 vozidla AVAILABLE, 1 vozidlo MAINTENANCE
- `state.ui.filters.vehicles.status = 'AVAILABLE'`
**Akce:** `selectFilteredVehicles(state)`
**Očekávaný výstup:** Pole s 2 vozidly (jen AVAILABLE)

### TC-SEL3: selectFilteredVehicles vyhledává podle textu
**Vstup:**
- Vozidla: "Škoda Octavia", "BMW X5"
- `state.ui.filters.vehicles.search = 'bmw'`
**Akce:** `selectFilteredVehicles(state)`
**Očekávaný výstup:** Pole s 1 vozidlem (BMW X5)

### TC-SEL4: selectVehicleCounts vrací správné počty
**Vstup:** 2 AVAILABLE, 1 RENTED, 1 MAINTENANCE
**Akce:** `selectVehicleCounts(state)`
**Očekávaný výstup:** `{total: 4, available: 2, rented: 1, maintenance: 1, ...}`

### TC-SEL5: selectIsVehicleAvailable pro AVAILABLE vozidlo
**Vstup:** Vehicle `v1` se stavem `AVAILABLE`
**Akce:** `selectIsVehicleAvailable(state, 'v1')`
**Očekávaný výstup:** `true`

### TC-SEL6: selectCanCreateReservation pro MAINTENANCE vozidlo
**Vstup:** Vehicle `v1` se stavem `MAINTENANCE`
**Akce:** `selectCanCreateReservation(state, 'v1')`
**Očekávaný výstup:** `false`

### TC-SEL7: selectConflictingReservations detekuje překryv
**Vstup:**
- Existující rezervace: vehicleId='v1', 10.1.-15.1., CONFIRMED
**Akce:** `selectConflictingReservations(state, 'v1', '2024-01-12', '2024-01-18')`
**Očekávaný výstup:** Pole s 1 konfliktní rezervací

### TC-SEL8: selectTotalRevenue součet dokončených rezervací
**Vstup:**
- Rezervace 1: COMPLETED, totalPrice=5000
- Rezervace 2: ACTIVE, totalPrice=3000
- Rezervace 3: CANCELED, totalPrice=2000
**Akce:** `selectTotalRevenue(state)`
**Očekávaný výstup:** `8000` (COMPLETED + ACTIVE, bez CANCELED)

### TC-SEL9: selectReservationDetailData připraví data pro pohled
**Vstup:** Rezervace `r1` s vehicleId `v1`
**Akce:** `selectReservationDetailData(state, 'r1')`
**Očekávaný výstup:**
```php
{
  reservation: {...},
  vehicle: {...},
  canEdit: true/false,
  canCancel: true/false,
  canActivate: true/false,
  canComplete: true/false
}
```

---

## Část 3: IR06 - Renderovací logika (Views)

### TC-VIEW1: el() vytváří DOM element
**Vstup:** `el('div', {className: 'test'}, 'Hello')`
**Očekávaný výstup:**
- `HTMLDivElement`
- `element.className === 'test'`
- `element.textContent === 'Hello'`

### TC-VIEW2: el() podporuje event handlery
**Vstup:** `el('button', {onClick: mockHandler}, 'Click')`
**Akce:** Kliknutí na tlačítko
**Očekávaný výstup:** `mockHandler` byl vyvolán

### TC-VIEW3: cond() renderuje první pravdivou větev
**Vstup:** `cond([[false, A], [true, B], [true, C]])`
**Očekávaný výstup:** Element `B`

### TC-VIEW4: list() mapuje pole na elementy
**Vstup:** `list([1, 2, 3], x => el('span', {}, x))`
**Očekávaný výstup:** 3x `<span>` elementy s textem 1, 2, 3

### TC-VIEW5: list() zobrazí emptyRenderer pro prázdné pole
**Vstup:** `list([], renderFn, () => el('p', {}, 'Empty'))`
**Očekávaný výstup:** `<p>Empty</p>`

### TC-VIEW6: statusBadge() generuje správnou barvu
**Vstup:** `statusBadge('AVAILABLE')`
**Očekávaný výstup:** Element s třídami `bg-green-100 text-green-800`

### TC-VIEW7: renderVehiclesView() vrací strukturu pro seznam
**Vstup:** Stav s 2 vozidly
**Akce:** `renderVehiclesView(state, selectors)`
**Očekávaný výstup:** DOM struktura s header, filtry, gridem vozidel

### TC-VIEW8: renderReservationsView() zobrazuje správné akce
**Vstup:** Rezervace ve stavu CONFIRMED
**Akce:** `renderReservationsView(state, selectors)`
**Očekávaný výstup:**
- Tlačítko "Vydat vozidlo" je viditelné
- Tlačítko "Zrušit" je viditelné
- Tlačítko "Přijmout vozidlo" není viditelné

---

## Část 4: IR07 - Handlery

### TC-HAND1: onCreateVehicle dispatch akci CREATE_VEHICLE
**Vstup:** Data nového vozidla
**Akce:** `onCreateVehicle({brand: 'Audi', ...})`
**Očekávaný výstup:**
- `dispatch({type: 'CREATE_VEHICLE', payload: {...}})` bylo voláno

### TC-HAND2: onConfirmReservation dispatch akci CONFIRM_RESERVATION
**Vstup:** `reservationId = 'r1', userRole = 'admin'`
**Akce:** `onConfirmReservation('r1', 'admin')`
**Očekávaný výstup:**
- `dispatch({type: 'CONFIRM_RESERVATION', payload: {reservationId: 'r1', userRole: 'admin'}})`

### TC-HAND3: onNavigate dispatch akci NAVIGATE
**Vstup:** `view = 'reservations'`
**Akce:** `onNavigate('reservations')`
**Očekávaný výstup:**
- `dispatch({type: 'NAVIGATE', payload: {view: 'reservations'}})`

### TC-HAND4: onSetVehicleFilters dispatch akci SET_FILTERS
**Vstup:** `{status: 'AVAILABLE'}`
**Akce:** `onSetVehicleFilters({status: 'AVAILABLE'})`
**Očekávaný výstup:**
- `dispatch({type: 'SET_FILTERS', payload: {type: 'vehicles', filters: {status: 'AVAILABLE'}}})`

### TC-HAND5: Handlery neprovádějí přímou mutaci stavu
**Vstup:** Volání handleru
**Akce:** `onCreateVehicle(data)`
**Očekávaný výstup:**
- Stav není změněn přímo v handleru
- Změna proběhne až přes dispatch → mutate

---

## Část 5: IR08 - Autentizace

### TC-AUTH1: onLogin dispatch akci LOGIN
**Vstup:** `{email: 'admin@autopujcovna.cz', password: 'admin123'}`
**Akce:** `onLogin(credentials)`
**Očekávaný výstup:**
- `dispatch({type: 'LOGIN', payload: credentials})`
- Po úspěchu: `state.auth.isAuthenticated === true`
- `state.auth.user` obsahuje data uživatele

### TC-AUTH2: onLogout dispatch akci LOGOUT
**Vstup:** Přihlášený uživatel
**Akce:** `onLogout()`
**Očekávaný výstup:**
- `dispatch({type: 'LOGOUT'})`
- `state.auth.isAuthenticated === false`
- `state.auth.user === null`
- `state.auth.token === null`

### TC-AUTH3: role uživatele je uložena ve stavu
**Vstup:** Úspěšné přihlášení jako admin
**Akce:** Login flow
**Očekávaný výstup:** `state.auth.user.role === 'admin'`

### TC-AUTH4: token je uložen ve stavu
**Vstup:** Úspěšné přihlášení
**Akce:** Login flow
**Očekávaný výstup:** `state.auth.token` je nastaven (JWT simulace)

---

## Shrnutí pokrytí

| Kategorie | Počet testů | Pokrytí |
|-----------|-------------|---------|
| Reservation FSM | 15 | Všechny stavy, přechody, invarianty |
| IR05 Selectors | 9 | Filtrování, výběr, odvozené hodnoty |
| IR06 Views | 8 | DOM komponenty, renderování |
| IR07 Handlers | 5 | Mapování UI → akce |
| IR08 Auth | 4 | Login, logout, role, token |
| **CELKEM** | **41** | **Kompletní pokrytí odpovědností** |
