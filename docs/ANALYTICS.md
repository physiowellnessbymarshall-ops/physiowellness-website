# Google Analytics 4 & Privacitat — Physio Wellness by Marshall

Aquest document detalla l'arquitectura, configuració i ús de la integració de **Google Analytics 4 (GA4)** a Physio Wellness.

---

## 1. Principis de Disseny i Privacitat

1. **Privacitat per defecte (Google Consent Mode v2 Bàsic)**:
   - Abans que l'usuari prengui una decisió, l'estat de consentiment es defineix com a `denied` per a totes les categories:
     - `analytics_storage`: `denied`
     - `ad_storage`: `denied`
     - `ad_user_data`: `denied`
     - `ad_personalization`: `denied`
   - La web **no utilitza publicitat, remarketing ni personalització d'anuncis**.
   - **Càrrega de script completament bloquejada**: Cap petició de xarxa a Google (`googletagmanager.com` o `google-analytics.com`) s'executa fins que l'usuari atorga consentiment explícit.
2. **Protecció d'entorns de desenvolupament (Localhost)**:
   - A `localhost`, `127.0.0.1`, `0.0.0.0` o `*.local`, el mòdul bloqueja l'enviament de dades reals a GA4 per evitar contaminar les mètriques de producció.
   - En mode desenvolupament (`window.PW_ANALYTICS_DEBUG = true`), les vistes i esdeveniments es mostren a la consola del navegador per verificar el funcionament sense fer crides de xarxa.
3. **Independència de dominis**:
   - No hi ha cap domini hardcodejat al codi.
   - Funciona de forma transparent tant al domini provisional de Hostinger (`darkcyan-chinchilla-609962.hostingersite.com`) com al domini de producció definitiu (`https://physiowellness.es`).
   - La neteja de cookies en revocar consentiment dedueix dinàmicament el domini actual des de `window.location.hostname`.
4. **Arquitectura Multi-Pàgina (MPA)**:
   - Cada pàgina carrega de manera asíncrona el mòdul centralitzat `src/js/analytics.js`.
   - Les vistes de pàgina capturen automàticament `page_title`, `page_location`, `page_path` i l'idioma (`ca`, `es`, `en`) deduint-lo de l'etiqueta `<html lang="...">` i la ruta de la URL.

---

## 2. On posar el Measurement ID

Per seguretat, mantenibilitat i coherència amb l'arquitectura estàtica del projecte, **no hi ha cap Measurement ID hardcodejat al repositori**.

Com que aquesta web és una **MPA estàtica en HTML/CSS/JavaScript vanilla** (sense bundlers ni eines de compilació com Vite o Webpack), un fitxer `.env` local **NO arriba directament al navegador del client**. Per tant, la configuració està desacoblada i es gestiona mitjançant el següent sistema:

### Opció Principal: Desplegament a Producció (GitHub Actions → Hostinger)
Quan tinguem el Measurement ID real de GA4, només caldrà:

1. Anar al repositori a GitHub:
   **Settings → Secrets and variables → Actions → Variables**
2. Crear una nova variable de repositori:
   - **Name**: `GA4_MEASUREMENT_ID`
   - **Value**: `G-XXXXXXXXXX` (el teu Measurement ID real)
3. Executar o esperar el següent desplegament (workflow `.github/workflows/deploy-production.yml`).

**Com funciona internament en el desplegament**:
- Durant el workflow de GitHub Actions, abans de publicar a la branca `production` que rep Hostinger, el runner llegeix `${{ vars.GA4_MEASUREMENT_ID }}` i genera automàticament `src/js/analytics-config.js`:
  ```javascript
  window.PW_CONFIG = window.PW_CONFIG || {};
  window.PW_CONFIG.GA4_MEASUREMENT_ID = 'VALOR_DE_LA_VARIABLE';
  ```
- **Resiliència**: Si la variable `GA4_MEASUREMENT_ID` encara no existeix o està buida a GitHub, **el deploy NO falla**. El workflow genera `analytics-config.js` amb valor buit (`''`) i Google Analytics roman completament desactivat de manera segura.
- El fitxer generat s'afegeix exclusivament a la branca de producció (`deploy-production` → `production`), mentre que a les branques de desenvolupament roman protegit i ignorat per `.gitignore`.

### Opció Secundària: Proves Locals en Desenvolupament
Per testejar localment sense dependre de GitHub Actions:
1. Copia la plantilla `src/js/analytics-config.example.js` creant el fitxer `src/js/analytics-config.js`:
   ```javascript
   window.PW_CONFIG = window.PW_CONFIG || {};
   window.PW_CONFIG.GA4_MEASUREMENT_ID = 'G-EL_TEU_ID_REAL';
   ```
2. Aquest fitxer està registrat a `.gitignore` i no es pujarà mai a GitHub.
3. Si el fitxer no existeix localment, la web carrega igualment amb normalitat sense generar cap error de consola (l'intent de càrrega falla amb seguretat a l'error-handler i el sistema continua).

### Opció Alternativa: Etiqueta `<meta>` o Inicialització per Codi
També es pot definir directament a la capçalera HTML:
```html
<meta name="ga-measurement-id" content="G-EL_TEU_ID_REAL">
```
O per codi JavaScript:
```javascript
window.PW_ANALYTICS.init({ measurementId: 'G-EL_TEU_ID_REAL' });
```

> **Nota de Privacitat**: Fins i tot si es configura un Measurement ID vàlid, **mai s'enviarà cap dada a Google fins que l'usuari atorgui el seu consentiment explícit** al futur banner de cookies, i a `localhost` l'enviament continuarà sempre blocat.

---

## 3. Com funciona la inicialització

