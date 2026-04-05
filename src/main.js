/**
 * Hlavní vstupní bod aplikace
 */

import { getState, subscribe } from './infrastructure/state.js';
import { dispatch } from './infrastructure/dispatcher.js';
import { initRouter } from './infrastructure/router.js';
import * as selectors from './selectors/index.js';
import { renderVehiclesView, renderVehicleDetailView } from './views/vehicles.js';
import { renderReservationsView, renderReservationDetailView } from './views/reservations.js';
import { renderModal } from './views/modals.js';
import { renderNavigation, renderNotifications, renderFooter, renderDashboardSummary } from './views/layout.js';
import { renderLoginModal } from './views/auth.js';
import { el, clear } from './views/components.js';

// Hlavní aplikační kontejner
const appElement = document.getElementById('app');

/**
 * Hlavní render funkce
 */
function render() {
    const state = getState();
    const { currentView } = state.ui;
    
    // Vyčištění kontejneru
    clear(appElement);
    
    // Pokud není uživatel přihlášen, zobrazit login
    if (!state.auth.isAuthenticated) {
        // Můžeme zobrazit přihlašovací obrazovku nebo pokračovat s omezenými právy
        // Pro demo účely pokračujeme
    }
    
    // Sestavení UI
    const layout = el('div', { className: 'min-h-screen' });
    
    // Navigace
    layout.appendChild(renderNavigation(state));
    
    // Hlavní obsah
    const mainContent = el('main', { className: 'max-w-6xl mx-auto px-4 py-6' });
    
    // Dashboard summary na hlavní stránce
    if (currentView === 'vehicles' || currentView === 'reservations') {
        mainContent.appendChild(renderDashboardSummary(state, selectors));
    }
    
    // Render aktuálního pohledu
    let viewContent;
    switch (currentView) {
        case 'vehicles':
            viewContent = renderVehiclesView(state, selectors);
            break;
        case 'vehicle-detail':
            viewContent = renderVehicleDetailView(state, selectors);
            break;
        case 'reservations':
            viewContent = renderReservationsView(state, selectors);
            break;
        case 'reservation-detail':
            viewContent = renderReservationDetailView(state, selectors);
            break;
        default:
            viewContent = el('div', { className: 'text-center py-12' },
                el('h2', { className: 'text-xl font-bold' }, 'Stránka nenalezena'),
                el('p', { className: 'text-gray-600' }, 'Požadovaná stránka neexistuje.')
            );
    }
    
    mainContent.appendChild(viewContent);
    layout.appendChild(mainContent);
    
    // Footer
    layout.appendChild(renderFooter());
    
    // Notifikace (fixed position)
    const notifications = renderNotifications(state);
    if (notifications) {
        layout.appendChild(notifications);
    }
    
    // Modal
    if (state.ui.modal.isOpen) {
        if (state.ui.modal.type === 'login') {
            const modalContainer = el('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
            },
                el('div', { className: 'bg-white rounded-xl shadow-xl max-w-md w-full' },
                    el('div', { className: 'p-6' }, renderLoginModal())
                )
            );
            layout.appendChild(modalContainer);
        } else {
            const modal = renderModal(state, selectors);
            if (modal) {
                layout.appendChild(modal);
            }
        }
    }
    
    // Přidání do DOM
    appElement.appendChild(layout);
}

/**
 * Inicializace aplikace
 */
async function init() {
    console.log('[App] Inicializace...');
    
    // Inicializace routeru
    initRouter();
    
    // Registrace subscribera pro re-render
    subscribe((newState, oldState, mutation) => {
        console.log('[State] Změna:', mutation.type);
        render();
    });
    
    // Načtení inicializačních dat
    try {
        await dispatch({ type: 'FETCH_VEHICLES' });
        await dispatch({ type: 'FETCH_RESERVATIONS' });
    } catch (error) {
        console.error('[App] Chyba při načítání dat:', error);
    }
    
    // První render
    render();
    
    console.log('[App] Inicializace dokončena');
}

// Spuštění aplikace
init();
