# Evaluation Checklist - Semestrální projekt Architektura SPA

## Tým: Veselský Jan & Málek Jan
## Projekt: Rezervační systém autopůjčovny

---

## 1. STRUKTURA PROJEKTU (60 bodů)

### 1.1 Architektonické vrstvy
- [x] **Stav** - centrální datový model (`src/infrastructure/state.js`)
- [x] **Akce** - pojmenované záměry (`src/infrastructure/dispatcher.js`)
- [x] **Dispatcher** - centrální interpretace akcí (`src/infrastructure/dispatcher.js`)
- [x] **Selektory** - výběr dat pro pohledy (`src/selectors/index.js`)
- [x] **Pohledy** - projekce stavu do UI (`src/views/`)
- [x] **Infrastruktura** - API, persistence, routing, auth (`src/infrastructure/`, `src/api/`)

### 1.2 Business entity se stavovými automaty
- [x] **Vehicle** (Veselský Jan)
  - [x] Stavy: DRAFT, AVAILABLE, RENTED, MAINTENANCE, DECOMMISSIONED
  - [x] Povolené přechody definovány
  - [x] Invarianty implementovány (nelze smazat RENTED, tachometr neklesá)
- [x] **Reservation** (Málek Jan)
  - [x] Stavy: NEW, CONFIRMED, ACTIVE, COMPLETED, CANCELED
  - [x] Povolené přechody definovány
  - [x] Invarianty implementovány (max 1 ACTIVE, datum vrácení > půjčení)

### 1.3 Infrastrukturní role (min. 2 na studenta)

#### Veselský Jan:
- [x] **IR01 - State Management** (`src/infrastructure/state.js`)
  - [x] Definice struktury globálního stavu
  - [x] Inicializace stavu
  - [x] Řízené aktualizace přes mutace
  - [x] Oddělení doménových a technických dat
  
- [x] **IR02 - Dispatcher** (`src/infrastructure/dispatcher.js`)
  - [x] Centrální zpracování akcí
  - [x] Interpretace action.type
  - [x] Volání business funkcí
  - [x] Vyvolání změn stavu
  
- [x] **IR03 - Asynchronní operace** (`src/api/mockApi.js`)
  - [x] Komunikace s Mock API
  - [x] Práce s časem a čekáním
  - [x] Zpracování SUCCESS/REJECTED/ERROR
  - [x] Přechody do loading/error stavů
  
- [x] **IR04 - Router** (`src/infrastructure/router.js`)
  - [x] Mapování URL na aplikační kontext
  - [x] Synchronizace stavu s adresou prohlížeče
  - [x] Převod URL → akce
  - [x] Reakce na změny historie

#### Málek Jan:
- [x] **IR05 - Selektory** (`src/selectors/index.js`)
  - [x] Filtrování kolekcí
  - [x] Odvozené hodnoty (isAvailable, canReserve, totalPrice)
  - [x] Pojmenování významových stavů
  - [x] Příprava dat pro pohledy
  
- [x] **IR06 - Renderovací logika** (`src/views/`)
  - [x] Převod view-state na UI strukturu
  - [x] Podmíněné zobrazení částí UI
  - [x] Sestavení DOM stromu
  
- [x] **IR07 - Handlery** (`src/infrastructure/handlers.js`)
  - [x] Definice handlerů (onReserve, onCancel)
  - [x] Mapování interakcí na dispatch(action)
  - [x] Izolace UI od business logiky
  
- [x] **IR08 - Autentizace** (`src/views/auth.js`, `src/infrastructure/state.js`)
  - [x] Uložení identity uživatele
  - [x] Práce s tokenem
  - [x] Inicializace autentizačního stavu
  - [x] Předávání identity API vrstvě

---

## 2. INDIVIDUÁLNÍ HODNOCENÍ (15 bodů)

### 2.1 Veselský Jan (I2400593)

#### Business entita Vehicle
- [x] Implementace třídy Vehicle
- [x] Definice stavů (VehicleStatus)
- [x] Definice přechodů (VehicleTransitions)
- [x] Metoda canTransitionTo()
- [x] Metoda updateStatus() s validací práv
- [x] Metoda updateMileage() s invariantem
- [x] Metoda canDeleteOrDecommission()
- [x] Metoda checkAvailability()
- [x] Metoda canCreateReservation()
- [x] Serializace/deserializace (toJSON/fromJSON)

#### Testovací scénáře
- [x] Testy pro všechny stavy a přechody Vehicle
- [x] Testy pro invarianty Vehicle
- [x] Testy pro IR01 State Management
- [x] Testy pro IR02 Dispatcher
- [x] Testy pro IR03 Async operace
- [x] Testy pro IR04 Router

**Body: ___ / 15**

### 2.2 Málek Jan (I2400577)

