/**
 * Physio Wellness by Marshall — Analytics & Client Configuration
 * ==============================================================================
 * Fitxer de configuració de client en temps d'execució.
 * Defineix les variables globals segures per a Google Analytics 4 (Consent Mode v2)
 * i l'estat operatiu del formulari de contacte.
 * ==============================================================================
 */

window.PW_CONFIG = window.PW_CONFIG || {};

// Google Analytics 4 Measurement ID
// Propietat oficial de Physio Wellness by Marshall
window.PW_CONFIG.GA4_MEASUREMENT_ID = window.PW_CONFIG.GA4_MEASUREMENT_ID || 'G-C4CBYG7W5K';

// Estat operatiu del formulari de contacte (fals per defecte: l'enviament es realitza de forma nativa per WhatsApp)
window.PW_CONFIG.EMAIL_OPERATIONAL = typeof window.PW_CONFIG.EMAIL_OPERATIONAL !== 'undefined' ? window.PW_CONFIG.EMAIL_OPERATIONAL : false;