1. A cada càrrega de pàgina, `src/js/main.js` carrega i inicialitza el mòdul `src/js/analytics.js`.
2. El mòdul:
   - Defineix `window.dataLayer` i la funció `gtag()`.
   - Estableix el consentiment per defecte en `denied` per a tots els paràmetres de Consent Mode v2.
   - Comprova si a `localStorage` hi ha una decisió prèvia de consentiment vàlida (amb antiguitat inferior a 12 mesos).
   - Si no hi ha consentiment previ, **no fa res més**: el script de Google Tag no s'injecta i no s'envia cap dada.
   - Si detecta consentiment previ atorgat i no està en localhost, carrega asíncronament `gtag.js` i registra la vista de pàgina inicial.

---

## 4. Com s'activa Analytics després del consentiment

Quan s'implementi el banner de cookies i l'usuari accepti l'analítica, només cal cridar:

```javascript
window.PW_ANALYTICS.grantAnalyticsConsent();
```

Aquest mètode:
1. Actualitza Google Consent Mode v2:
   ```javascript
   gtag('consent', 'update', { 'analytics_storage': 'granted' });
   ```
2. Desa la decisió de l'usuari a `localStorage` sota la clau `pw_cookie_consent` (amb versió i timestamp).
3. Inicia la càrrega asíncrona de `https://www.googletagmanager.com/gtag/js?id=G-...`.
4. Inicialitza la configuració de GA4 amb `anonymize_ip: true` i `send_page_view: false` (per evitar duplicats).
5. Dispara el primer registre de vista de pàgina (`page_view`).

Si l'usuari rebutja o revoca el seu consentiment des del panell de preferències:

```javascript
window.PW_ANALYTICS.revokeAnalyticsConsent();
```

Aquest mètode:
1. Actualitza Consent Mode: `analytics_storage: 'denied'`.
2. Activa el flag oficial d'opt-out de Google: `window['ga-disable-' + ID] = true`.
3. Esborra automàticament les cookies analítiques pròpies (`_ga`, `_gid`, `_gat`, `_ga_*`) a tots els subdominis i camins del domini actual.
4. Desa la decisió revocada a `localStorage`.

---

## 5. Com registrar futurs esdeveniments de negoci

La capa d'analítica ofereix el mètode `trackEvent()` (i l'àlies global `pwTrackEvent()`):

```javascript
// Sintaxi
window.PW_ANALYTICS.trackEvent(nomEsdeveniment, parametresOpcionals);

// Exemples per a fases posteriors:
window.PW_ANALYTICS.trackEvent('whatsapp_click', {
  cta_location: 'hero',
  language: 'ca'
});

window.PW_ANALYTICS.trackEvent('booking_click', {
  service: 'fisioterapia',
  cta_location: 'nav_header'
});

window.PW_ANALYTICS.trackEvent('generate_lead', {
  form_type: 'contact_form',
  cta_location: 'footer'
});
```

**Comportament segur**:
- Si l'usuari **no ha donat consentiment**, `trackEvent()` s'omet silenciosament sense provocar cap error ni bloqueig.
- Si estem a **localhost**, simula l'esdeveniment a la consola si el mode debug està actiu, sense enviar peticions de xarxa a Google.

---

## 6. Banner de Cookies i Panell de Preferències (FASE 2)

La capa d'interfície d'usuari es troba a `src/js/cookie-consent.js` i s'integra automàticament des de `src/js/main.js`:

1. **Banner Inicial (Capa 1)**:
   - Apareix només a nous visitants o si el consentiment ha caducat (> 12 mesos).
   - Textos exactes i localitzats per a **CAT**, **ES** i **EN**.
   - Tres botons: **Acceptar**, **Rebutjar** i **Configurar**.
   - **Sense Dark Patterns**: "Acceptar" i "Rebutjar" tenen una visibilitat, jerarquia i àrea de clic idèntiques (`min-height: 44px`, distribució al 50% en dispositius mòbils).
   - No bloqueja la navegació del contingut del lloc web.

2. **Panell de Preferències / Modal (Capa 2)**:
   - Dues úniques categories reals:
     - **Necessàries**: Sempre actives (disabled, checked) amb descripció de funcionament bàsic i segur.
     - **Analítiques**: Desactivades per defecte per a nous visitants, controlades mitjançant un toggle switch accessible.
   - Botó d'acció principal: **"Desar preferències"** (així com opcions directes d'Acceptar tot i Rebutjar tot).
   - Accessibilitat completa: navegació per teclat, focus trap, tancament amb la tecla `Escape`, restauració del focus a l'element d'origen i suport per a `prefers-reduced-motion`.

3. **Connexió amb PW_ANALYTICS**:
   - Acceptar crida exclusivament a `window.PW_ANALYTICS.grantAnalyticsConsent()`.
   - Rebutjar o desar el toggle desactivat crida `window.PW_ANALYTICS.revokeAnalyticsConsent()`.
   - Des del footer de totes les pàgines i idiomes, els botons `<button data-open-cookie-settings>` obren directament el panell de preferències mostrant l'estat actual.

---

## 7. Seguretat i Content Security Policy (CSP)

A `.htaccess`, les directives de seguretat ja estan configurades per donar suport a Google Analytics 4 sense afegir comodins oberts (`*`) ni relaxar la seguretat:

- `script-src`: `'self' 'unsafe-inline' https://www.googletagmanager.com`
- `connect-src`: `'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com`
- `img-src`: `'self' data: https: https://*.google-analytics.com https://*.googletagmanager.com`

Aquestes regles permeten exclusivament els endpoints oficials de Google per a gtag i la recollida de mètriques de GA4.
