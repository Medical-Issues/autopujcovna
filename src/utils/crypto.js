/**
 * Helper pro generování UUID s fallback pro HTTP
 */

export function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback pro HTTP nebo starší prohlížeče
    return Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}
