/**
 * ==============================================================================
 * Physio Wellness by Marshall — Google Analytics 4 & Consent Management
 * ==============================================================================
 * Mòdul centralitzat d'analítica i privacitat.
 *
 * Característiques clau:
 * - Google Consent Mode v2 (Mode Bàsic): 'denied' per defecte per a totes les categories.
 * - Càrrega bloquejada: cap crida de xarxa a Google sense consentiment explícit.
 * - Protecció de localhost: no envia dades en entorns de desenvolupament (localhost, 127.0.0.1).
 * - Sense dominis hardcodejats: compatible amb dominis temporals de Hostinger i domini definitiu.
 * - Resolució dinàmica del Measurement ID (sense IDs hardcodejats al codi).
 * - Multi-idioma: distingeix automàticament visites en CA, ES i EN.
 * - Gestió robusta de visitants recurrents (Consent Mode actualitzat a 'granted' automàticament).
 * - Prevenció de duplicació de page_view i cua segura de callbacks de càrrega.
 * - Sanitització estricta contra dades personals (PII) o informació clínica sensible.
 * ==============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    var instance = factory();
    if (root) {
      root.PW_ANALYTICS = instance;
      root.pwTrackEvent = instance.trackEvent;
    }
    module.exports = instance;
  } else {
    root.PW_ANALYTICS = factory();
    // Àlies global per compatibilitat amb implementacions prèvies
    root.pwTrackEvent = root.PW_ANALYTICS.trackEvent;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CONSENT_STORAGE_KEY = 'pw_cookie_consent';
  var CONSENT_VERSION = '1.0';
  var CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 12 mesos

  var state = {
    initialized: false,
    measurementId: '',
    scriptLoaded: false,
    scriptLoading: false,
    pendingCallbacks: [],
    consentGranted: false,
    pageViewSent: false,
    autoTrackingInitialized: false,
    debug: false
  };

  /**
   * Comprova si estem en mode debug
   */
  function isDebug() {
    if (state.debug) return true;
    if (typeof window !== 'undefined') {
      if (window.PW_ANALYTICS_DEBUG === true) return true;
      try {
        if (window.localStorage && window.localStorage.getItem('pw_analytics_debug') === 'true') {
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  /**
   * Comprova si l'entorn actual és local/desenvolupament
   */
  function isLocalhost() {
    if (typeof window === 'undefined') return true;
    var host = window.location.hostname;
    return Boolean(
      !host ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.indexOf('.local') !== -1 ||
      window.location.protocol === 'file:'
    );
  }

  /**
   * Valida el format d'un Measurement ID de GA4 (ex: G-A1B2C3D4E5)
   * Rebutja placeholders com G-XXXXXXXXXX
   */
  function isValidMeasurementId(id) {
    if (!id || typeof id !== 'string') return false;
    var trimmed = id.trim();
    if (/^G-X+$/i.test(trimmed)) return false;
    return /^G-[A-Z0-9]+$/i.test(trimmed);
  }

  /**
   * Resol el Measurement ID des de diferents fonts segures
   */
  function resolveMeasurementId(explicitId) {
    if (isValidMeasurementId(explicitId)) {
      return explicitId.trim();
    }
    if (typeof window !== 'undefined') {
      // 1. Configuració global window.PW_CONFIG
      if (window.PW_CONFIG && isValidMeasurementId(window.PW_CONFIG.GA4_MEASUREMENT_ID)) {
        return window.PW_CONFIG.GA4_MEASUREMENT_ID.trim();
      }
      // 2. Variable global directa
      if (isValidMeasurementId(window.GA4_MEASUREMENT_ID)) {
        return window.GA4_MEASUREMENT_ID.trim();
      }
      // 3. Etiqueta meta al document <meta name="ga-measurement-id" content="G-...">
      if (typeof document !== 'undefined') {
        var meta = document.querySelector('meta[name="ga-measurement-id"], meta[name="ga4-measurement-id"]');
        if (meta) {
          var val = meta.getAttribute('content');
          if (isValidMeasurementId(val)) return val.trim();
        }
      }
    }
    return '';
  }

  /**
   * Detecta l'idioma actual de la pàgina (ca, es, en)
   */
  function detectLanguage() {
    if (typeof document === 'undefined') return 'es';
    var docLang = (document.documentElement.lang || '').toLowerCase();
    if (docLang.indexOf('ca') === 0) return 'ca';
    if (docLang.indexOf('en') === 0) return 'en';
    if (docLang.indexOf('es') === 0) return 'es';

    if (typeof window !== 'undefined') {
      var path = window.location.pathname.toLowerCase();
      if (path.indexOf('/ca/') !== -1 || path === '/ca') return 'ca';
      if (path.indexOf('/en/') !== -1 || path === '/en') return 'en';
      if (path.indexOf('/es/') !== -1 || path === '/es') return 'es';
    }
    return 'es';
  }

  /**
   * Obté el consentiment emmagatzemat a localStorage
   */
  function getStoredConsent() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      var raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;
      if (data.version !== CONSENT_VERSION) return null;
      if (typeof data.timestamp !== 'number') return null;
      if ((Date.now() - data.timestamp) > CONSENT_MAX_AGE_MS) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Desa la decisió de consentiment a localStorage
   */
  function saveStoredConsent(analyticsGranted) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      var payload = {
        version: CONSENT_VERSION,
        analytics: Boolean(analyticsGranted),
        timestamp: Date.now()
      };
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      if (isDebug()) console.warn('[PW_ANALYTICS] Error desant consentiment a localStorage:', e);
    }
  }

  /**
   * Assegura dataLayer i la funció gtag() a l'àmbit global
   */
  function setupGtagShim() {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }
  }

  /**
   * Aplica Google Consent Mode v2 per defecte ('denied' a tot)
   */
  function setDefaultConsentState() {
    setupGtagShim();
    window.gtag('consent', 'default', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied'
    });
  }

  /**
   * Neteja les cookies de GA4 de tots els dominis i camins rellevants
   */
  function clearGaCookies() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    try {
      var cookieList = document.cookie.split(';');
      var host = window.location.hostname;
      var domains = ['', host, '.' + host];
      var parts = host.split('.');
      if (parts.length > 2) {
        domains.push('.' + parts.slice(-2).join('.'));
      }
      for (var i = 0; i < cookieList.length; i++) {
        var c = cookieList[i].trim();
        var name = c.split('=')[0];
        if (name === '_ga' || name === '_gid' || name === '_gat' || name.indexOf('_ga_') === 0) {
          for (var d = 0; d < domains.length; d++) {
            var dom = domains[d];
            var domStr = dom ? '; domain=' + dom : '';
            document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/' + domStr;
            document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=' + window.location.pathname + domStr;
          }
        }
      }
    } catch (e) {
      if (isDebug()) console.warn('[PW_ANALYTICS] Error netejant cookies:', e);
    }
  }

  /**
   * Construeix els paràmetres de la vista de pàgina actual,
   * garantint la neteja de qualsevol dada sensible o PII a la URL (query string).
   */
  function buildPageViewParams(customParams) {
    var pagePath = (typeof window !== 'undefined' ? window.location.pathname : '');
    var pageSearch = (typeof window !== 'undefined' ? window.location.search : '');
    var cleanSearch = '';

    if (pageSearch && pageSearch.length > 1) {
      var pairs = pageSearch.substring(1).split('&');
      var safePairs = [];
      var sensitiveQueryKeys = [
        'name', 'nom', 'nombre', 'email', 'mail', 'phone', 'tel', 'telefon', 'telefono',
        'msg', 'message', 'missatge', 'mensaje', 'text', 'consulta', 'dni', 'nif', 'token', 'pass'
      ];
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        var k = decodeURIComponent(pair[0] || '').toLowerCase();
        var isSensitive = false;
        for (var sk = 0; sk < sensitiveQueryKeys.length; sk++) {
          if (k.indexOf(sensitiveQueryKeys[sk]) !== -1) {
            isSensitive = true;
            break;
          }
        }
        if (!isSensitive) {
          safePairs.push(pairs[i]);
        }
      }
      if (safePairs.length > 0) {
        cleanSearch = '?' + safePairs.join('&');
      }
    }

    var cleanPath = pagePath + cleanSearch;
    var cleanLocation = (typeof window !== 'undefined' ? (window.location.protocol + '//' + window.location.host + cleanPath) : '');

    var params = {
      page_title: (typeof document !== 'undefined' ? document.title : ''),
      page_location: cleanLocation,
      page_path: cleanPath,
      page_language: detectLanguage()
    };
    if (customParams && typeof customParams === 'object') {
      for (var p in customParams) {
        if (Object.prototype.hasOwnProperty.call(customParams, p)) {
          params[p] = customParams[p];
        }
      }
    }
    return params;
  }

  /**
   * Carrega dinàmicament el script gtag.js de Google només quan hi ha consentiment
   */
  function loadGoogleTag(callback) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    if (state.scriptLoaded) {
      if (typeof callback === 'function') callback();
      return;
    }

    if (typeof callback === 'function') {
      state.pendingCallbacks.push(callback);
    }

    if (state.scriptLoading) {
      return;
    }

    if (!state.measurementId) {
      if (isDebug()) console.info('[PW_ANALYTICS] Script de GA4 no carregat: Measurement ID buit o pendent');
      return;
    }

    if (isLocalhost()) {
      if (isDebug()) console.info('[PW_ANALYTICS] Script de GA4 no carregat: Entorn localhost protegit');
      return;
    }

    state.scriptLoading = true;
    setupGtagShim();

    // Elimina el flag d'opt-out si existia
    if (window['ga-disable-' + state.measurementId]) {
      delete window['ga-disable-' + state.measurementId];
    }

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(state.measurementId);
    script.onload = function () {
      state.scriptLoaded = true;
      state.scriptLoading = false;
      window.gtag('js', new Date());
      // Configurem GA4 desactivant l'enviament automàtic de page_view
      // per tenir control precís i evitar duplicats
      window.gtag('config', state.measurementId, {
        anonymize_ip: true,
        send_page_view: false
      });
      if (isDebug()) console.info('[PW_ANALYTICS] Google Analytics 4 carregat amb èxit (' + state.measurementId + ')');

      var cbs = state.pendingCallbacks.slice();
      state.pendingCallbacks = [];
      for (var i = 0; i < cbs.length; i++) {
        try {
          cbs[i]();
        } catch (e) {
          if (isDebug()) console.error('[PW_ANALYTICS] Error executant callback de càrrega:', e);
        }
      }
    };
    script.onerror = function (err) {
      state.scriptLoading = false;
      state.pendingCallbacks = [];
      if (isDebug()) console.error('[PW_ANALYTICS] Error carregant script de Google Tag:', err);
    };

    document.head.appendChild(script);
  }

  // ============================================================================
  // AUTO-TRACKING DE CONVERSIONS I ENLLAÇOS EXTERNS
  // ============================================================================

  /**
   * Determina la ubicació contextual d'un element clicat (hero, panell, footer, etc.)
   */
  function detectCtaLocation(el) {
    if (!el || typeof el.closest !== 'function') return 'in_page_content';
    if (el.closest('#booking-panel') || el.closest('.booking-panel')) return 'booking_panel';
    if (el.closest('.book-bar')) return 'sticky_mobile_bar';
    if (el.closest('#site-header') || el.closest('.site-header') || el.closest('.header')) return 'header';
    if (el.closest('.service-hero') || el.closest('.hero')) return 'hero';
    if (el.closest('.site-footer') || el.closest('.footer') || el.closest('.footer-cta') || el.closest('.cta-final')) return 'footer';
    if (el.closest('.contact-hero')) return 'contact_hero';
    if (el.closest('.contact-guide')) return 'contact_guide';
    if (el.closest('.contact-info')) return 'contact_info';
    if (el.closest('.contact-form-card') || el.closest('#contact-form')) return 'contact_form';
    if (el.closest('.stretching-rates') || el.closest('.strength-rate-card') || el.closest('.domicilio-plan') || el.closest('.pricing-table')) return 'pricing_section';
    if (el.closest('.service-process') || el.closest('.visit-breakdown')) return 'service_process';
    if (el.closest('.team-profile') || el.closest('.team-card') || el.closest('.equipo-explorador')) return 'team_section';
    if (el.closest('.faq-section') || el.closest('.faq')) return 'faq';
    return 'in_page_content';
  }

  /**
   * Determina el servei associat a la pàgina o enllaç
   */
  function detectServiceContext(url, el) {
    // 1. Targeta o secció pare amb id o data-service
    if (el && typeof el.closest === 'function') {
      var serviceEl = el.closest('[data-service], .service-panel, .service-card, .service-section, article[id]');
      if (serviceEl) {
        var sId = (serviceEl.getAttribute('data-service') || serviceEl.id || '').toLowerCase();
        if (sId.indexOf('domicil') !== -1 || sId.indexOf('home') !== -1) return 'fisioterapia_domicili';
        if (sId.indexOf('physio') !== -1 || sId.indexOf('fisio') !== -1) return 'fisioterapia';
        if (sId.indexOf('pilates') !== -1) return 'pilates';
        if (sId.indexOf('strength') !== -1 || sId.indexOf('forca') !== -1 || sId.indexOf('fuerza') !== -1) return 'forca';
        if (sId.indexOf('wellness') !== -1 || sId.indexOf('benestar') !== -1 || sId.indexOf('bienestar') !== -1) return 'benestar';
        if (sId.indexOf('stretching') !== -1) return 'stretching';
        if (sId.indexOf('snow') !== -1) return 'snow_performance';
      }
    }

    // 2. Text del missatge a l'enllaç de WhatsApp
    if (url && typeof url === 'string') {
      var decodedUrl = '';
      try {
        decodedUrl = decodeURIComponent(url).toLowerCase();
      } catch (e) {
        decodedUrl = url.toLowerCase();
      }
      if (decodedUrl.indexOf('domicili') !== -1 || decodedUrl.indexOf('domicilio') !== -1 || decodedUrl.indexOf('home physio') !== -1) return 'fisioterapia_domicili';
      if (decodedUrl.indexOf('fisioterapia') !== -1 || decodedUrl.indexOf('physiotherapy') !== -1) return 'fisioterapia';
      if (decodedUrl.indexOf('pilates') !== -1) return 'pilates';
      if (decodedUrl.indexOf('força') !== -1 || decodedUrl.indexOf('forca') !== -1 || decodedUrl.indexOf('fuerza') !== -1 || decodedUrl.indexOf('strength') !== -1) return 'forca';
      if (decodedUrl.indexOf('benestar') !== -1 || decodedUrl.indexOf('bienestar') !== -1 || decodedUrl.indexOf('wellness') !== -1) return 'benestar';
      if (decodedUrl.indexOf('stretching') !== -1) return 'stretching';
      if (decodedUrl.indexOf('snow') !== -1) return 'snow_performance';
    }

    // 3. Ruta de la pàgina (URL actual)
    var path = (typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '');
    if (path.indexOf('fisioterapia-a-domicili') !== -1 || path.indexOf('fisioterapia-a-domicilio') !== -1 || path.indexOf('home-physiotherapy') !== -1) return 'fisioterapia_domicili';
    if (path.indexOf('fisioterapia') !== -1 || path.indexOf('physiotherapy') !== -1) return 'fisioterapia';
    if (path.indexOf('pilates') !== -1) return 'pilates';
    if (path.indexOf('forca') !== -1 || path.indexOf('fuerza') !== -1 || path.indexOf('strength') !== -1) return 'forca';
    if (path.indexOf('benestar') !== -1 || path.indexOf('bienestar') !== -1 || path.indexOf('wellness') !== -1) return 'benestar';
    if (path.indexOf('stretching') !== -1) return 'stretching';
    if (path.indexOf('snow-performance') !== -1) return 'snow_performance';
    if (path.indexOf('primera-visita') !== -1 || path.indexOf('first-visit') !== -1) return 'primera_visita';
    if (path.indexOf('tarif') !== -1 || path.indexOf('rates') !== -1) return 'tarifes';
    if (path.indexOf('equip') !== -1 || path.indexOf('equipo') !== -1 || path.indexOf('team') !== -1) return 'equip';
    if (path.indexOf('contact') !== -1) return 'contacte';
    return 'general';
  }

  /**
   * Configura el seguiment automàtic delegat de clics a reserves (DocFav), WhatsApp i telèfon
   */
  function setupAutoTracking() {
    if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
    if (state.autoTrackingInitialized) return;
    state.autoTrackingInitialized = true;

    document.addEventListener('click', function (e) {
      var link = e.target && typeof e.target.closest === 'function' ? e.target.closest('a') : null;
      if (!link) return;

      var href = (link.getAttribute('href') || '').trim();
      if (!href) return;

      var linkText = (link.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      var locationContext = detectCtaLocation(link);
      var serviceContext = detectServiceContext(href, link);

      // 1. Clics a DocFav (Reserva externa / Intenció de reserva)
      if (href.indexOf('docfav.com') !== -1) {
        trackEvent('click_docfav', {
          event_category: 'booking_intent',
          destination: 'docfav',
          booking_channel: 'docfav_portal',
          cta_text: linkText,
          cta_location: locationContext,
          service: serviceContext,
          page_path: (typeof window !== 'undefined' ? window.location.pathname : '')
        });
        return;
      }

      // 2. Clics a WhatsApp
      if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp.com') !== -1) {
        trackEvent('click_whatsapp', {
          event_category: 'contact_intent',
          contact_channel: 'whatsapp',
          destination_number: '+34644678344',
          cta_text: linkText,
          cta_location: locationContext,
          service: serviceContext,
          page_path: (typeof window !== 'undefined' ? window.location.pathname : '')
        });
        return;
      }

      // 3. Clics a Telèfon
      if (href.indexOf('tel:') === 0) {
        trackEvent('click_phone', {
          event_category: 'contact_intent',
          contact_channel: 'phone',
          phone_number: '+34644678344',
          cta_text: linkText,
          cta_location: locationContext,
          service: serviceContext,
          page_path: (typeof window !== 'undefined' ? window.location.pathname : '')
        });
        return;
      }
    }, true);
  }

  /**
   * Sanititza els paràmetres d'esdeveniments per garantir l'absència de dades personals (PII)
   * o informació clínica sensible.
   */
  function sanitizeEventParams(params) {
    if (!params || typeof params !== 'object') return {};
    var sanitized = {};
    var sensitiveKeys = [
      'name', 'nom', 'nombre', 'email', 'mail', 'phone', 'tel', 'telefon', 'telefono',
      'message', 'missatge', 'mensaje', 'consulta', 'medical', 'clinical', 'symptom',
      'simptoma', 'sintoma', 'dni', 'nif', 'password', 'pass', 'address', 'adreca', 'direccion'
    ];
    for (var k in params) {
      if (Object.prototype.hasOwnProperty.call(params, k)) {
        var lower = k.toLowerCase();
        // Permetem exclusivament els identificadors oficials del centre
        if (lower === 'destination_number' || lower === 'phone_number') {
          sanitized[k] = params[k];
          continue;
        }
        var isSensitive = false;
        for (var i = 0; i < sensitiveKeys.length; i++) {
          if (lower.indexOf(sensitiveKeys[i]) !== -1) {
            isSensitive = true;
            break;
          }
        }
        if (!isSensitive) {
          sanitized[k] = params[k];
        }
      }
    }
    return sanitized;
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  /**
   * Inicialitza el mòdul d'analítica
   *
   * @param {Object} [options]
   * @param {string} [options.measurementId] ID de mesura de GA4 (G-XXXXXXXXXX)
   * @param {boolean} [options.debug] Activar missatges de depuració a consola
   */
  function initAnalytics(options) {
    options = options || {};
    if (options.debug !== undefined) state.debug = Boolean(options.debug);

    state.measurementId = resolveMeasurementId(options.measurementId);

    // 1. Aplicar estat de Consent Mode per defecte ('denied' a tot)
    setDefaultConsentState();

    // 2. Comprovar si ja hi ha consentiment previ desat
    var stored = getStoredConsent();
    if (stored && stored.analytics === true) {
      state.consentGranted = true;
      setupGtagShim();
      // Actualitzem Consent Mode a 'granted' per a usuaris amb decisió prèvia
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
      // Només si tenim un ID vàlid i no estem en localhost carreguem GA4
      if (state.measurementId && !isLocalhost()) {
        loadGoogleTag(function () {
          // Registrar un únic page view inicial un cop carregat
          trackPageView();
        });
      } else if (isDebug()) {
        console.info('[PW_ANALYTICS] Consentiment previ detectat, però GA4 no s\'ha carregat (local o sense ID)');
      }
    } else {
      state.consentGranted = false;
    }

    // 3. Configurar seguiment automàtic delegat per a DocFav, WhatsApp i Telèfon
    setupAutoTracking();

    state.initialized = true;

    if (isDebug()) {
      console.info('[PW_ANALYTICS] Inicialitzat correctament.', {
        measurementId: state.measurementId || '(no configurat)',
        consent: state.consentGranted ? 'granted' : 'denied',
        isLocal: isLocalhost()
      });
    }

    return publicApi;
  }

  /**
   * Registra una vista de pàgina (page view)
   *
   * @param {Object} [customParams] Paràmetres personalitzats opcionals
   * @returns {boolean} True si s'ha processat, false si s'ha omès (sense consentiment o sense ID)
   */
  function trackPageView(customParams) {
    if (!state.consentGranted) {
      if (isDebug()) console.info('[PW_ANALYTICS] trackPageView omès: sense consentiment analític');
      return false;
    }

    // Evita duplicació de page_view inicial a la mateixa càrrega de pàgina
    if (state.pageViewSent && !customParams) {
      if (isDebug()) console.info('[PW_ANALYTICS] trackPageView omès: vista de pàgina ja enviada');
      return true;
    }

    var params = buildPageViewParams(customParams);

    if (isLocalhost()) {
      if (isDebug()) console.info('[PW_ANALYTICS:localhost] Simulant page_view (bloquejat enviament real):', params);
      state.pageViewSent = true;
      return true;
    }

    if (!state.measurementId) {
      if (isDebug()) console.warn('[PW_ANALYTICS] trackPageView omès: no hi ha Measurement ID configurat');
      return false;
    }

    if (!state.scriptLoaded) {
      loadGoogleTag(function () {
        trackPageView(customParams);
      });
      return true;
    }

    setupGtagShim();
    window.gtag('event', 'page_view', params);
    state.pageViewSent = true;

    if (isDebug()) console.info('[PW_ANALYTICS] page_view enviat:', params);
    return true;
  }

  /**
   * Registra un esdeveniment personalitzat a GA4
   *
   * @param {string} eventName Nom de l'esdeveniment (ex: 'click_whatsapp')
   * @param {Object} [params] Paràmetres addicionals de l'esdeveniment
   * @returns {boolean} True si s'ha processat, false si s'ha omès
   */
  function trackEvent(eventName, params) {
    if (!eventName || typeof eventName !== 'string') {
      if (isDebug()) console.warn('[PW_ANALYTICS] trackEvent error: nom d\'esdeveniment invàlid');
      return false;
    }

    if (!state.consentGranted) {
      if (isDebug()) console.info('[PW_ANALYTICS] trackEvent "' + eventName + '" omès: sense consentiment');
      return false;
    }

    params = params || {};
    // Assegurem que l'idioma queda sempre reflectit a l'esdeveniment
    if (!params.language) {
      params.language = detectLanguage();
    }

    // Filtre de seguretat RGPD
    params = sanitizeEventParams(params);

    if (isLocalhost()) {
      if (isDebug()) console.info('[PW_ANALYTICS:localhost] Simulant event "' + eventName + '" (bloquejat enviament real):', params);
      return true;
    }

    if (!state.measurementId) {
      if (isDebug()) console.warn('[PW_ANALYTICS] trackEvent "' + eventName + '" omès: no hi ha Measurement ID configurat');
      return false;
    }

    if (!state.scriptLoaded) {
      loadGoogleTag(function () {
        trackEvent(eventName, params);
      });
      return true;
    }

    setupGtagShim();
    // Prevenim duplicació si GTM està present
    var hasGtm = typeof window !== 'undefined' && Boolean(window.google_tag_manager);
    if (hasGtm) {
      try {
        var dlPayload = { event: eventName };
        for (var k in params) {
          if (Object.prototype.hasOwnProperty.call(params, k)) {
            dlPayload[k] = params[k];
          }
        }
        window.dataLayer.push(dlPayload);
      } catch (e) {}
    } else {
      window.gtag('event', eventName, params);
    }

    if (isDebug()) console.info('[PW_ANALYTICS] Event enviat:', eventName, params);
    return true;
  }

  /**
   * Activa el consentiment analític (cridat quan l'usuari accepta al banner/modal)
   *
   * @param {Object} [options]
   * @param {boolean} [options.persist=true] Si s'ha de desar a localStorage
   * @param {boolean} [options.sendInitialPageView=true] Si s'ha d'enviar la vista de pàgina immediatament
   */
  function grantAnalyticsConsent(options) {
    options = options || {};
    var persist = options.persist !== false;
    var sendInitial = options.sendInitialPageView !== false;

    state.consentGranted = true;

    setupGtagShim();
    // Actualitzem Consent Mode a 'granted' ÚNICAMENT per a analytics_storage
    // Ad storage i personalització continuen expressament en 'denied'
    window.gtag('consent', 'update', {
      'analytics_storage': 'granted'
    });

    if (persist) {
      saveStoredConsent(true);
    }

    if (!state.measurementId) {
      state.measurementId = resolveMeasurementId();
    }

    if (state.measurementId && !isLocalhost()) {
      loadGoogleTag(function () {
        if (sendInitial) {
          trackPageView();
        }
      });
    } else if (isDebug()) {
      console.info('[PW_ANALYTICS] Consentiment concedit (mode desenvolupament o ID pendent)');
    }

    return true;
  }

  /**
   * Revoca el consentiment analític (cridat quan l'usuari rebutja o canvia preferències)
   *
   * @param {Object} [options]
   * @param {boolean} [options.persist=true] Si s'ha de desar a localStorage
   */
  function revokeAnalyticsConsent(options) {
    options = options || {};
    var persist = options.persist !== false;

    state.consentGranted = false;
    state.pageViewSent = false;

    setupGtagShim();
    window.gtag('consent', 'update', {
      'analytics_storage': 'denied'
    });

    if (state.measurementId) {
      window['ga-disable-' + state.measurementId] = true;
    }

    clearGaCookies();

    if (persist) {
      saveStoredConsent(false);
    }

    if (isDebug()) console.info('[PW_ANALYTICS] Consentiment revocat i cookies analítiques netejades');
    return true;
  }

  /**
   * Retorna l'estat actual de consentiment
   */
  function hasConsent() {
    return Boolean(state.consentGranted);
  }

  /**
   * Retorna la informació detallada del consentiment desat
   */
  function getConsentStatus() {
    var stored = getStoredConsent();
    var isConsented = state.consentGranted || Boolean(stored && stored.analytics);
    return {
      consented: isConsented,
      analytics: isConsented,
      hasStoredDecision: stored !== null,
      timestamp: stored ? stored.timestamp : null,
      version: stored ? stored.version : null
    };
  }

  /**
   * Retorna el Measurement ID configurat actualment
   */
  function getMeasurementId() {
    return state.measurementId;
  }

  /**
   * Permet configurar dinàmicament el Measurement ID
   */
  function setMeasurementId(id) {
    if (isValidMeasurementId(id)) {
      state.measurementId = id.trim();
      if (state.consentGranted && !state.scriptLoaded && !isLocalhost()) {
        loadGoogleTag(function () {
          trackPageView();
        });
      }
      return true;
    }
    return false;
  }

  var publicApi = {
    init: initAnalytics,
    initAnalytics: initAnalytics,
    setupAutoTracking: setupAutoTracking,
    trackPageView: trackPageView,
    trackEvent: trackEvent,
    grantAnalyticsConsent: grantAnalyticsConsent,
    revokeAnalyticsConsent: revokeAnalyticsConsent,
    hasConsent: hasConsent,
    getConsentStatus: getConsentStatus,
    isLocalhost: isLocalhost,
    getMeasurementId: getMeasurementId,
    setMeasurementId: setMeasurementId,
    detectLanguage: detectLanguage
  };

  return publicApi;
}));
