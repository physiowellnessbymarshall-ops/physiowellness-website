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
// Si està buit (''), GA4 roman desactivat de manera segura sense bloquejar la web ni fer crides de xarxa.
window.PW_CONFIG.GA4_MEASUREMENT_ID = window.PW_CONFIG.GA4_MEASUREMENT_ID || '';

// Estat operatiu del formulari de contacte (fals per defecte: l'enviament es realitza de forma nativa per WhatsApp)
window.PW_CONFIG.EMAIL_OPERATIONAL = typeof window.PW_CONFIG.EMAIL_OPERATIONAL !== 'undefined' ? window.PW_CONFIG.EMAIL_OPERATIONAL : false;
