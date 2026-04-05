/**
 * Autentizace a autorizace (IR08)
 * Odpovědnost: Málek Jan
 * Zajišťuje: uložení identity uživatele, práci s tokenem,
 *            inicializaci autentizačního stavu, předávání identity API vrstvě
 * Invariant: Žádná autorizace v UI, rozhodování co smí uživatel dělat je business logika
 */

import { el, icon, button, input } from './components.js';
import * as handlers from '../infrastructure/handlers.js';

/**
 * Pohled na přihlášení
 */
export function renderLoginView(onLogin) {
    const formData = {
        email: '',
        password: ''
    };
    
    return el('div', { className: 'min-h-screen flex items-center justify-center' },
        el('div', { className: 'bg-white p-8 rounded-2xl shadow-xl max-w-md w-full' },
            el('div', { className: 'text-center mb-8' },
                el('div', { className: 'inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4' },
                    icon('car', 32)
                ),
                el('h1', { className: 'text-2xl font-bold text-gray-900' }, 'AutoPůjčovna'),
                el('p', { className: 'text-gray-600 mt-2' }, 'Přihlášení do systému')
            ),
            
            el('form', {
                className: 'space-y-4',
                onSubmit: async (e) => {
                    e.preventDefault();
                    const result = await onLogin(formData);
                    if (!result.success) {
                        alert(result.error || 'Přihlášení se nezdařilo');
                    }
                }
            },
                input('Email', '', (v) => formData.email = v, {
                    type: 'email',
                    required: true,
                    placeholder: 'admin@autopujcovna.cz'
                }),
                input('Heslo', '', (v) => formData.password = v, {
                    type: 'password',
                    required: true,
                    placeholder: '••••••'
                }),
                
                button('Přihlásit se', null, {
                    variant: 'primary',
                    className: 'w-full mt-6',
                    type: 'submit'
                })
            ),
            
            el('div', { className: 'mt-6 p-4 bg-gray-50 rounded-lg' },
                el('p', { className: 'text-sm font-medium text-gray-700 mb-2' }, 'Demo účty:'),
                el('div', { className: 'space-y-1 text-sm text-gray-600' },
                    el('p', {}, 'Admin: admin@autopujcovna.cz / admin123'),
                    el('p', {}, 'Zaměstnanec: zamestnanec@autopujcovna.cz / emp123')
                )
            )
        )
    );
}

/**
 * Login modal (pro použití v modalu)
 */
export function renderLoginModal() {
    const formData = {
        email: '',
        password: ''
    };
    
    return el('form', {
        className: 'space-y-4',
        onSubmit: async (e) => {
            e.preventDefault();
            const result = await handlers.onLogin(formData);
            if (result.success) {
                handlers.onCloseModal();
            } else {
                alert(result.error || 'Přihlášení se nezdařilo');
            }
        }
    },
        el('h2', { className: 'text-xl font-bold mb-4' }, 'Přihlášení'),
        
        input('Email', '', (v) => formData.email = v, {
            type: 'email',
            required: true,
            placeholder: 'admin@autopujcovna.cz'
        }),
        input('Heslo', '', (v) => formData.password = v, {
            type: 'password',
            required: true,
            placeholder: '••••••'
        }),
        
        el('div', { className: 'flex gap-3 pt-4' },
            button('Přihlásit', null, {
                variant: 'primary',
                className: 'flex-1',
                type: 'submit'
            }),
            button('Zrušit', () => handlers.onCloseModal(), {
                variant: 'secondary',
                className: 'flex-1'
            })
        ),
        
        el('div', { className: 'mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600' },
            el('p', { className: 'font-medium' }, 'Demo účty:'),
            el('p', {}, 'admin@autopujcovna.cz / admin123'),
            el('p', {}, 'zamestnanec@autopujcovna.cz / emp123')
        )
    );
}
