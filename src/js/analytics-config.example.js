/**
 * Physio Wellness by Marshall — Analytics Client Configuration Template
 * ==============================================================================
 * Si vols configurar el Measurement ID de GA4 directament en client sense
 * cap procés de build o injecció d'HTML:
 * 
 * 1. Copia aquest fitxer com a "src/js/analytics-config.js".
 * 2. Afegeix el teu Measurement ID real a window.PW_CONFIG.GA4_MEASUREMENT_ID.
 * 3. Assegura't que "src/js/analytics-config.js" està a .gitignore (ja protegit).
 * ==============================================================================
 */

window.PW_CONFIG = window.PW_CONFIG || {};

// Propietat oficial Physio Wellness by Marshall: 'G-C4CBYG7W5K'
window.PW_CONFIG.GA4_MEASUREMENT_ID = 'G-C4CBYG7W5K';

// Estat operatiu del formulari de contacte (false per defecte mentre la incidència DNS de correu està pendent de resolució)
window.PW_CONFIG.EMAIL_OPERATIONAL = false;
