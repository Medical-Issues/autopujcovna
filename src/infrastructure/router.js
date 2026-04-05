/**
 * Router (IR04) - Navigační logika
 * Odpovědnost: Veselský Jan
 * Zajišťuje: mapování URL na aplikační kontext, synchronizaci adresy prohlížeče se stavem,
 *            převod URL → akce, reakci na změny historie
 */

import { dispatch } from './dispatcher.js';

// Definice rout
const routes = {
    '/': { view: 'vehicles', title: 'Vozidla' },
    '/vehicles': { view: 'vehicles', title: 'Vozidla' },
    '/vehicles/:id': { view: 'vehicle-detail', title: 'Detail vozidla' },
    '/reservations': { view: 'reservations', title: 'Rezervace' },
    '/reservations/:id': { view: 'reservation-detail', title: 'Detail rezervace' }
};

/**
 * Parsování URL a extrakce parametrů
 */
function parseUrl(url) {
    const path = url.replace(window.location.origin, '').replace(/^#/, '');
    const parts = path.split('/').filter(p => p);
    
    for (const [route, config] of Object.entries(routes)) {
        const routeParts = route.split('/').filter(p => p);
        
        if (routeParts.length !== parts.length && !route.includes(':')) {
            continue;
        }
        
        const params = {};
        let match = true;
        
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                params[routeParts[i].slice(1)] = parts[i];
            } else if (routeParts[i] !== parts[i]) {
                match = false;
                break;
            }
        }
        
        if (match) {
            return { ...config, params, path };
        }
    }
    
    return { view: 'not-found', title: 'Stránka nenalezena', params: {}, path };
}

/**
 * Aktualizace URL podle stavu aplikace
 */
export function updateUrlFromState(state) {
    const { currentView, selectedVehicleId, selectedReservationId } = state.ui;
    
    let newPath;
    
    switch (currentView) {
        case 'vehicles':
            newPath = '/vehicles';
            break;
        case 'vehicle-detail':
            newPath = selectedVehicleId ? `/vehicles/${selectedVehicleId}` : '/vehicles';
            break;
        case 'reservations':
            newPath = '/reservations';
            break;
        case 'reservation-detail':
            newPath = selectedReservationId ? `/reservations/${selectedReservationId}` : '/reservations';
            break;
        default:
            newPath = '/';
    }
    
    const currentPath = window.location.hash.replace(/^#/, '') || '/';
    
    if (newPath !== currentPath) {
        window.history.pushState(null, '', `#${newPath}`);
    }
}

/**
 * Zpracování změny URL
 */
export function handleRouteChange() {
    const hash = window.location.hash || '#/';
    const routeInfo = parseUrl(hash);
    
    // Aktualizace titulu stránky
    document.title = `${routeInfo.title} - Rezervační systém autopůjčovny`;
    
    // Dispatch navigace
    const navigatePayload = { view: routeInfo.view };
    
    if (routeInfo.params.id) {
        if (routeInfo.view === 'vehicle-detail') {
            navigatePayload.vehicleId = routeInfo.params.id;
        } else if (routeInfo.view === 'reservation-detail') {
            navigatePayload.reservationId = routeInfo.params.id;
        }
    }
    
    dispatch({
        type: 'NAVIGATE',
        payload: navigatePayload
    });
    
    return routeInfo;
}

/**
 * Inicializace routeru
 */
export function initRouter() {
    // Poslouchání změn historie
    window.addEventListener('popstate', () => {
        handleRouteChange();
    });
    
    // Zpracování initial URL
    handleRouteChange();
}

/**
 * Programatická navigace
 */
export function navigateTo(path) {
    window.location.hash = path;
}

/**
 * Generování linku
 */
export function generateLink(view, id = null) {
    switch (view) {
        case 'vehicles':
            return '#/vehicles';
        case 'vehicle-detail':
            return id ? `#/vehicles/${id}` : '#/vehicles';
        case 'reservations':
            return '#/reservations';
        case 'reservation-detail':
            return id ? `#/reservations/${id}` : '#/reservations';
        default:
            return '#/';
    }
}
