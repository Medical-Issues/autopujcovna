/**
 * Layout komponenty - navigace, notifikace, header
 */

import { el, icon, button, statusBadge } from './components.js';
import * as handlers from '../infrastructure/handlers.js';

/**
 * Hlavní navigační menu
 */
export function renderNavigation(state) {
    const { currentView } = state.ui;
    const { isAuthenticated, user } = state.auth;
    
    const navItems = [
        { view: 'vehicles', label: 'Vozidla', icon: 'car' },
        { view: 'reservations', label: 'Rezervace', icon: 'calendar' }
    ];
    
    const nav = el('nav', { className: 'bg-white border-b border-gray-200 mb-6' },
        el('div', { className: 'max-w-6xl mx-auto px-4' },
            el('div', { className: 'flex items-center justify-between h-16' },
                // Logo a brand
                el('div', { className: 'flex items-center gap-2' },
                    icon('car', 28),
                    el('span', { className: 'text-xl font-bold text-gray-900' }, 'AutoPůjčovna')
                ),
                
                // Navigace
                el('div', { className: 'flex items-center gap-1' },
                    navItems.map(item => el('button', {
                        className: `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentView === item.view || currentView === `${item.view}-detail`
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`,
                        onClick: () => handlers.onNavigate(item.view)
                    }, icon(item.icon, 18), item.label))
                ),
                
                // Uživatel
                isAuthenticated 
                    ? el('div', { className: 'flex items-center gap-3' },
                        el('div', { className: 'flex items-center gap-2' },
                            icon('user', 18),
                            el('span', { className: 'text-sm font-medium' }, user?.name || 'Uživatel'),
                            statusBadge(user?.role || 'guest', { className: 'text-xs' })
                        ),
                        button('', () => handlers.onLogout(), { 
                            variant: 'ghost', 
                            icon: icon('logout', 18),
                            title: 'Odhlásit'
                        })
                    )
                    : button('Přihlásit', () => handlers.onOpenModal('login'), { 
                        variant: 'secondary',
                        icon: icon('login', 18)
                    })
            )
        )
    );
    
    return nav;
}

/**
 * Notifikace
 */
export function renderNotifications(state) {
    const notifications = state.ui.notifications.slice(-5); // Posledních 5
    
    if (notifications.length === 0) return null;
    
    return el('div', { className: 'fixed top-20 right-4 z-50 space-y-2' },
        notifications.map(n => {
            const colors = {
                success: 'bg-green-50 border-green-200 text-green-800',
                error: 'bg-red-50 border-red-200 text-red-800',
                warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                info: 'bg-blue-50 border-blue-200 text-blue-800'
            };
            
            return el('div', {
                className: `p-4 rounded-lg border shadow-lg max-w-sm ${colors[n.type] || colors.info}`,
                'data-notification-id': n.id
            },
                el('div', { className: 'flex items-start gap-3' },
                    icon(n.type === 'success' ? 'check' : n.type === 'error' ? 'x' : 'info', 20),
                    el('div', { className: 'flex-1' },
                        el('p', { className: 'font-medium' }, n.message)
                    ),
                    button('', () => handlers.onRemoveNotification(n.id), {
                        variant: 'ghost',
                        size: 'sm',
                        icon: icon('x', 16)
                    })
                )
            );
        })
    );
}

/**
 * Loading spinner
 */
export function renderLoading() {
    return el('div', { className: 'flex items-center justify-center py-12' },
        el('div', { 
            className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600' 
        })
    );
}

/**
 * Error message
 */
export function renderError(message, onRetry) {
    return el('div', { className: 'text-center py-12' },
        icon('warning', 48),
        el('p', { className: 'mt-4 text-gray-600' }, message),
        onRetry && button('Zkusit znovu', onRetry, { 
            variant: 'primary',
            className: 'mt-4'
        })
    );
}

/**
 * Footer
 */
export function renderFooter() {
    return el('footer', { className: 'mt-12 py-6 border-t border-gray-200 text-center' },
        el('p', { className: 'text-sm text-gray-500' },
            '© 2024 AutoPůjčovna - Semestrální projekt TNPW2'
        ),
        el('p', { className: 'text-xs text-gray-400 mt-1' },
            'Veselský Jan (Vehicle, State, Dispatcher, Async, Router) | Málek Jan (Reservation, Selectors, Views, Handlers, Auth)'
        )
    );
}

/**
 * Dashboard summary widget
 */
export function renderDashboardSummary(state, selectors) {
    const summary = selectors.selectAppStateSummary(state);
    
    return el('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4 mb-6' },
        el('div', { className: 'bg-white p-4 rounded-lg border border-gray-200' },
            el('div', { className: 'flex items-center justify-between' },
                el('div', {},
                    el('p', { className: 'text-sm text-gray-600' }, 'Dostupná vozidla'),
                    el('p', { className: 'text-2xl font-bold text-green-600' }, 
                        summary.vehicles.available
                    )
                ),
                el('div', { className: 'p-3 bg-green-100 rounded-lg' }, icon('car', 24))
            ),
            el('p', { className: 'text-xs text-gray-500 mt-2' },
                `z ${summary.vehicles.total} celkem`
            )
        ),
        
        el('div', { className: 'bg-white p-4 rounded-lg border border-gray-200' },
            el('div', { className: 'flex items-center justify-between' },
                el('div', {},
                    el('p', { className: 'text-sm text-gray-600' }, 'Aktivní rezervace'),
                    el('p', { className: 'text-2xl font-bold text-blue-600' }, 
                        summary.reservations.active
                    )
                ),
                el('div', { className: 'p-3 bg-blue-100 rounded-lg' }, icon('calendar', 24))
            ),
            el('p', { className: 'text-xs text-gray-500 mt-2' },
                `${summary.reservations.confirmed} potvrzených čeká`
            )
        ),
        
        el('div', { className: 'bg-white p-4 rounded-lg border border-gray-200' },
            el('div', { className: 'flex items-center justify-between' },
                el('div', {},
                    el('p', { className: 'text-sm text-gray-600' }, 'V servisu'),
                    el('p', { className: 'text-2xl font-bold text-yellow-600' }, 
                        summary.vehicles.maintenance
                    )
                ),
                el('div', { className: 'p-3 bg-yellow-100 rounded-lg' }, icon('tool', 24))
            ),
            el('p', { className: 'text-xs text-gray-500 mt-2' },
                'vyžaduje pozornost'
            )
        ),
        
        el('div', { className: 'bg-white p-4 rounded-lg border border-gray-200' },
            el('div', { className: 'flex items-center justify-between' },
                el('div', {},
                    el('p', { className: 'text-sm text-gray-600' }, 'Celkový výnos'),
                    el('p', { className: 'text-2xl font-bold text-purple-600' }, 
                        `${summary.revenue.toLocaleString()} Kč`
                    )
                ),
                el('div', { className: 'p-3 bg-purple-100 rounded-lg' }, icon('dollar', 24))
            ),
            el('p', { className: 'text-xs text-gray-500 mt-2' },
                'z dokončených rezervací'
            )
        )
    );
}
