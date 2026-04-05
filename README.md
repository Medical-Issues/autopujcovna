# Rezervační systém autopůjčovny

Semestrální projekt TNPW2

## Členové týmu a rozdělení odpovědnosti

| Student | Business entita | Infrastrukturní role |
|---------|-----------------|---------------------|
| **Veselský Jan** (I2400593) | **Vehicle** - stavový automat vozidla | IR01 (State Management), IR02 (Dispatcher), IR03 (Async), IR04 (Router) |
| **Málek Jan** (I2400577) | **Reservation** - stavový automat rezervace | IR05 (Selectors), IR06 (Views), IR07 (Handlers), IR08 (Auth) |

## Architektura projektu

```
src/
├── entities/           # Business entity se stavovými automaty
│   ├── Vehicle.js      # DRAFT → AVAILABLE → RENTED/MAINTENANCE/DECOMMISSIONED
│   └── Reservation.js  # NEW → CONFIRMED → ACTIVE → COMPLETED/CANCELED
├── infrastructure/     # Infrastrukturní role
│   ├── state.js        # IR01 - globální state management
│   ├── dispatcher.js   # IR02 - centrální dispatch akcí
│   ├── router.js       # IR04 - URL routing a navigace
│   └── handlers.js     # IR07 - mapování UI na akce
├── api/               # Externí komunikace
│   └── mockApi.js      # IR03 - Mock API s asynchronními operacemi
├── selectors/         # IR05 - Výběr a transformace dat
│   └── index.js
├── views/             # IR06 - Renderovací logika
│   ├── components.js   # UI komponenty (el, button, input...)
│   ├── vehicles.js     # Pohledy na vozidla
│   ├── reservations.js # Pohledy na rezervace
│   ├── modals.js       # Modalní okna a formuláře
│   ├── layout.js       # Navigace, notifikace, footer
│   └── auth.js         # IR08 - Autentizace
├── utils/
├── main.js            # Vstupní bod aplikace
└── dom.js             # DOM pomocné funkce (legacy)
```

## Business entity

### Vehicle (Vozidlo)

**Stavy:** `DRAFT` → `AVAILABLE` → `RENTED`/`MAINTENANCE`/`DECOMMISSIONED`

**Invarianty:**
- Vozidlo ve stavu `RENTED` nelze smazat ani vyřadit
- Pokud status ≠ `AVAILABLE`, nelze vytvářet nové `CONFIRMED` rezervace
- Stav tachometru při návratu nesmí být nižší než při výdeji

**Přechody:**
- `DRAFT` → `AVAILABLE` (admin, validní technické údaje)
- `AVAILABLE` → `RENTED` (při aktivaci rezervace)
- `AVAILABLE` → `MAINTENANCE` (admin, nahlášena závada)
- `AVAILABLE` → `DECOMMISSIONED` (admin, prodej vozu)
- `RENTED` → `AVAILABLE` (vrácení vozu v pořádku)
- `RENTED` → `MAINTENANCE` (vrácení s poškozením)
- `MAINTENANCE` → `AVAILABLE` (servis dokončen)
- `MAINTENANCE` → `DECOMMISSIONED` (oprava nerentabilní)

### Reservation (Rezervace)

**Stavy:** `NEW` → `CONFIRMED` → `ACTIVE` → `COMPLETED`/`CANCELED`

**Invarianty:**
- Zákazník může mít v daném čase maximálně jednu `ACTIVE` rezervaci
- Pokud `vehicle.status` ≠ `AVAILABLE`, nelze přejít do `CONFIRMED`
- Datum vrácení musí být striktně po datu půjčení

**Přechody:**
- `NEW` → `CONFIRMED` (systém/pracovník, vehicle.status = AVAILABLE, platba OK)
- `NEW` → `CANCELED` (zákazník, nebo vypršení času)
- `CONFIRMED` → `ACTIVE` (pracovník, fyzické předání vozu)
- `CONFIRMED` → `CANCELED` (storno zákazníkem, nedostavení se)
- `ACTIVE` → `COMPLETED` (pracovník, převzetí vozu zpět)
- `ACTIVE` → `CONFIRMED` (chyba obsluhy, návrat stavu)

## Infrastrukturní role

### IR01 - State Management (Veselský Jan)
- Návrh globálního stavu aplikace (vehicles, reservations, ui, auth)
- Inicializace stavu
- Oddělení doménových a technických dat
- Řízené aktualizace stavu přes definované mutace

### IR02 - Dispatcher (Veselský Jan)
- Centrální zpracování akcí
- Interpretace `action.type`
- Volání business funkcí
- Vyvolání změn stavu

### IR03 - Asynchronní operace (Veselský Jan)
- Komunikace s Mock API / HTTP API
- Práce s časem a čekáním
- Zpracování SUCCESS / REJECTED / ERROR
- Přechody do loading a error stavů

### IR04 - Router (Veselský Jan)
- Mapování URL na aplikační kontext
- Synchronizace adresy prohlížeče se stavem aplikace
- Převod URL → akce
- Reakci na změny historie

### IR05 - Selektory (Málek Jan)
- Filtrování kolekcí
- Odvozené hodnoty (`isAvailable`, `canReserve`, `totalPrice`)
- Pojmenování významových stavů aplikace
- Příprava dat a capabilities pro konkrétní pohled

### IR06 - Renderovací logika (Málek Jan)
- Převod view-state na UI strukturu
- Podmíněné zobrazení částí UI
- Sestavení DOM stromu

### IR07 - Handlery (Málek Jan)
- Definice handlerů (`onReserve`, `onCancel`)
- Mapování interakcí na `dispatch(action)`
- Izolace UI od business logiky

### IR08 - Autentizace (Málek Jan)
- Uložení identity uživatele
- Práce s tokenem
- Inicializace autentizačního stavu
- Předávání identity API vrstvě

## Kontrola kvality (Code Review)

- Žádná business logika ve View
- Žádná přímá mutace stavu mimo dispatcher
- Žádná autorizace v UI

## Spuštění projektu

Otevřete `index.html` v moderním prohlížeči nebo použijte lokální server:

```bash
# Pomocí Python
python -m http.server 8080

# Pomocí Node.js (npx serve)
npx serve .

# Pomocí PHP
php -S localhost:8080
```

Pak otevřete `http://localhost:8080`.

## Demo účty

| Role | Email | Heslo |
|------|-------|-------|
| Admin | admin@autopujcovna.cz | admin123 |
| Zaměstnanec | zamestnanec@autopujcovna.cz | emp123 |

## Technologie

- Vanilla JavaScript (ES6+ moduly)
- Tailwind CSS (via CDN)
- Žádné externí frameworky (React, Vue, Angular...)
- Custom DOM rendering

## Funkcionality

- Správa vozidel (CRUD, stavový automat, správa tachometru)
- Správa rezervací (vytváření, potvrzení, vydání, vrácení, storno)
- Dashboard s přehledem statistik
- Filtrace a vyhledávání
- Notifikace o změnách
- Responzivní design