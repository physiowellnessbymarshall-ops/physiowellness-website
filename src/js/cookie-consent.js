/**
 * ==============================================================================
 * Physio Wellness by Marshall — Banner de Cookies i Panell de Preferències
 * ==============================================================================
 * Gestió accessible, responsive i multilingüe (CAT/ES/EN) del consentiment
 * de cookies connectat amb Google Consent Mode v2 a través de window.PW_ANALYTICS.
 *
 * Principis de privacitat i disseny:
 * - Sense dark patterns: Acceptar i Rebutjar tenen una jerarquia i visibilitat equivalents.
 * - Cap opció analítica preseleccionada per defecte per a nous visitants.
 * - Només 2 categories: Necessàries (sempre actives) i Analítiques (opcionals).
 * - Persistència de 12 mesos via localStorage ('pw_cookie_consent').
 * - Accessibilitat WCAG: navegació per teclat, focus trap, suport Escape, contrast adequat.
 * ==============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PW_COOKIE_CONSENT = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var i18n = {
    ca: {
      bannerTitle: 'La teva privacitat',
      bannerText: 'Utilitzem cookies necessàries perquè la web funcioni i, si ens dones permís, cookies analítiques per entendre com s’utilitza i millorar-la.',
      accept: 'Acceptar',
      reject: 'Rebutjar',
      settings: 'Configurar',
      modalTitle: 'Configuració de cookies',
      modalIntro: 'Pots triar quines cookies autoritzes. La teva selecció es recordarà durant 12 mesos i pots modificar-la en qualsevol moment.',
      necessaryTitle: 'Necessàries',
      necessaryBadge: 'Sempre actives',
      necessaryDesc: 'Permeten el funcionament bàsic i segur de la web.',
      analyticsTitle: 'Analítiques',
      analyticsBadge: 'Google Analytics 4',
      analyticsDesc: 'Ens ajuden a entendre com s’utilitza la web mitjançant Google Analytics, de manera que puguem millorar-ne el contingut i l’experiència.',
      save: 'Desar preferències',
      acceptAll: 'Acceptar-ho tot',
      rejectAll: 'Rebutjar-ho tot',
      closeModal: 'Tancar panell de cookies',
      footerLink: 'Preferències de cookies'
    },
    es: {
      bannerTitle: 'Tu privacidad',
      bannerText: 'Utilizamos cookies necesarias para que la web funcione y, si nos das permiso, cookies analíticas para entender cómo se utiliza y mejorarla.',
      accept: 'Aceptar',
      reject: 'Rechazar',
      settings: 'Configurar',
      modalTitle: 'Configuración de cookies',
      modalIntro: 'Puedes elegir qué cookies autorizas. Tu selección se recordará durante 12 meses y puedes modificarla en cualquier momento.',
      necessaryTitle: 'Necesarias',
      necessaryBadge: 'Siempre activas',
      necessaryDesc: 'Permiten el funcionamiento básico y seguro de la web.',
      analyticsTitle: 'Analíticas',
      analyticsBadge: 'Google Analytics 4',
      analyticsDesc: 'Nos ayudan a entender cómo se utiliza la web mediante Google Analytics para poder mejorar su contenido y experiencia.',
      save: 'Guardar preferencias',
      acceptAll: 'Aceptar todo',
      rejectAll: 'Rechazar todo',
      closeModal: 'Cerrar panel de cookies',
      footerLink: 'Preferencias de cookies'
    },
    en: {
      bannerTitle: 'Your privacy',
      bannerText: 'We use necessary cookies for the website to work and, with your permission, analytics cookies to understand how it is used and improve it.',
      accept: 'Accept',
      reject: 'Reject',
      settings: 'Settings',
      modalTitle: 'Cookie settings',
      modalIntro: 'You can choose which cookies you authorize. Your selection will be remembered for 12 months and can be changed at any time.',
      necessaryTitle: 'Necessary',
      necessaryBadge: 'Always active',
      necessaryDesc: 'They enable the basic and secure functioning of the website.',
      analyticsTitle: 'Analytics',
      analyticsBadge: 'Google Analytics 4',
      analyticsDesc: 'They help us understand how the website is used through Google Analytics so we can improve its content and experience.',
      save: 'Save preferences',
      acceptAll: 'Accept all',
      rejectAll: 'Reject all',
      closeModal: 'Close cookie panel',
      footerLink: 'Cookie preferences'
    }
  };

  var state = {
    initialized: false,
    bannerEl: null,
    modalEl: null,
    lastFocusedEl: null,
    currentLang: 'es'
  };

  /**
   * Detecta l'idioma actiu a partir de document.documentElement.lang o la ruta
   */
  function detectLanguage() {
    if (typeof window !== 'undefined' && window.PW_ANALYTICS && typeof window.PW_ANALYTICS.detectLanguage === 'function') {
      return window.PW_ANALYTICS.detectLanguage();
    }
    if (typeof document !== 'undefined') {
      var docLang = (document.documentElement.lang || '').toLowerCase();
      if (docLang.indexOf('ca') === 0) return 'ca';
      if (docLang.indexOf('en') === 0) return 'en';
      if (docLang.indexOf('es') === 0) return 'es';
    }
    if (typeof window !== 'undefined') {
      var path = window.location.pathname.toLowerCase();
      if (path.indexOf('/ca/') !== -1 || path === '/ca') return 'ca';
      if (path.indexOf('/en/') !== -1 || path === '/en') return 'en';
      if (path.indexOf('/es/') !== -1 || path === '/es') return 'es';
    }
    return 'es';
  }

  /**
   * Obté els textos de l'idioma actiu
   */
  function getI18n() {
    state.currentLang = detectLanguage();
    return i18n[state.currentLang] || i18n.es;
  }

  /**
   * Construeix el Banner inicial (Capa 1)
   */
  function createBannerElement(t) {
    var banner = document.createElement('aside');
    banner.className = 'pw-cookie-banner';
    banner.id = 'pw-cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', t.modalTitle);

    banner.innerHTML =
      '<div class="pw-cookie-banner__inner">' +
        '<div class="pw-cookie-banner__content">' +
          '<p class="pw-cookie-banner__text">' + t.bannerText + '</p>' +
        '</div>' +
        '<div class="pw-cookie-banner__actions">' +
          '<button type="button" class="pw-cookie-banner__btn pw-cookie-banner__btn--accept" id="pw-cookie-accept">' + t.accept + '</button>' +
          '<button type="button" class="pw-cookie-banner__btn pw-cookie-banner__btn--reject" id="pw-cookie-reject">' + t.reject + '</button>' +
          '<button type="button" class="pw-cookie-banner__btn pw-cookie-banner__btn--settings" id="pw-cookie-config">' + t.settings + '</button>' +
        '</div>' +
      '</div>';

    return banner;
  }

  /**
   * Construeix el Modal de preferències (Capa 2)
   */
  function createModalElement(t) {
    var modal = document.createElement('div');
    modal.className = 'pw-cookie-modal';
    modal.id = 'pw-cookie-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'pw-cookie-modal-title');
    modal.setAttribute('aria-describedby', 'pw-cookie-modal-desc');

    modal.innerHTML =
      '<div class="pw-cookie-modal__backdrop" id="pw-cookie-backdrop" aria-hidden="true"></div>' +
      '<div class="pw-cookie-modal__stage">' +
        '<div class="pw-cookie-modal__header">' +
          '<h2 class="pw-cookie-modal__title" id="pw-cookie-modal-title">' + t.modalTitle + '</h2>' +
          '<button type="button" class="pw-cookie-modal__close" id="pw-cookie-close" aria-label="' + t.closeModal + '">✕</button>' +
        '</div>' +
        '<div class="pw-cookie-modal__body">' +
          '<p class="pw-cookie-modal__intro" id="pw-cookie-modal-desc">' + t.modalIntro + '</p>' +
          '<div class="pw-cookie-categories">' +
            // Categoria 1: Necessàries (sempre actives, disabled)
            '<div class="pw-cookie-card">' +
              '<div class="pw-cookie-card__head">' +
                '<div class="pw-cookie-card__info">' +
                  '<h3 class="pw-cookie-card__name">' + t.necessaryTitle + '</h3>' +
                  '<span class="pw-cookie-card__badge pw-cookie-card__badge--always">' + t.necessaryBadge + '</span>' +
                '</div>' +
                '<label class="pw-toggle">' +
                  '<input type="checkbox" checked disabled aria-label="' + t.necessaryTitle + ': ' + t.necessaryBadge + '">' +
                  '<span class="pw-toggle__track"><span class="pw-toggle__thumb"></span></span>' +
                '</label>' +
              '</div>' +
              '<p class="pw-cookie-card__desc">' + t.necessaryDesc + '</p>' +
            '</div>' +
            // Categoria 2: Analítica (Google Analytics 4, desmarcada per defecte per a nous visitants)
            '<div class="pw-cookie-card">' +
              '<div class="pw-cookie-card__head">' +
                '<div class="pw-cookie-card__info">' +
                  '<h3 class="pw-cookie-card__name">' + t.analyticsTitle + '</h3>' +
                  '<span class="pw-cookie-card__badge pw-cookie-card__badge--vendor">' + t.analyticsBadge + '</span>' +
                '</div>' +
                '<label class="pw-toggle" for="pw-cookie-analytics-check">' +
                  '<input type="checkbox" id="pw-cookie-analytics-check" aria-label="' + t.analyticsTitle + ': ' + t.analyticsBadge + '">' +
                  '<span class="pw-toggle__track"><span class="pw-toggle__thumb"></span></span>' +
                '</label>' +
              '</div>' +
              '<p class="pw-cookie-card__desc">' + t.analyticsDesc + '</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pw-cookie-modal__footer">' +
          '<button type="button" class="pw-cookie-modal__btn pw-cookie-modal__btn--reject-all" id="pw-cookie-reject-all">' + t.rejectAll + '</button>' +
          '<button type="button" class="pw-cookie-modal__btn pw-cookie-modal__btn--accept-all" id="pw-cookie-accept-all">' + t.acceptAll + '</button>' +
          '<button type="button" class="pw-cookie-modal__btn pw-cookie-modal__btn--save" id="pw-cookie-save">' + t.save + '</button>' +
        '</div>' +
      '</div>';

    return modal;
  }

  /**
   * Obre el modal de preferències
   */
  function openSettings() {
    if (typeof document === 'undefined') return;

    state.lastFocusedEl = document.activeElement;

    // Sincronitza l'estat del toggle amb el consentiment actual
    var analyticsCheck = document.getElementById('pw-cookie-analytics-check');
    if (analyticsCheck && typeof window !== 'undefined' && window.PW_ANALYTICS) {
      analyticsCheck.checked = Boolean(window.PW_ANALYTICS.hasConsent());
    }

    if (state.bannerEl) {
      state.bannerEl.classList.remove('is-visible');
    }

    if (state.modalEl) {
      state.modalEl.classList.add('is-open');
      document.body.style.overflow = 'hidden';

      // Posicionar el focus al primer element interactiu (botó de tancar)
      var closeBtn = document.getElementById('pw-cookie-close');
      if (closeBtn && typeof closeBtn.focus === 'function') {
        closeBtn.focus();
      }
    }
  }

  /**
   * Tanca el modal de preferències i restaura el focus
   */
  function closeSettings() {
    if (state.modalEl) {
      state.modalEl.classList.remove('is-open');
    }
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    if (state.lastFocusedEl && typeof state.lastFocusedEl.focus === 'function') {
      state.lastFocusedEl.focus();
    }
  }

  /**
   * Acció d'acceptar totes les cookies (analítica activada)
   */
  function acceptAll() {
    if (typeof window !== 'undefined' && window.PW_ANALYTICS && typeof window.PW_ANALYTICS.grantAnalyticsConsent === 'function') {
      window.PW_ANALYTICS.grantAnalyticsConsent();
    }
    if (state.bannerEl) {
      state.bannerEl.classList.remove('is-visible');
    }
    closeSettings();
  }

  /**
   * Acció de rebutjar les cookies analítiques (només necessàries)
   */
  function rejectAll() {
    if (typeof window !== 'undefined' && window.PW_ANALYTICS && typeof window.PW_ANALYTICS.revokeAnalyticsConsent === 'function') {
      window.PW_ANALYTICS.revokeAnalyticsConsent();
    }
    if (state.bannerEl) {
      state.bannerEl.classList.remove('is-visible');
    }
    closeSettings();
  }

  /**
   * Desa les preferències segons l'estat del checkbox del modal
   */
  function savePreferences() {
    var check = document.getElementById('pw-cookie-analytics-check');
    var isGranted = check ? check.checked : false;
    if (isGranted) {
      acceptAll();
    } else {
      rejectAll();
    }
  }

  /**
   * Enllaça els esdeveniments dels elements del banner i del modal
   */
  function bindEvents() {
    var btnAccept = document.getElementById('pw-cookie-accept');
    var btnReject = document.getElementById('pw-cookie-reject');
    var btnConfig = document.getElementById('pw-cookie-config');
    var btnClose = document.getElementById('pw-cookie-close');
    var backdrop = document.getElementById('pw-cookie-backdrop');
    var btnSave = document.getElementById('pw-cookie-save');
    var btnAcceptAll = document.getElementById('pw-cookie-accept-all');
    var btnRejectAll = document.getElementById('pw-cookie-reject-all');

    if (btnAccept) btnAccept.addEventListener('click', acceptAll);
    if (btnReject) btnReject.addEventListener('click', rejectAll);
    if (btnConfig) btnConfig.addEventListener('click', openSettings);
    if (btnClose) btnClose.addEventListener('click', closeSettings);
    if (backdrop) backdrop.addEventListener('click', closeSettings);
    if (btnSave) btnSave.addEventListener('click', savePreferences);
    if (btnAcceptAll) btnAcceptAll.addEventListener('click', acceptAll);
    if (btnRejectAll) btnRejectAll.addEventListener('click', rejectAll);

    // Delegació per al botó del peu de pàgina i enllaços legals
    document.addEventListener('click', function (e) {
      if (!e || !e.target || typeof e.target.closest !== 'function') return;
      var trigger = e.target.closest('[data-open-cookie-settings], [data-cookie-settings], a[href*="cookies#settings"]');
      if (trigger) {
        e.preventDefault();
        openSettings();
      }
    });

    // Teclat: Focus trap i Escape
    document.addEventListener('keydown', function (e) {
      if (!state.modalEl || !state.modalEl.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeSettings();
        return;
      }

      if (e.key === 'Tab') {
        var focusables = state.modalEl.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;

        var firstEl = focusables[0];
        var lastEl = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    });
  }

  /**
   * Inicialitza la interfície de consentiment de cookies
   */
  function init() {
    if (typeof document === 'undefined') return;
    if (state.initialized) return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    var t = getI18n();

    // Crear elements
    state.bannerEl = createBannerElement(t);
    state.modalEl = createModalElement(t);

    document.body.appendChild(state.bannerEl);
    document.body.appendChild(state.modalEl);

    // Comprovar si l'usuari ja té una decisió vàlida
    var consentStatus = null;
    if (typeof window !== 'undefined' && window.PW_ANALYTICS && typeof window.PW_ANALYTICS.getConsentStatus === 'function') {
      consentStatus = window.PW_ANALYTICS.getConsentStatus();
    }

    // Si no hi ha decisió prèvia desada o ha caducat, mostrem el banner
    if (!consentStatus || !consentStatus.hasStoredDecision) {
      state.bannerEl.classList.add('is-visible');
    }

    bindEvents();
    state.initialized = true;
  }

  return {
    init: init,
    openSettings: openSettings,
    closeSettings: closeSettings,
    acceptAll: acceptAll,
    rejectAll: rejectAll,
    savePreferences: savePreferences,
    getLanguage: detectLanguage,
    getI18n: getI18n
  };
}));