#### Business entita Reservation
- [x] Implementace třídy Reservation
- [x] Definice stavů (ReservationStatus)
- [x] Definice přechodů (ReservationTransitions)
- [x] Metoda canTransitionTo()
- [x] Metoda confirm() s validací vozidla
- [x] Metoda confirmPickup() s kontrolou práv
- [x] Metoda confirmReturn() s kontrolou práv
- [x] Metoda cancel() s rozlišením rolí
- [x] Metoda handleVehicleMaintenance()
- [x] Metoda hasDateConflict()
- [x] Factory metoda createReservation()
- [x] Výpočet ceny calculateTotalPrice()
- [x] Serializace/deserializace (toJSON/fromJSON)

#### Testovací scénáře
- [x] Testy pro všechny stavy a přechody Reservation
- [x] Testy pro invarianty Reservation
- [x] Testy pro IR05 Selektory
- [x] Testy pro IR06 Views
- [x] Testy pro IR07 Handlery
- [x] Testy pro IR08 Autentizace

**Body: ___ / 15**

---

## 3. DOKUMENTACE (15 bodů)

### 3.1 Architektonický popis
- [x] README.md s popisem architektury
- [x] Seznam business entit a jejich stavových automatů
- [x] Popis infrastrukturních rolí (IR01-IR08)
- [x] Mapování odpovědností na členy týmu

### 3.2 Popis akcí a dispatch mechanismu
- [ ] Dokumentace všech akcí (seznam, payload, výsledek) - *Doplnit ACTIONS.md*
- [x] Popis dispatch mechanismu v kódu
- [x] Popis mutací stavu

### 3.3 Rozdělení práce (aktualizované)
- [x] Rozdělení odpovědností v README.md
- [x] Business entity přiřazeny konkrétním studentům
- [x] Infrastrukturní role přiřazeny konkrétním studentům (min. 2 na studenta)
- [x] Popis rozhraní mezi částmi

### 3.4 Testovací scénáře
- [x] Testy pro Veselský Jan (`tests/VeselskyJan-tests.md`)
- [x] Testy pro Málek Jan (`tests/MalekJan-tests.md`)
- [x] Pokrytí všech odpovědností

**Body: ___ / 15**

---

## 4. TECHNICKÁ KÁZEŇ (10 bodů)

### 4.1 Povolené technologie
- [x] Vanilla JavaScript (ES6+)
- [x] Single-Page Application
- [x] Centrální stav s řízenými změnami

### 4.2 Zakázané technologie - NENÍ POUŽITO
- [x] React - NEPOUŽITO
- [x] Vue - NEPOUŽITO
- [x] Angular - NEPOUŽITO
- [x] Svelte - NEPOUŽITO
- [x] Redux - NEPOUŽITO
- [x] MobX - NEPOUŽITO
- [x] SSR - NEPOUŽITO

### 4.3 Práce s DOM (bod 9 zadání)
- [x] Bez použití innerHTML
- [x] Použití document.createElement
- [x] Skládání stromu prvků
- [x] Čisté renderovací funkce (projekce stavu)

### 4.4 CSS
- [x] Použití Tailwind CSS (povoleno)
- [x] CSS slouží pouze k čitelnosti
- [x] Bez komplexních layoutů v CSS

### 4.5 Architektonická pravidla
- [x] Business logika je mimo View
- [x] Žádná přímá mutace stavu mimo dispatcher
- [x] Autorizace je v business logice, ne v UI
- [x] Infrastrukturní role nejsou sloučeny bez zdůvodnění

**Body: ___ / 10**

---

## 5. SEKUNDÁRNÍ KRITERIA (nezáporné body)

### 5.1 Git historie / Evidence práce
- [ ] Commit history dokumentuje vývoj
- [ ] Commity jsou přiřazeny konkrétním členům týmu

### 5.2 Funkčnost celku
- [x] Aplikace se spustí bez chyb
- [x] Navigace mezi pohledy funguje
- [x] CRUD operace pro vozidla fungují
- [x] Stavový automat vozidel funguje
- [x] CRUD operace pro rezervace fungují
- [x] Stavový automat rezervací funguje
- [x] Filtrování a vyhledávání funguje
- [x] Autentizace funguje (demo účty)

### 5.3 UI/UX (nepovinné, nebodováno)
- [x] Responzivní design
- [x] Notifikace o změnách
- [x] Dashboard s přehledem
- [ ] Animace a přechody

---

## CELKOVÉ HODNOCENÍ

| Kategorie | Max | Získáno |
|-----------|-----|---------|
| Architektura aplikace | 60 | ___ |
| Individuální hodnocení | 15 | ___ |
| Dokumentace | 15 | ___ |
| Technická kázeň | 10 | ___ |
| **CELKEM** | **100** | **___** |

---

## PODMÍNKY SPLNĚNÍ

- [x] Výstup 1 (Rozdělení odpovědností) byl odevzdán v termínu
- [x] Výstup 2 (Kompletní projekt) obsahuje:
  - [x] Zdrojový kód
  - [x] Dokumentaci
  - [x] Testovací scénáře
  - [x] Evaluation checklist

---

## Poznámky hodnotitele:

_
_
_

---

**Datum hodnocení:** ___________

**Hodnotitel:** ___________
