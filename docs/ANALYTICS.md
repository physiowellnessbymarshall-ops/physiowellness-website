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

La propietat oficial de Google Analytics 4 de Physio Wellness by Marshall està configurada amb l'identificador:

> **Identificador de mesurament**: `G-C4CBYG7W5K`

Com que aquesta web és una **MPA estàtica en HTML/CSS/JavaScript vanilla** (sense bundlers ni eines de compilació com Vite o Webpack), un fitxer `.env` local **NO arriba directament al navegador del client**. Per tant, la configuració està desacoblada i centralitzada a `src/js/analytics-config.js`:

```javascript
window.PW_CONFIG = window.PW_CONFIG || {};
window.PW_CONFIG.GA4_MEASUREMENT_ID = window.PW_CONFIG.GA4_MEASUREMENT_ID || 'G-C4CBYG7W5K';
```

### Desplegament a Producció (GitHub Actions → Hostinger)
El workflow `.github/workflows/deploy-production.yml` inclou per defecte el valor oficial `G-C4CBYG7W5K`, permetent també sobreescriure'l des de les variables de repositori de GitHub (`vars.GA4_MEASUREMENT_ID`) si fos necessari en el futur:

1. Repositori a GitHub:
   **Settings → Secrets and variables → Actions → Variables**
2. Variable de repositori (opcional com a override):
   - **Name**: `GA4_MEASUREMENT_ID`
   - **Value**: `G-C4CBYG7W5K`
3. Execució automàtica en cada desplegament a `production`.

### Proves Locals en Desenvolupament
A `src/js/analytics-config.js` l'identificador `G-C4CBYG7W5K` ja ve configurat per defecte. A `localhost`, el mòdul `analytics.js` intercepta l'enviament real a xarxa per protegir les estadístiques de producció, mostrant els esdeveniments a la consola si s'activa el mode depuració (`window.PW_ANALYTICS_DEBUG = true`).

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

## 5. Mesurament de Conversions i Auto-tracking (FASE P2-B)

El mòdul `src/js/analytics.js` inclou un sistema d'**auto-tracking delegat** que s'inicialitza automàticament a totes les pàgines i captura les accions clau de conversió i contacte sense necessitat de codi addicional als enllaços HTML:

### 1. Clic a DocFav (`click_docfav`)
- **Descripció**: Mesura la intenció de reserva quan l'usuari fa clic cap a la plataforma externa DocFav.
- **IMPORTANT**: **Un clic a DocFav NO equival a una reserva confirmada** (`purchase` o `booking_confirmed`). Es registra estrictament com a intenció de reserva externa (`booking_intent`) per no distorsionar les conversions finals.
- **Paràmetres enviats**:
  - `event_category`: `'booking_intent'`
  - `destination`: `'docfav'`
  - `booking_channel`: `'docfav_portal'`
  - `cta_text`: text visible del botó o enllaç (ex: *"Reservar primera visita"*)
  - `cta_location`: context estructural (`booking_panel`, `sticky_mobile_bar`, `hero`, `pricing_section`, `footer`, etc.)
  - `service`: servei deduït del context (`fisioterapia`, `pilates`, `forca`, `benestar`, `stretching`, `fisioterapia_domicili`, `primera_visita`, `general`)
  - `page_path`: ruta actual
  - `language`: `'ca' | 'es' | 'en'`

### 2. Clic a WhatsApp (`click_whatsapp`)
- **Descripció**: Mesura l'inici de consulta directa o resolució de dubtes via WhatsApp oficial (+34 644 67 83 44).
- **Privacitat mèdica**: **Mai s'inclouen dades mèdiques sensibles**, símptomes ni diagnòstics en els paràmetres de l'esdeveniment.
- **Paràmetres enviats**:
  - `event_category`: `'contact_intent'`
  - `contact_channel`: `'whatsapp'`
  - `destination_number`: `'+34644678344'`
  - `cta_text`: text del botó
  - `cta_location`: context estructural
  - `service`: servei associat
  - `page_path`: ruta actual
  - `language`: `'ca' | 'es' | 'en'`

### 3. Clic al Telèfon (`click_phone`)
- **Descripció**: Mesura quan l'usuari prem un enllaç `tel:+34644678344`.
- **Paràmetres enviats**:
  - `event_category`: `'contact_intent'`
  - `contact_channel`: `'phone'`
  - `phone_number`: `'+34644678344'`
  - `cta_text`: text del botó
  - `cta_location`: context estructural
  - `service`: servei associat
  - `page_path`: ruta actual
  - `language`: `'ca' | 'es' | 'en'`

### 4. Formulari de Contacte (`form_start` i `contact_whatsapp_initiated`)
- **`form_start`**: Es dispara la primera vegada que l'usuari interactua amb el formulari de contacte (`event_category: 'form_interaction'`).
- **`contact_whatsapp_initiated`**: Es dispara quan l'usuari completa la validació del formulari i prem "Continuar per WhatsApp".
  - **Diferenciació de conversió real vs intenció (P2-C)**: No s'utilitza `generate_lead` per evitar que Google Ads comptabilitzi una conversió tancada quan l'usuari només obre l'aplicació externa de WhatsApp. S'envien els paràmetres `{ event_category: 'contact_intent', status: 'initiated_unconfirmed', method: 'whatsapp', contact_channel: 'whatsapp', cta_location: 'contact_form' }` per distingir amb rigor tècnic la intenció d'enviament del contacte confirmat.

### Arquitectura Anti-duplicacions (GA4 vs GTM)
A P2-C s'ha implementat una protecció activa contra duplicacions:
1. **Mode Directe GA4 (gtag.js natiu, configuració actual)**: Els esdeveniments es transmeten exclusivament via `window.gtag('event', eventName, params)`, que ja s'encarrega d'encuar els arguments a `dataLayer` per a GA4. No es realitza un `dataLayer.push({ event: ... })` redundant per evitar dobles conversions en cas que s'afegeixin píxels addicionals.
2. **Mode Google Tag Manager (GTM)**: Si es detecta la presència de `window.google_tag_manager`, `PW_ANALYTICS` commuta automàticament a enviar l'objecte `{ event: eventName, ...params }` a `dataLayer` i suspèn la crida directa a `gtag('event')`, garantint que cap esdeveniment es comptabilitzi per duplicat a GA4.

**Protecció de privacitat i localhost**:
- Si l'usuari **no ha atorgat consentiment analític**, els esdeveniments s'ometen completament sense crides de xarxa.
- A `localhost` o entorns locals, els esdeveniments es mostren a la consola en mode debug sense transmetre dades a Google.

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
