export function el(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            const event = key.slice(2).toLowerCase();
            element.addEventListener(event, value);
        } else if (key === 'data' && typeof value === 'object') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key === 'text') {
            element.textContent = value;
        } else if (key === 'disabled') {
            element.disabled = !!value;
        } else {
            element.setAttribute(key, value);
        }
    });

    children.forEach(child => {
        if (child == null) return;
        if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        } else if (Array.isArray(child)) {
            child.forEach(c => {
                if (c instanceof Node) element.appendChild(c);
            });
        }
    });

    return element;
}

export function clear(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

export function list(items, renderFn, emptyRenderer = () => el('p', { text: 'Žádné položky' })) {
    if (!items || items.length === 0) {
        return emptyRenderer();
    }
    return items.map(renderFn);
}

export function icon(name, size = 20) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    const paths = {
        car: [['path', {d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"}], ['circle', {cx: "7", cy: "17", r: "2"}], ['circle', {cx: "17", cy: "17", r: "2"}]],
        calendar: [['rect', {x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2"}], ['line', {x1: "16", y1: "2", x2: "16", y2: "6"}], ['line', {x1: "8", y1: "2", x2: "8", y2: "6"}], ['line', {x1: "3", y1: "10", x2: "21", y2: "10"}]],
        user: [['path', {d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}], ['circle', {cx: "12", cy: "7", r: "4"}]],
        check: [['polyline', {points: "20 6 9 17 4 12"}]],
        x: [['line', {x1: "18", y1: "6", x2: "6", y2: "18"}], ['line', {x1: "6", y1: "6", x2: "18", y2: "18"}]],
        plus: [['line', {x1: "12", y1: "5", x2: "12", y2: "19"}], ['line', {x1: "5", y1: "12", x2: "19", y2: "12"}]],
        edit: [['path', {d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"}], ['path', {d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"}]],
        trash: [['polyline', {points: "3 6 5 6 21 6"}], ['path', {d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"}]],
        search: [['circle', {cx: "11", cy: "11", r: "8"}], ['line', {x1: "21", y1: "21", x2: "16.65", y2: "16.65"}]],
        filter: [['polygon', {points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"}]],
        menu: [['line', {x1: "3", y1: "12", x2: "21", y2: "12"}], ['line', {x1: "3", y1: "6", x2: "21", y2: "6"}], ['line', {x1: "3", y1: "18", x2: "21", y2: "18"}]],
        arrowRight: [['line', {x1: "5", y1: "12", x2: "19", y2: "12"}], ['polyline', {points: "12 5 19 12 12 19"}]],
        info: [['circle', {cx: "12", cy: "12", r: "10"}], ['line', {x1: "12", y1: "16", x2: "12", y2: "12"}], ['line', {x1: "12", y1: "8", x2: "12.01", y2: "8"}]],
        warning: [['path', {d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}], ['line', {x1: "12", y1: "9", x2: "12", y2: "13"}], ['line', {x1: "12", y1: "17", x2: "12.01", y2: "17"}]],
        settings: [['circle', {cx: "12", cy: "12", r: "3"}], ['path', {d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"}]],
        logout: [['path', {d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}], ['polyline', {points: "16 17 21 12 16 7"}], ['line', {x1: "21", y1: "12", x2: "9", y2: "12"}]],
        login: [['path', {d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"}], ['polyline', {points: "10 17 15 12 10 7"}], ['line', {x1: "15", y1: "12", x2: "3", y2: "12"}]],
        dollar: [['line', {x1: "12", y1: "1", x2: "12", y2: "23"}], ['path', {d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"}]],
        clock: [['circle', {cx: "12", cy: "12", r: "10"}], ['polyline', {points: "12 6 12 12 16 14"}]],
        mapPin: [['path', {d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}], ['circle', {cx: "12", cy: "10", r: "3"}]],
        phone: [['path', {d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"}]],
        mail: [['path', {d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"}], ['polyline', {points: "22,6 12,13 2,6"}]],
        tool: [['path', {d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"}]],
        key: [['path', {d: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"}]],
        dashboard: [['rect', {x: "3", y: "3", width: "7", height: "7"}], ['rect', {x: "14", y: "3", width: "7", height: "7"}], ['rect', {x: "14", y: "14", width: "7", height: "7"}], ['rect', {x: "3", y: "14", width: "7", height: "7"}]],
        list: [['line', {x1: "8", y1: "6", x2: "21", y2: "6"}], ['line', {x1: "8", y1: "12", x2: "21", y2: "12"}], ['line', {x1: "8", y1: "18", x2: "21", y2: "18"}], ['line', {x1: "3", y1: "6", x2: "3.01", y2: "6"}], ['line', {x1: "3", y1: "12", x2: "3.01", y2: "12"}], ['line', {x1: "3", y1: "18", x2: "3.01", y2: "18"}]]
    };

    const iconPaths = paths[name] || paths.info;
    iconPaths.forEach(([tag, attrs]) => {
        const el = document.createElementNS(svgNS, tag);
        Object.entries(attrs).forEach(([key, val]) => el.setAttribute(key, val));
        svg.appendChild(el);
    });

    return svg;
}

export function statusBadge(status, options = {}) {
    const statusColors = {
        'DRAFT': 'bg-gray-100 text-gray-800',
        'AVAILABLE': 'bg-green-100 text-green-800',
        'RENTED': 'bg-blue-100 text-blue-800',
        'MAINTENANCE': 'bg-yellow-100 text-yellow-800',
        'DECOMMISSIONED': 'bg-red-100 text-red-800',
        'NEW': 'bg-gray-100 text-gray-800',
        'CONFIRMED': 'bg-purple-100 text-purple-800',
        'ACTIVE': 'bg-blue-100 text-blue-800',
        'COMPLETED': 'bg-green-100 text-green-800',
        'CANCELED': 'bg-red-100 text-red-800'
    };

    const statusLabels = {
        'DRAFT': 'Koncept',
        'AVAILABLE': 'Dostupné',
        'RENTED': 'Vypůjčeno',
        'MAINTENANCE': 'Servis',
        'DECOMMISSIONED': 'Vyřazeno',
        'NEW': 'Nová',
        'CONFIRMED': 'Potvrzená',
        'ACTIVE': 'Aktivní',
        'COMPLETED': 'Dokončená',
        'CANCELED': 'Zrušená'
    };

    return el('span', {
        className: `px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'} ${options.className || ''}`
    }, statusLabels[status] || status);
}

export function button(text, onClick, options = {}) {
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
        ghost: 'text-gray-600 hover:bg-gray-100'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
    };

    const baseClass = 'rounded-lg font-medium transition-colors inline-flex items-center gap-2';
    const variantClass = variants[options.variant || 'primary'];
    const sizeClass = sizes[options.size || 'md'];

    const attrs = {
        className: `${baseClass} ${variantClass} ${sizeClass} ${options.className || ''}`,
        onClick: onClick
    };

    if (options.disabled) {
        attrs.disabled = true;
    }

    return el('button', attrs, options.icon || null, text);
}

export function input(label, value, onChange, options = {}) {
    const wrapper = el('div', { className: 'space-y-1' });

    if (label) {
        wrapper.appendChild(el('label', {
            className: 'block text-sm font-medium text-gray-700'
        }, label));
    }

    const inputEl = el('input', {
        type: options.type || 'text',
        value: value || '',
        className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${options.className || ''}`,
        placeholder: options.placeholder || '',
        disabled: options.disabled,
        min: options.min,
        max: options.max,
        step: options.step
    });
    inputEl.addEventListener('input', (e) => onChange && onChange(e.target.value));

    wrapper.appendChild(inputEl);
    return wrapper;
}

export function select(label, value, options, onChange, config = {}) {
    const wrapper = el('div', { className: 'space-y-1' });
    
    if (label) {
        wrapper.appendChild(el('label', {
            className: 'block text-sm font-medium text-gray-700'
        }, label));
    }
    
    const selectEl = el('select', {
        className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${config.className || ''}`,
        disabled: config.disabled
    });
    selectEl.addEventListener('change', (e) => onChange && onChange(e.target.value));
    
    options.forEach(opt => {
        const optionEl = el('option', {
            value: opt.value,
            selected: opt.value === value
        }, opt.label);
        selectEl.appendChild(optionEl);
    });
    
    wrapper.appendChild(selectEl);
    return wrapper;
}
