import { getState, subscribe } from './infrastructure/state.js';
import { dispatch } from './infrastructure/dispatcher.js';
import { initRouter, updateUrlFromState } from './infrastructure/router.js';
import * as selectors from './selectors/index.js';
import { renderVehiclesView, renderVehicleDetailView } from './views/vehicles.js';
import { renderReservationsView, renderReservationDetailView } from './views/reservations.js';
import { renderModal } from './views/modals.js';
import { renderNavigation, renderNotifications, renderFooter, renderDashboardSummary } from './views/layout.js';
import { renderLoginModal } from './views/auth.js';
import { el, clear } from './views/components.js';


const appElement = document.getElementById('app');

function render() {
    const state = getState();
    const { currentView } = state.ui;
    
    clear(appElement);
    
    if (!state.auth.isAuthenticated) {
        
        
    }
    
    
    const layout = el('div', { className: 'min-h-screen' });
    
    
    layout.appendChild(renderNavigation(state));
    
    
    const mainContent = el('main', { className: 'max-w-6xl mx-auto px-4 py-6' });
    
    
    if (currentView === 'vehicles' || currentView === 'reservations') {
        mainContent.appendChild(renderDashboardSummary(state, selectors));
    }
    
    
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
    
    
    layout.appendChild(renderFooter());
    
    
    const notifications = renderNotifications(state);
    if (notifications) {
        layout.appendChild(notifications);
    }
    
    
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

    appElement.appendChild(layout);
}

async function init() {
    console.log('[App] Inicializace...');

    initRouter();

    subscribe((newState, oldState, mutation) => {
        console.log('[State] Změna:', mutation.type);
        updateUrlFromState(newState);
        render();
    });

    try {
        await dispatch({ type: 'FETCH_VEHICLES' });
        await dispatch({ type: 'FETCH_RESERVATIONS' });
    } catch (error) {
        console.error('[App] Chyba při načítání dat:', error);
    }

    render();
    
    console.log('[App] Inicializace dokončena');
}

init();
