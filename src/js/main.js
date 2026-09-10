/* ==========================================================================
   Physio Wellness — prototipo Home — main.js
   Cada bloque va envuelto en try/catch: un efecto roto no tumba el resto.
   Todo el contenido crítico ya está en el HTML; esto solo enriquece.
   ========================================================================== */

document.documentElement.classList.add('js');

var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- header: fondo sólido + ocultar/mostrar según dirección de scroll ----------
   Componente global (se sirve desde el único main.js compartido por todas las
   páginas): no es una implementación exclusiva de Fisioterapia. Se oculta al
   bajar y reaparece al subir, con una zona muerta (MIN_DELTA) para no
   reaccionar a temblores mínimos, y se fuerza siempre visible cerca del
   principio de la página, con el menú móvil abierto, con el panel de reserva
   abierto o mientras el foco de teclado esté dentro del header (nav, botón de
   reserva), para no esconder nunca un elemento con foco. */
(function headerState(){
  try{
    var header = document.getElementById('site-header');
    if(!header) return;
    var mobileMenuEl = document.getElementById('mobile-menu');
    var bookingPanel = document.getElementById('booking-panel');

    var SHOW_NEAR_TOP = 96;
    var MIN_DELTA = 8;

    var lastY = window.scrollY;
    var hidden = false;
    var focusWithin = false;
    var ticking = false;

    var setHidden = function(next){
      if(next === hidden) return;
      hidden = next;
      header.classList.toggle('is-hidden', hidden);
    };

    var forceVisible = function(){
      return focusWithin
        || window.scrollY <= SHOW_NEAR_TOP
        || (mobileMenuEl && mobileMenuEl.classList.contains('is-open'))
        || (bookingPanel && !bookingPanel.hidden);
    };

    var apply = function(){
      ticking = false;
      var y = window.scrollY;
      header.classList.toggle('is-solid', y > 24);

      if(forceVisible()){
        setHidden(false);
        lastY = y;
        return;
      }

      var delta = y - lastY;
      if(Math.abs(delta) < MIN_DELTA) return;
      setHidden(delta > 0);
      lastY = y;
    };

    var onScroll = function(){
      if(ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, {passive:true});

    /* el foco de teclado en cualquier enlace/botón del header lo mantiene visible */
    header.addEventListener('focusin', function(){
      focusWithin = true;
      setHidden(false);
    });
    header.addEventListener('focusout', function(){
      window.setTimeout(function(){
        focusWithin = header.contains(document.activeElement);
      }, 0);
    });
  }catch(e){ console.warn('headerState', e); }
})();

/* ---------- desplegables de navegación y recorrido de reserva ----------
   Patrón "disclosure" accesible: funciona con clic, toque y teclado.
   Un mismo panel puede tener varios disparadores (p. ej. el CTA del header
   y el botón fijo inferior de móvil comparten el panel de reserva).      */
(function disclosures(){
  try{
    var toggles = Array.prototype.slice.call(document.querySelectorAll('[data-disclosure-toggle]'));
    if(!toggles.length) return;

    /* panel id -> {panel, triggers[]} */
    var panels = {};
    toggles.forEach(function(btn){
      var id = btn.getAttribute('aria-controls');
      var panel = id ? document.getElementById(id) : null;
      if(!panel) return;
      if(!panels[id]) panels[id] = {panel:panel, triggers:[]};
      panels[id].triggers.push(btn);
      btn.__disclosureId = id;
    });

    var isOpen = function(id){ return !panels[id].panel.hidden; };

    var setState = function(id, open){
      var entry = panels[id];
      if(!entry) return;
      entry.panel.hidden = !open;
      entry.triggers.forEach(function(t){ t.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    };

    var closeAll = function(except){
      Object.keys(panels).forEach(function(id){
        if(id !== except) setState(id, false);
      });
    };

    var open = function(id){
      /* solo un desplegable abierto a la vez */
      closeAll(id);
      /* un panel ajeno al menú móvil (la reserva) no puede convivir con él:
         el menú ocupa toda la pantalla, así que se cierra antes de abrirlo */
      var menu = document.getElementById('mobile-menu');
      if(menu && !menu.contains(panels[id].panel)){
        document.dispatchEvent(new CustomEvent('pw:closemobilemenu'));
      }
      setState(id, true);
    };

    var close = function(id, returnFocus){
      if(!panels[id]) return;
      setState(id, false);
      if(returnFocus){
        var trigger = panels[id].triggers.filter(function(t){ return t.offsetParent !== null; })[0]
                   || panels[id].triggers[0];
        if(trigger) trigger.focus();
      }
    };

    toggles.forEach(function(btn){
      var id = btn.__disclosureId;
      if(!id) return;

      btn.addEventListener('click', function(){
        if(isOpen(id)) close(id, false); else open(id);
      });

      btn.addEventListener('keydown', function(e){
        if(e.key === 'ArrowDown'){
          e.preventDefault();
          if(!isOpen(id)) open(id);
          var first = panels[id].panel.querySelector('a,button');
          if(first) first.focus();
        } else if(e.key === 'ArrowUp' && isOpen(id)){
          e.preventDefault();
          close(id, false);
        }
      });
    });

    Object.keys(panels).forEach(function(id){
      var panel = panels[id].panel;

      /* cerrar al seleccionar una opción */
      panel.querySelectorAll('a').forEach(function(a){
        a.addEventListener('click', function(){ setState(id, false); });
      });

      /* botón de cierre explícito (hoja inferior de reserva en móvil) */
      panel.querySelectorAll('[data-disclosure-close]').forEach(function(b){
        b.addEventListener('click', function(){ close(id, true); });
      });

      /* Escape dentro del panel */
      panel.addEventListener('keydown', function(e){
        if(e.key === 'Escape'){ e.stopPropagation(); close(id, true); }
      });
    });

    /* Escape global */
    document.addEventListener('keydown', function(e){
      if(e.key !== 'Escape') return;
      Object.keys(panels).forEach(function(id){
        if(isOpen(id)) close(id, true);
      });
    });

    /* clic o toque fuera */
    document.addEventListener('pointerdown', function(e){
      Object.keys(panels).forEach(function(id){
        if(!isOpen(id)) return;
        var entry = panels[id];
        if(entry.panel.contains(e.target)) return;
        var onTrigger = entry.triggers.some(function(t){ return t.contains(e.target); });
        if(onTrigger) return;
        setState(id, false);
      });
    });

    /* salir con el tabulador del grupo cierra el desplegable */
    document.addEventListener('focusin', function(e){
      Object.keys(panels).forEach(function(id){
        if(!isOpen(id)) return;
        var entry = panels[id];
        if(entry.panel.contains(e.target)) return;
        var onTrigger = entry.triggers.some(function(t){ return t.contains(e.target); });
        if(onTrigger) return;
        setState(id, false);
      });
    });
  }catch(e){ console.warn('disclosures', e); }
})();

/* ---------- menú móvil a pantalla completa ---------- */
(function mobileMenu(){
  try{
    var toggle = document.getElementById('menu-toggle');
    var close = document.getElementById('menu-close');
    var menu = document.getElementById('mobile-menu');
    if(!toggle || !menu) return;

    var open = function(){
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded','true');
      toggle.setAttribute('aria-label','Cerrar menú');
      document.body.style.overflow = 'hidden';
      if(close) close.focus();
    };
    var closeMenu = function(returnFocus){
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Abrir menú');
      document.body.style.overflow = '';
      /* los acordeones vuelven a su estado cerrado */
      menu.querySelectorAll('[data-disclosure-toggle]').forEach(function(btn){
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if(panel){ panel.hidden = true; }
        btn.setAttribute('aria-expanded','false');
      });
      if(returnFocus !== false) toggle.focus();
    };

    toggle.addEventListener('click', function(){
      if(menu.classList.contains('is-open')) closeMenu(); else open();
    });
    if(close) close.addEventListener('click', function(){ closeMenu(); });

    /* el recorrido de reserva se abre por encima: el menú se retira */
    document.addEventListener('pw:closemobilemenu', function(){
      if(menu.classList.contains('is-open')) closeMenu(false);
    });

    /* cerrar al seleccionar cualquier enlace del menú */
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ closeMenu(false); });
    });

    menu.addEventListener('keydown', function(e){
      if(e.key !== 'Escape') return;
      /* si hay un acordeón abierto, Escape lo cierra primero */
      var openAcc = menu.querySelector('[data-disclosure-toggle][aria-expanded="true"]');
      if(openAcc) return;
      closeMenu();
    });

    /* si se pasa a desktop con el menú abierto, se restablece el estado */
    if(window.matchMedia){
      var mq = window.matchMedia('(min-width:960px)');
      var onChange = function(ev){
        if(ev.matches && menu.classList.contains('is-open')) closeMenu(false);
      };
      if(mq.addEventListener) mq.addEventListener('change', onChange);
      else if(mq.addListener) mq.addListener(onChange);
    }
  }catch(e){ console.warn('mobileMenu', e); }
})();

/* ---------- hero: activar la secuencia de revelado ---------- */
(function heroReady(){
  try{
    var hero = document.querySelector('.hero');
    if(!hero) return;
    /* pequeño delay para asegurar que la transición CSS se aprecie */
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        hero.classList.add('is-ready');
      });
    });
  }catch(e){ console.warn('heroReady', e); }
})();

/* ---------- hero: transición de salida ligada al scroll ---------- */
(function heroExitTransition(){
  try{
    if(prefersReducedMotion) return;
    var hero = document.querySelector('.hero');
    var media = hero ? hero.querySelector('.hero__media img') : null;
    var content = hero ? hero.querySelector('.hero__content') : null;
    if(!hero || !media) return;

    var onScroll = function(){
      var vh = window.innerHeight;
      var y = window.scrollY;
      var progress = Math.min(Math.max(y / vh, 0), 1);

      /* la imagen se escala ligeramente más y se oscurece al salir */
      var scale = 1.06 + (progress * 0.06);
      media.style.transform = 'scale(' + scale + ')';

      if(content){
        content.style.transform = 'translate3d(0,' + (progress * 40) + 'px,0)';
        content.style.opacity = String(1 - progress * 0.9);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
  }catch(e){ console.warn('heroExitTransition', e); }
})();

/* ---------- hero de página con imagen (Tarifas y futuras internas) ----------
   Función aparte del hero de la Home (heroReady/heroExitTransition arriba)
   para no arriesgar ninguna regresión ahí: mismo lenguaje de movimiento
   (entrada suave, ligero zoom de la imagen al hacer scroll), aplicado a
   .page-hero--media. */
(function pageHeroMedia(){
  try{
    var hero = document.querySelector('.page-hero--media');
    if(!hero) return;

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ hero.classList.add('is-ready'); });
    });

    if(prefersReducedMotion) return;
    var media = hero.querySelector('.page-hero__media img');
    if(!media) return;

    var onScroll = function(){
      var vh = window.innerHeight;
      var progress = Math.min(Math.max(window.scrollY / vh, 0), 1);
      media.style.transform = 'scale(' + (1.04 + progress * 0.05) + ')';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
  }catch(e){ console.warn('pageHeroMedia', e); }
})();

/* ---------- "Elige tu área": panel activo + contexto asociado ----------
   Cada panel es un <button aria-pressed> que marca el área elegida; el
   enlace "Ver tarifas" de cada panel sigue siendo un <a href="#en-la-clinica">
   real y funciona igual sin JavaScript (las cinco áreas ya comparten el
   mismo precio, visible más abajo, con el texto fijo "Tarifa en clínica
   compartida por las cinco áreas." que NO cambia con la selección). Esto
   solo añade: el estado seleccionado (aria-pressed + clase is-selected, con
   su borde/insignia/texto propios) y la actualización del panel de contexto
   lateral/apilado (nombre del área, descripción de enfoque y CTA), que
   orienta sobre el enfoque de cada área, no sobre un precio distinto. */
(function areaSelector(){
  try{
    var tiles = document.querySelectorAll('.area-tile[data-area]');
    var context = document.getElementById('area-context');
    if(!tiles.length) return;

    var contextTitle = context ? context.querySelector('.area-context__title') : null;
    var contextText = context ? context.querySelector('.area-context__text') : null;
    var contextCta = context ? context.querySelector('.area-context__cta') : null;

    var selectArea = function(tile){
      var area = tile.getAttribute('data-area');
      var desc = tile.getAttribute('data-desc') || '';

      tiles.forEach(function(t){
        var btn = t.querySelector('.area-tile__select');
        var selected = t === tile;
        t.classList.toggle('is-selected', selected);
        if(btn) btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });

      if(contextTitle) contextTitle.textContent = area;
      if(contextText) contextText.textContent = desc;
      if(contextCta){
        contextCta.textContent = 'Ver tarifas de ' + area;
        contextCta.href = '#en-la-clinica';
        contextCta.removeAttribute('target');
        contextCta.removeAttribute('rel');
      }
    };

    tiles.forEach(function(tile){
      var btn = tile.querySelector('.area-tile__select');
      var cta = tile.querySelector('.area-tile__cta');
      if(btn) btn.addEventListener('click', function(){ selectArea(tile); });
      if(cta) cta.addEventListener('click', function(){ selectArea(tile); });
    });

    /* Conecta el área ya marcada en el HTML (is-selected, Physiotherapy)
       con el contexto de la tarifa desde la primera carga, sin esperar a
       un clic: label y panel de contexto quedan sincronizados de entrada. */
    var initialTile = document.querySelector('.area-tile.is-selected') || tiles[0];
    if(initialTile) selectArea(initialTile);
  }catch(e){ console.warn('areaSelector', e); }
})();

/* ---------- revelado de la sección de transición (siguiente bloque) ---------- */
(function revealOnScroll(){
  try{
    var items = document.querySelectorAll('[data-reveal]');
    if(!items.length) return;

    var show = function(el){ el.classList.add('is-visible'); };

    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            show(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, {threshold:.2, rootMargin:'0px 0px -8% 0px'});
      items.forEach(function(el){ io.observe(el); });
    } else {
      items.forEach(show);
    }

    /* red de seguridad: si el observer no dispara, se muestra igual */
    setTimeout(function(){ items.forEach(show); }, 2500);
  }catch(e){
    console.warn('revealOnScroll', e);
    document.querySelectorAll('[data-reveal]').forEach(function(el){ el.classList.add('is-visible'); });
  }
})();

/* ---------- Franja de confianza: conteo suave de las cifras ----------
   Solo anima los dos valores numéricos (10+, 1.500+); "Atención individual"
   y "Sitges" ya reciben su entrada sutil del [data-reveal] genérico que
   envuelve toda la lista (revealOnScroll(), justo arriba). Dispara una
   única vez al entrar en viewport — mismo patrón "un solo disparo" que
   revealOnScroll(): se desconecta el observer tras animar, así nunca se
   repite al subir/bajar por la página. Con prefers-reduced-motion, salta
   directo al valor final sin animar cifra a cifra. */
(function trustCounters(){
  try{
    var counters = document.querySelectorAll('[data-count-to]');
    if(!counters.length) return;

    var format = function(n){
      return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    var setFinal = function(el){
      var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
      var suffix = el.getAttribute('data-count-suffix') || '';
      el.textContent = format(target) + suffix;
    };

    if(prefersReducedMotion){
      counters.forEach(setFinal);
      return;
    }

    var DURATION = 900; /* ms: corta y elegante, alineada con --dur-slow */
    var easeOutCubic = function(t){ return 1 - Math.pow(1 - t, 3); };

    var animate = function(el){
      var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
      var suffix = el.getAttribute('data-count-suffix') || '';
      var start = null;

      var step = function(now){
        if(start === null) start = now;
        var progress = Math.min((now - start) / DURATION, 1);
        var value = Math.round(target * easeOutCubic(progress));
        el.textContent = format(value) + suffix;
        if(progress < 1) window.requestAnimationFrame(step);
        else setFinal(el);
      };
      window.requestAnimationFrame(step);
    };

    var run = function(){ counters.forEach(animate); };

    var list = document.querySelector('.trust__list');
    if('IntersectionObserver' in window && list){
      var io = new IntersectionObserver(function(entries, obs){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            run();
            obs.disconnect();
          }
        });
      }, {threshold:.4});
      io.observe(list);
    } else {
      run();
    }
  }catch(e){
    console.warn('trustCounters', e);
    document.querySelectorAll('[data-count-to]').forEach(function(el){
      var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
      var suffix = el.getAttribute('data-count-suffix') || '';
      el.textContent = String(target).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + suffix;
    });
  }
})();

/* ---------- Servicios: escenario fijado con recorrido horizontal ----------
   En escritorio amplio (≥1100px, sin motion reducido y con desbordamiento
   horizontal suficiente) el scroll vertical dentro de .services__pin-wrap
   mueve el riel de paneles con transform en vez de dejarlo como scroll
   horizontal normal: .services__pin-inner se queda fijo (position:sticky,
   ya resuelto en CSS) mientras el wrap tiene la altura extra necesaria
   para cubrir el recorrido horizontal completo. La rueda, el trackpad y el
   touch nunca se interceptan: todo el efecto es una función pura de la
   posición de scroll vertical ya existente (mismo patrón que
   umbralSequence(), leída de forma pasiva y aplicada con
   requestAnimationFrame). Sin JS, por debajo de 1100px, con motion
   reducido, o si no hay desbordamiento suficiente, la sección se queda tal
   cual: un riel de scroll horizontal nativo (ver CSS, mismo patrón que
   .google-reviews__viewport). */
(function servicesPinScroll(){
  try{
    var section = document.querySelector('.services');
    var pinWrap = section && section.querySelector('[data-services-pin]');
    var pinInner = pinWrap && pinWrap.querySelector('.services__pin-inner');
    var viewport = pinWrap && pinWrap.querySelector('[data-services-viewport]');
    var grid = pinWrap && pinWrap.querySelector('[data-services-track]');
    var header = document.getElementById('site-header');
    if(!section || !pinWrap || !pinInner || !viewport || !grid || !header) return;
    if(!window.matchMedia) return;

    var panels = grid.querySelectorAll('.service-panel');
    var transitionEl = grid.querySelector('.services__transition');
    if(!panels.length || !transitionEl) return;
    /* Las paradas del riel: los N servicios (panels.length, dinámico) + el
       panel de transición. Flechas, teclado y el indicador 01/0N trabajan
       siempre sobre este mismo array, tanto en modo fijado como en el riel
       nativo de respaldo, para no duplicar la lógica de sincronización. */
    var stopEls = Array.prototype.slice.call(panels).concat([transitionEl]);
    var serviceCount = panels.length;

    var progressWrap = section.querySelector('[data-services-progress]');
    var progressCurrent = section.querySelector('.services__progress-current');
    var prevBtn = section.querySelector('[data-services-prev]');
    var nextBtn = section.querySelector('[data-services-next]');

    var mq = window.matchMedia('(min-width:1100px)');

    var active = false;
    var maxTranslate = 0;
    var headerOffset = 0;
    var ticking = false;
    var fallbackTicking = false;
    var stopTargets = [];
    var currentIndex = 0;

    var resetInline = function(){
      pinWrap.style.height = '';
      pinInner.style.height = '';
      grid.style.transform = '';
      section.classList.remove('is-pin-active');
    };

    var deactivate = function(){
      if(!active) return;
      active = false;
      resetInline();
    };

    /* Traduce el índice de parada (0..serviceCount-1 = servicios,
       serviceCount = panel de transición) al texto "01/0N"…"0N/0N" y al
       estado disabled/is-final de flechas e indicador. Es el único punto
       que toca ese estado, tanto si lo dispara el scroll (fijado o riel
       nativo) como un clic o una tecla, para que nunca queden
       desincronizados entre sí. */
    var updateNav = function(index){
      currentIndex = index;
      var hasOverflow = maxTranslate > 0;

      if(progressCurrent){
        var label = index < serviceCount ? '0' + (index + 1) : ('0' + serviceCount);
        if(progressCurrent.textContent !== label) progressCurrent.textContent = label;
      }
      if(progressWrap) progressWrap.classList.toggle('is-final', index >= serviceCount);

      if(prevBtn) prevBtn.disabled = !hasOverflow || index <= 0;
      if(nextBtn) nextBtn.disabled = !hasOverflow || index >= stopEls.length - 1;
    };

    var nearestStopIndex = function(scrolled){
      var best = 0;
      var bestDist = Infinity;
      for(var i = 0; i < stopTargets.length; i++){
        var d = Math.abs(scrolled - stopTargets[i]);
        if(d < bestDist){ bestDist = d; best = i; }
      }
      return best;
    };

    /* aplica el progreso actual del escenario fijado: se llama tanto en
       cada frame de scroll como justo después de (re)activar, para no
       dejar un frame con el riel desalineado respecto al scroll real */
    var applyProgress = function(){
      ticking = false;
      if(!active) return;

      var rect = pinWrap.getBoundingClientRect();
      var scrolled = headerOffset - rect.top;
      scrolled = Math.min(Math.max(scrolled, 0), maxTranslate);
      grid.style.transform = 'translate3d(' + (-scrolled) + 'px,0,0)';

      updateNav(nearestStopIndex(scrolled));
    };

    var onScroll = function(){
      if(!active || ticking) return;
      ticking = true;
      window.requestAnimationFrame(applyProgress);
    };

    /* Modo de respaldo (por debajo de 1100px, motion reducido, o sin
       desbordamiento suficiente): el riel es el scroll horizontal nativo
       de .services__viewport; aquí solo mantenemos el indicador y las
       flechas sincronizados con scrollLeft, sin tocar transform ni la
       altura del wrap. */
    var applyFallbackNav = function(){
      fallbackTicking = false;
      if(active) return;
      updateNav(nearestStopIndex(viewport.scrollLeft));
    };

    var onViewportScroll = function(){
      if(active || fallbackTicking) return;
      fallbackTicking = true;
      window.requestAnimationFrame(applyFallbackNav);
    };

    /* Mide el contenido real y decide si el modo fijado tiene sentido, y
       recalcula las cinco paradas a partir de la posición real de cada
       panel (offsetLeft, no afectado por el transform aplicado al riel),
       nunca de valores fijos dependientes de una resolución concreta. */
    var measure = function(){
      var firstEl = stopEls[0];
      var stageWidth = viewport.clientWidth;
      var railWidth = grid.scrollWidth;
      var maxT = Math.max(0, railWidth - stageWidth);
      maxTranslate = maxT;

      stopTargets = stopEls.map(function(el){
        var raw = el.offsetLeft - firstEl.offsetLeft;
        return Math.min(Math.max(raw, 0), maxT);
      });

      var canPin = mq.matches && !prefersReducedMotion && maxT > 0 && stageWidth;

      if(!canPin){
        deactivate();
        applyFallbackNav();
        return;
      }

      headerOffset = header.offsetHeight || 0;

      var innerHeight = Math.max(window.innerHeight - headerOffset, 1);
      /* Permanencia breve y deliberada (~130px) para que el último panel tenga
         tiempo real de lectura serena antes del unpin, evitando desenganches bruscos. */
      var finalRunway = Math.round(Math.min(140, Math.max(90, innerHeight * 0.16)));
      var wrapHeight = innerHeight + maxTranslate + finalRunway;

      document.documentElement.style.setProperty('--services-pin-top', headerOffset + 'px');
      pinInner.style.height = innerHeight + 'px';
      pinWrap.style.height = wrapHeight + 'px';
      section.classList.add('is-pin-active');
      active = true;

      applyProgress();
    };

    /* Calcula el scrollY del documento que hace que el escenario fijado
       muestre exactamente `target` px de recorrido horizontal, a partir de
       la posición real (no hardcodeada) de .services__pin-wrap en el
       documento en el momento del clic. */
    var scrollYForTarget = function(target){
      var docTop = pinWrap.getBoundingClientRect().top + window.pageYOffset;
      return docTop + target - headerOffset;
    };

    /* Navegación manual: nunca mueve solo el transform. Desplaza el
       scroll real (de la página en modo fijado, del viewport en modo
       riel nativo) hasta la posición que corresponde a esa parada; el
       propio listener de scroll se encarga de recolocar el riel y el
       indicador según avanza la animación, así que estado visual, scroll
       real y transform quedan siempre sincronizados. */
    var goToStop = function(index){
      index = Math.min(Math.max(index, 0), stopEls.length - 1);
      var target = stopTargets[index];
      if(target === undefined) return;
      var behavior = prefersReducedMotion ? 'auto' : 'smooth';

      updateNav(index);

      if(active){
        window.scrollTo({ top: scrollYForTarget(target), behavior: behavior });
      } else {
        viewport.scrollTo({ left: target, behavior: behavior });
      }
    };

    var goPrev = function(){ goToStop(currentIndex - 1); };
    var goNext = function(){ goToStop(currentIndex + 1); };

    var isEditableTarget = function(el){
      if(!el) return false;
      var tag = el.tagName ? el.tagName.toLowerCase() : '';
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    };

    /* Flechas izquierda/derecha solo cuando la sección o sus controles
       tienen el foco, y nunca si el usuario está escribiendo en un campo
       editable en otra parte de la página. */
    var onKeydown = function(e){
      if(e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if(isEditableTarget(document.activeElement)) return;
      if(e.key === 'ArrowRight'){
        e.preventDefault();
        goNext();
      } else if(e.key === 'ArrowLeft'){
        e.preventDefault();
        goPrev();
      }
    };

    var resizeTimer = null;
    var scheduleMeasure = function(){
      if(resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 150);
    };

    if(prevBtn) prevBtn.addEventListener('click', goPrev);
    if(nextBtn) nextBtn.addEventListener('click', goNext);
    section.addEventListener('keydown', onKeydown);

    measure();
    window.addEventListener('scroll', onScroll, {passive:true});
    viewport.addEventListener('scroll', onViewportScroll, {passive:true});
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('orientationchange', scheduleMeasure);
    window.addEventListener('load', scheduleMeasure);

    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(scheduleMeasure)['catch'](function(){});
    }

    if('ResizeObserver' in window){
      var ro = new ResizeObserver(scheduleMeasure);
      ro.observe(viewport);
      ro.observe(grid);
    }

    if(mq.addEventListener) mq.addEventListener('change', scheduleMeasure);
    else if(mq.addListener) mq.addListener(scheduleMeasure);
  }catch(e){ console.warn('servicesPinScroll', e); }
})();

/* ---------- The Marshall Method — "El umbral": escena fijada al scroll ----------
   A diferencia del antiguo methodSequence() (que solo saltaba de fase en
   fase), aquí el pin queda activo en cualquier ancho — móvil incluido —
   mientras no haya motion reducido y la ventana tenga alto suficiente;
   lo único que cambia por breakpoint es cuánto scroll dura el recorrido
   (getStepFraction) y la intensidad física de cada capa (blur, recorrido
   de las veladuras, grosor del encuadre: variables --u-blur-max /
   --u-veil-travel / --u-frame-max en CSS §11), nunca la lógica de aquí.
   Cada frame de scroll (rAF, sin preventDefault ni sustituir el scroll
   nativo — mismo patrón que servicesPinScroll()) calcula una posición de
   fase continua (0 en "Escuchar" puro, 4 en "Evolucionar" puro) e
   interpola KEYFRAMES para escribir variables CSS numéricas en
   .umbral__stage: JS nunca decide color ni forma, solo mueve escalares.
   Sin JS, con motion reducido o en una ventana muy baja, measure() nunca
   activa el pin: las capas decorativas se quedan en display:none (CSS) y
   las cinco fases se leen como lista vertical normal vía [data-reveal],
   versión estática accesible que pide la dirección. */
(function umbralSequence(){
  try{
    var section = document.querySelector('.umbral');
    var pinWrap = section && section.querySelector('[data-umbral-pin]');
    var stage = pinWrap && pinWrap.querySelector('[data-umbral-stage]');
    var phasesHost = stage && stage.querySelector('[data-umbral-phases]');
    var numHost = stage && stage.querySelector('[data-umbral-num]');
    var header = document.getElementById('site-header');
    var bookBar = document.querySelector('.book-bar');
    if(!section || !pinWrap || !stage || !phasesHost || !numHost || !header) return;

    var phases = phasesHost.querySelectorAll('.umbral__phase');
    var digits = numHost.querySelectorAll('.umbral__num-digit');
    var progressItems = section.querySelectorAll('[data-progress-index]');
    var progressSegs = section.querySelectorAll('[data-progress-seg-index]');
    if(phases.length !== 5 || digits.length !== 5) return;

    /* Una entrada por fase ("momento"): JS solo interpola linealmente
       entre dos entradas consecutivas según la posición continua de
       scroll, nunca decide estos valores en tiempo real.
       veilA/veilB: 0=solapadas en el centro, 1=separadas del todo.
       veilAOp/veilBOp: opacidad de cada veladura.
       blur: 0=nítido, 1=blur máximo (§ --u-blur-max).
       coreX/coreY: posición del núcleo de luz (fracción 0..1 del escenario).
       coreScale/coreGlow: escala e intensidad del halo.
       coreWarm: 0=luz fría, 1=luz cálida.
       frame: 0=viñeta abierta del todo, 1=penumbra envolvente cerrada.
       bgDark: 0=halo neutro/mist visible, 1=sin halo (escena "cerrada").
       numOpacity: luminancia controlada del numeral monumental.
       numX/numY: microdesplazamiento tridimensional del numeral (§11 Fase 2). */
    var KEYFRAMES = [
      /* 0 — Escuchar: entrada en lo desconocido; contenida, íntima, luz fría focalizada,
             penumbra envolvente, numeral contenido que flota con calma. */
      {veilA:.01, veilB:.03, veilAOp:.92, veilBOp:.88, blur:.85,
       coreX:.5, coreY:.48, coreScale:.42, coreGlow:.24, coreWarm:0,
       frame:1, bgDark:1, numScale:.62, numOpacity:.20, numX:0, numY:6},
      /* 1 — Valorar: el espacio empieza a revelarse; apertura diagnóstica, la luz crece
             y gana foco, veladuras se separan dejando pasar el haz, el numeral emerge. */
      {veilA:.22, veilB:.38, veilAOp:.82, veilBOp:.68, blur:.52,
       coreX:.48, coreY:.45, coreScale:.68, coreGlow:.48, coreWarm:.08,
       frame:.62, bgDark:.78, numScale:.84, numOpacity:.28, numX:6, numY:0},
      /* 2 — Tratar: CLÍMAX ICÓNICO. Máxima concentración, energía terapéutica de alta
             pureza, veladuras apartadas, numeral monumental y rotundo en menta resplandeciente. */
      {veilA:.52, veilB:.95, veilAOp:.50, veilBOp:.14, blur:.12,
       coreX:.54, coreY:.40, coreScale:1.28, coreGlow:1.0, coreWarm:.26,
       frame:.18, bgDark:.40, numScale:1.38, numOpacity:.48, numX:16, numY:-10},
      /* 3 — Acompañar: liberación de la tensión, la composición respira y se expande;
             la luz deriva a la derecha iluminando el camino con calidez ámbar serena. */
      {veilA:.74, veilB:.98, veilAOp:.28, veilBOp:.08, blur:.26,
       coreX:.68, coreY:.48, coreScale:.96, coreGlow:.62, coreWarm:.62,
       frame:.06, bgDark:.20, numScale:1.05, numOpacity:.32, numX:10, numY:-4},
      /* 4 — Evolucionar: resolución completa, horizonte abierto, amplitud y calma;
             luz cálida envolvente que prepara el handoff luminoso hacia Primera Visita. */
      {veilA:.92, veilB:1, veilAOp:.06, veilBOp:.02, blur:.10,
       coreX:.56, coreY:.50, coreScale:1.18, coreGlow:.72, coreWarm:1.0,
       frame:0, bgDark:0, numScale:.92, numOpacity:.20, numX:4, numY:2}
    ];

    /* Curva calibrada de progresión temporal por fase (0..1 de scroll total):
       - Fase 0 (Escuchar): de 0.00 a 0.18 (entrada ágil sin tiempo muerto).
       - Fase 1 (Valorar): de 0.18 a 0.46 (construcción deliberada de foco).
       - Fase 2 (Tratar): de 0.46 a 0.74 (clímax sostenido, máxima presencia y respiración).
       - Fase 3 (Acompañar): de 0.74 a 1.00 (resolución luminosa).
       - Fase 4 (Evolucionar): al alcanzar 1.00 (plena apertura y preparación para la salida). */
    var PROGRESS_STOPS = [0.0, 0.18, 0.46, 0.74, 1.0];

    var progressToPhase = function(p){
      if(p <= 0) return 0;
      if(p >= 1) return 4;
      for(var i = 0; i < PROGRESS_STOPS.length - 1; i++){
        var pStart = PROGRESS_STOPS[i];
        var pEnd = PROGRESS_STOPS[i + 1];
        if(p >= pStart && p <= pEnd){
          var t = (p - pStart) / (pEnd - pStart);
          return i + t;
        }
      }
      return 4;
    };

    /* Recorrido de scroll por transición de fase, en fracción de la
       altura visible. En móvil se calibra a 0.48 (antes 0.32) para evitar
       que la experiencia se consuma en dos gestos rápidos (§6 auditoría). */
    var getStepFraction = function(){
      var w = window.innerWidth;
      if(w < 640) return .48;
      if(w < 960) return .52;
      return .58;
    };

    var active = false;
    var headerOffset = 0;
    var maxScroll = 0;
    var ticking = false;
    var currentIndex = -1;

    var lerp = function(a, b, t){ return a + (b - a) * t; };

    /* Interpola KEYFRAMES en la posición continua de fase (0..4) y
       escribe el resultado como variables CSS en .umbral__stage.
       Sincroniza el numeral y el bloque de texto directamente con el scroll:
       el texto se disuelve suavemente por desplazamiento continuo sin
       depender de un temporizador CSS de 650ms (§4 auditoría). */
    var render = function(phasePos){
      var clamped = Math.min(Math.max(phasePos, 0), KEYFRAMES.length - 1);
      var i = Math.min(Math.floor(clamped), KEYFRAMES.length - 2);
      var t = clamped - i;
      var a = KEYFRAMES[i], b = KEYFRAMES[i + 1];

      var v = {
        veilA: lerp(a.veilA, b.veilA, t),
        veilB: lerp(a.veilB, b.veilB, t),
        veilAOp: lerp(a.veilAOp, b.veilAOp, t),
        veilBOp: lerp(a.veilBOp, b.veilBOp, t),
        blur: lerp(a.blur, b.blur, t),
        coreX: lerp(a.coreX, b.coreX, t),
        coreY: lerp(a.coreY, b.coreY, t),
        coreScale: lerp(a.coreScale, b.coreScale, t),
        coreGlow: lerp(a.coreGlow, b.coreGlow, t),
        coreWarm: lerp(a.coreWarm, b.coreWarm, t),
        frame: lerp(a.frame, b.frame, t),
        bgDark: lerp(a.bgDark, b.bgDark, t),
        numScale: lerp(a.numScale, b.numScale, t),
        numOpacity: lerp(a.numOpacity, b.numOpacity, t),
        numX: lerp(a.numX, b.numX, t),
        numY: lerp(a.numY, b.numY, t)
      };

      var s = stage.style;
      s.setProperty('--u-veil-a-gap', v.veilA);
      s.setProperty('--u-veil-b-gap', v.veilB);
      s.setProperty('--u-veil-a-opacity', v.veilAOp);
      s.setProperty('--u-veil-b-opacity', v.veilBOp);
      s.setProperty('--u-veil-blur', v.blur);
      s.setProperty('--u-core-x', v.coreX);
      s.setProperty('--u-core-y', v.coreY);
      s.setProperty('--u-core-scale', v.coreScale);
      s.setProperty('--u-core-glow', v.coreGlow);
      s.setProperty('--u-core-warm', v.coreWarm);
      s.setProperty('--u-frame-inset', v.frame);
      s.setProperty('--u-bg-dark', v.bgDark);
      s.setProperty('--u-num-opacity', v.numOpacity);
      numHost.style.setProperty('--u-num-scale', v.numScale);
      numHost.style.setProperty('--u-num-x', v.numX.toFixed(1) + 'px');
      numHost.style.setProperty('--u-num-y', v.numY.toFixed(1) + 'px');

      digits.forEach(function(digit, idx){
        digit.style.opacity = Math.max(0, 1 - Math.abs(clamped - idx));
      });

      /* Sincronización continua de texto: calculamos opacidad, elevación
         y visibilidad en tiempo real según la distancia de scroll. */
      var activeIdx = Math.min(4, Math.round(clamped));
      phases.forEach(function(phase, idx){
        var dist = clamped - idx;
        var absDist = Math.abs(dist);
        var op = 0;
        var yShift = 0;
        if(absDist < 0.75){
          /* Curva cosenoidal suave: op=1 en dist=0, op=0 en absDist >= 0.75 */
          op = Math.max(0, Math.cos((absDist / 0.75) * Math.PI * 0.5));
          yShift = dist * 8;
        }
        var isVis = op > 0.01;
        phase.style.opacity = isVis ? op.toFixed(3) : '0';
        phase.style.transform = isVis ? 'translate3d(0, ' + yShift.toFixed(1) + 'px, 0)' : 'translate3d(0, 14px, 0)';
        phase.style.visibility = isVis ? 'visible' : 'hidden';
        phase.style.pointerEvents = op > 0.5 ? 'auto' : 'none';
        phase.classList.toggle('is-active', idx === activeIdx);
      });

      if(activeIdx !== currentIndex){
        currentIndex = activeIdx;
        progressItems.forEach(function(item, i2){
          item.classList.toggle('is-active', i2 === activeIdx);
          item.classList.toggle('is-done', i2 < activeIdx);
        });
        progressSegs.forEach(function(seg, i2){
          seg.classList.toggle('is-done', i2 < activeIdx);
        });
      }
    };

    var resetInline = function(){
      pinWrap.style.height = '';
      stage.style.height = '';
      section.classList.remove('is-pin-active');
      currentIndex = -1;
      phases.forEach(function(phase){
        phase.classList.remove('is-active');
        phase.style.opacity = '';
        phase.style.transform = '';
        phase.style.visibility = '';
        phase.style.pointerEvents = '';
      });
      numHost.style.removeProperty('--u-num-scale');
      numHost.style.removeProperty('--u-num-x');
      numHost.style.removeProperty('--u-num-y');
      progressItems.forEach(function(item){ item.classList.remove('is-active','is-done'); });
      progressSegs.forEach(function(seg){ seg.classList.remove('is-done'); });
    };

    var deactivate = function(){
      if(!active) return;
      active = false;
      resetInline();
    };

    /* aplica el progreso actual del escenario fijado: se llama tanto en
       cada frame de scroll como justo después de (re)activar, para no
       dejar un frame con la fase desalineada respecto al scroll real */
    var applyProgress = function(){
      ticking = false;
      if(!active) return;

      var rect = pinWrap.getBoundingClientRect();
      var scrolled = headerOffset - rect.top;
      scrolled = Math.min(Math.max(scrolled, 0), maxScroll);
      var progress = maxScroll > 0 ? scrolled / maxScroll : 0;
      render(progressToPhase(progress));
    };

    var onScroll = function(){
      if(!active || ticking) return;
      ticking = true;
      window.requestAnimationFrame(applyProgress);
    };

    var isReducedMotion = function(){
      return (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || prefersReducedMotion;
    };

    /* Decide si el modo fijado tiene sentido (motion, alto de ventana) y,
       si lo tiene, calcula la altura extra real a partir del viewport
       actual — nunca de valores fijos dependientes de una resolución
       concreta. Deliberadamente sin condición de ancho mínimo: el
       encargo pide que móvil y tablet conserven la escena fijada, solo
       reducida (ver getStepFraction y las variables --u-* en CSS §11). */
    var measure = function(){
      var canPin = !isReducedMotion() && window.innerHeight >= 480;

      if(!canPin){
        deactivate();
        return;
      }

      headerOffset = header.offsetHeight || 0;
      /* En móvil/tablet el book-bar fijo inferior (§5 CSS, oculto desde
         960px) tapa lo que quede en el borde inferior del viewport; se
         resta su alto real (0 cuando está oculto) para que el contenido
         de la escena, alineado abajo, no quede parcialmente oculto. */
      var bookBarHeight = (bookBar && bookBar.offsetHeight) || 0;
      var innerHeight = Math.max(window.innerHeight - headerOffset - bookBarHeight, 1);
      var stepDistance = innerHeight * getStepFraction();
      maxScroll = stepDistance * (phases.length - 1);

      document.documentElement.style.setProperty('--umbral-pin-top', headerOffset + 'px');
      stage.style.height = innerHeight + 'px';
      pinWrap.style.height = (innerHeight + maxScroll) + 'px';
      section.classList.add('is-pin-active');
      active = true;

      applyProgress();
    };

    var resizeTimer = null;
    var scheduleMeasure = function(){
      if(resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 150);
    };

    measure();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('orientationchange', scheduleMeasure);
    window.addEventListener('load', scheduleMeasure);

    if(window.matchMedia){
      var rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if(rmQuery.addEventListener){
        rmQuery.addEventListener('change', function(){
          prefersReducedMotion = rmQuery.matches;
          scheduleMeasure();
        });
      }
    }

    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(scheduleMeasure)['catch'](function(){});
    }

    if('ResizeObserver' in window){
      var ro = new ResizeObserver(scheduleMeasure);
      ro.observe(phasesHost);
      ro.observe(stage);
    }

    if(window.matchMedia){
      var mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      if(mqReduced.addEventListener) mqReduced.addEventListener('change', scheduleMeasure);
      else if(mqReduced.addListener) mqReduced.addListener(scheduleMeasure);
    }
  }catch(e){ console.warn('umbralSequence', e); }
})();

/* ---------- Primera visita: timeline ligada al scroll (Home) ----------
   Deliberadamente mucho más ligero que umbralSequence(): no hay pinning,
   no hay listener de scroll ni cálculo continuo de posición. Solo un
   IntersectionObserver (igual que revealOnScroll(), misma familia de
   herramientas ya usada en el proyecto) con una banda fina cerca del
   centro del viewport: cuando el borde de un paso la cruza —entrando o
   saliendo, en cualquier dirección de scroll— ese paso pasa a ser el
   activo. No hace falta distinguir "entrar" de "salir": basta con
   reaccionar a isIntersecting=true, que dispara igual subiendo o bajando.

   El desplazamiento sticky del bloque izquierdo (.first-visit__intro) es
   CSS puro (position:sticky); aquí solo se mide una vez —y en resize— la
   altura real del header para no tapar el título, con el mismo patrón que
   --services-pin-top/--umbral-pin-top.

   Mejora progresiva: si no hay IntersectionObserver o hay
   prefers-reduced-motion, la función no añade .is-timeline-active y los
   cinco pasos se quedan en su estado base (todos visibles, línea en tono
   neutro) definido en CSS sin depender de JS. */
(function firstVisitTimeline(){
  try{
    var section = document.querySelector('.first-visit');
    var stepsHost = section && section.querySelector('[data-fv-steps]');
    var steps = stepsHost ? Array.prototype.slice.call(stepsHost.querySelectorAll('[data-fv-step]')) : [];
    var header = document.getElementById('site-header');
    if(!section || !stepsHost || !steps.length) return;
    if(!('IntersectionObserver' in window) || prefersReducedMotion) return;

    var activeIndex = 0;

    function applyState(){
      steps.forEach(function(step, i){
        step.classList.toggle('is-active', i === activeIndex);
        step.classList.toggle('is-done', i < activeIndex);
      });
    }

    function setStickyOffset(){
      var h = (header && header.offsetHeight) || 0;
      document.documentElement.style.setProperty('--fv-sticky-top', (h + 24) + 'px');
    }

    section.classList.add('is-timeline-active');
    applyState();
    setStickyOffset();

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        var idx = steps.indexOf(entry.target);
        if(idx === -1 || idx === activeIndex) return;
        activeIndex = idx;
        applyState();
      });
    }, {root:null, rootMargin:'-42% 0px -50% 0px', threshold:0});
    steps.forEach(function(step){ io.observe(step); });

    var resizeTimer;
    window.addEventListener('resize', function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setStickyOffset, 150);
    }, {passive:true});
    window.addEventListener('orientationchange', setStickyOffset);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(setStickyOffset)['catch'](function(){});
  }catch(e){ console.warn('firstVisitTimeline', e); }
})();

/* ---------- Service pages: "service-process" (Cómo es el proceso) ----------
   FASE 2 de la SERVICE PAGE MASTER: versión genérica de firstVisitTimeline
   para las páginas de servicio (physiotherapy.html y futuras). Misma
   filosofía (IntersectionObserver + sticky por CSS, sin ticking/rAF, sin
   competir con Marshall Method), pero sin asumir ni la cantidad de pasos
   ni que solo hay una sección en la página: recorre todas las
   [data-sp-steps] que encuentre y cuenta sus [data-sp-step] hijos, así que
   un futuro service page con 3, 4 o 6 pasos funciona sin tocar este JS.

   Mejora progresiva: si no hay IntersectionObserver o hay
   prefers-reduced-motion, no se añade .is-process-active y los pasos se
   quedan en su estado base (todos visibles) definido en CSS.

   FASE 9: dos añadidos, sin duplicar el observer:
   (a) generaliza el selector de secciones más allá de ".service-process"
   a cualquier ".specialty-list" con su propio [data-sp-steps] (Ámbitos,
   en physiotherapy.html), reutilizando exactamente el mismo bucle;
   (b) al cambiar de paso activo, además de is-active/is-done, fija
   --sp-progress (activeIndex+1 / nº de pasos, usada por la línea de
   progreso de .service-process__visual) y dispara el crossfade de la
   fotografía asociada (swapCrossfadeImage), si la sección tiene
   [data-crossfade-group] y data-crossfade-src por paso. */
(function serviceProcessTimeline(){
  try{
    var sections = Array.prototype.slice.call(document.querySelectorAll('.service-process, .specialty-list'));
    if(!sections.length) return;
    if(!('IntersectionObserver' in window) || prefersReducedMotion) return;

    var header = document.getElementById('site-header');

    function setStickyOffset(){
      var h = (header && header.offsetHeight) || 0;
      document.documentElement.style.setProperty('--sp-sticky-top', (h + 24) + 'px');
    }
    setStickyOffset();

    /* Fundido cruzado genérico: oculta la imagen actual, sustituye su src
       a mitad del fundido (mismo tiempo que --dur-fast en CSS) y la
       vuelve a mostrar. Sin trabajo si el src ya es el correcto. */
    function swapCrossfadeImage(img, src){
      if(!img || !src || img.getAttribute('src') === src) return;
      img.classList.add('is-fading');
      window.setTimeout(function(){
        img.setAttribute('src', src);
        img.classList.remove('is-fading');
      }, 250);
    }

    sections.forEach(function(section){
      var stepsHost = section.querySelector('[data-sp-steps]');
      var steps = stepsHost ? Array.prototype.slice.call(stepsHost.querySelectorAll('[data-sp-step]')) : [];
      if(!stepsHost || !steps.length) return;

      var crossfadeImg = null;
      if(stepsHost.hasAttribute('data-crossfade-group')){
        var visual = section.querySelector('[data-crossfade]');
        crossfadeImg = visual ? visual.querySelector('[data-crossfade-img]') : null;
      }

      var activeIndex = 0;

      function applyState(){
        steps.forEach(function(step, i){
          step.classList.toggle('is-active', i === activeIndex);
          step.classList.toggle('is-done', i < activeIndex);
        });
        section.style.setProperty('--sp-progress', (activeIndex + 1) / steps.length);
        if(crossfadeImg) swapCrossfadeImage(crossfadeImg, steps[activeIndex].getAttribute('data-crossfade-src'));
      }

      section.classList.add('is-process-active');
      applyState();

      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(!entry.isIntersecting) return;
          var idx = steps.indexOf(entry.target);
          if(idx === -1 || idx === activeIndex) return;
          activeIndex = idx;
          applyState();
        });
      }, {root:null, rootMargin:'-42% 0px -50% 0px', threshold:0});
      steps.forEach(function(step){ io.observe(step); });
    });

    var resizeTimer;
    window.addEventListener('resize', function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setStickyOffset, 150);
    }, {passive:true});
    window.addEventListener('orientationchange', setStickyOffset);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(setStickyOffset)['catch'](function(){});
  }catch(e){ console.warn('serviceProcessTimeline', e); }
})();

/* ---------- reseñas: fragmento recortado con lectura completa ----------
   El texto íntegro siempre está en el HTML. Solo se recorta cuando de
   verdad sobra texto, y el botón únicamente aparece en ese caso.        */
(function quoteToggles(){
  try{
    var toggles = document.querySelectorAll('[data-quote-toggle]');
    if(!toggles.length) return;

    var setup = function(btn){
      var quote = document.getElementById(btn.getAttribute('aria-controls'));
      if(!quote) return;

      /* con el recorte puesto, el texto sobra si el contenido desborda la caja */
      quote.setAttribute('data-clamped','');
      var overflows = quote.scrollHeight > quote.clientHeight + 1;

      if(!overflows){
        quote.removeAttribute('data-clamped');
        btn.hidden = true;
        return;
      }
      btn.hidden = false;
      btn.setAttribute('aria-expanded','false');
      btn.textContent = 'Leer completo';
    };

    /* la tipografía cambia el número de líneas: se mide cuando está lista */
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(function(){
        toggles.forEach(function(btn){
          if(btn.getAttribute('aria-expanded') !== 'true') setup(btn);
        });
      });
    }

    toggles.forEach(function(btn){
      setup(btn);
      btn.addEventListener('click', function(){
        var quote = document.getElementById(btn.getAttribute('aria-controls'));
        if(!quote) return;
        var open = btn.getAttribute('aria-expanded') === 'true';
        if(open){
          quote.setAttribute('data-clamped','');
          btn.setAttribute('aria-expanded','false');
          btn.textContent = 'Leer completo';
        } else {
          quote.removeAttribute('data-clamped');
          btn.setAttribute('aria-expanded','true');
          btn.textContent = 'Mostrar menos';
        }
      });
    });

    /* al cambiar el ancho, un fragmento puede dejar de necesitar recorte */
    var t;
    window.addEventListener('resize', function(){
      clearTimeout(t);
      t = setTimeout(function(){
        toggles.forEach(function(btn){
          if(btn.getAttribute('aria-expanded') === 'true') return;
          setup(btn);
        });
      }, 200);
    });
  }catch(e){ console.warn('quoteToggles', e); }
})();

/* ---------- 15. Testimonios editoriales por scroll vertical (Sistema escalable N) ----------
   Arquitectura desacoplada y paramétrica: lee la fuente semántica única (#testimonials-flow),
   hidrata el escenario sticky interactivo (.testimonials__stage y .testimonials__text-stage)
   y calcula dinámicamente alturas, capas de apilamiento y ventanas de transición según N.
   Con prefers-reduced-motion o sin JS, permanece intacto el flujo normal accesible. */
(function testimonialsScroll(){
  try{
    if(prefersReducedMotion) return;

    var track = document.getElementById('testimonials-track');
    var flow = document.getElementById('testimonials-flow');
    var stage = document.getElementById('testimonials-stage');
    var textStage = document.getElementById('testimonials-text-stage');

    if(!track || !flow || !stage || !textStage) return;

    var items = flow.querySelectorAll('.testimonials__item');
    var N = items.length;
    if(N < 2) return;

    var layers = [];
    var stories = [];

    /* Hidratar dinámicamente las capas fotográficas y las historias de texto */
    stage.innerHTML = '';
    textStage.innerHTML = '';

    for(var i = 0; i < N; i++){
      /* Capa de foto */
      var layer = document.createElement('div');
      layer.className = 'testimonials__photo-layer';
      layer.style.zIndex = i + 1;
      layer.style.transform = i === 0 ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100%, 0)';

      var srcImg = items[i].querySelector('img');
      if(srcImg){
        var cloneImg = srcImg.cloneNode(true);
        if(srcImg.style.objectPosition){
          cloneImg.style.objectPosition = srcImg.style.objectPosition;
        }
        layer.appendChild(cloneImg);
      }
      stage.appendChild(layer);
      layers.push(layer);

      /* Historia de texto */
      var story = document.createElement('article');
      story.className = 'testimonials__story';
      var textWrap = items[i].querySelector('.testimonials__item-text');
      if(textWrap){
        story.innerHTML = textWrap.innerHTML;
      }
      if(i === 0){
        story.style.opacity = '1';
        story.style.transform = 'translate3d(0, 0, 0)';
        story.style.visibility = 'visible';
        story.style.pointerEvents = 'auto';
      } else {
        story.style.opacity = '0';
        story.style.transform = 'translate3d(0, 16px, 0)';
        story.style.visibility = 'hidden';
        story.style.pointerEvents = 'none';
      }
      textStage.appendChild(story);
      stories.push(story);
    }

    /* Activar pista sticky interactiva (puramente visual para usuarios videntes)
       y ocultar la fuente semántica SOLO visualmente mediante clip accesible,
       manteniéndola 100% navegable en el Accessibility Tree para lectores de pantalla. */
    track.hidden = false;
    track.setAttribute('aria-hidden', 'true');
    flow.classList.add('testimonials__flow--visually-hidden');
    flow.removeAttribute('aria-hidden');

    /* Cálculo dinámico de métricas: altura de pista sublineal y altura de text-stage */
    var updateMetrics = function(){
      var isMobile = (window.innerWidth || document.documentElement.clientWidth) <= 860;
      var transInc = isMobile
        ? Math.max(55, 85 - (N - 2) * 10)
        : Math.max(65, 100 - (N - 2) * 10);
      var totalVh = 100 + (N - 1) * transInc;
      track.style.setProperty('--testimonials-track-height', totalVh + 'vh');
      track.style.height = totalVh + 'vh';

      /* Ajuste dinámico de altura mínima del text-stage según la historia más alta */
      var maxStoryH = 0;
      for(var j = 0; j < stories.length; j++){
        var sh = stories[j].offsetHeight || stories[j].scrollHeight || 0;
        if(sh > maxStoryH) maxStoryH = sh;
      }
      if(maxStoryH > 0){
        textStage.style.minHeight = maxStoryH + 'px';
      }
    };
    updateMetrics();

    var ticking = false;

    var updateStory = function(el, opacity, translateY){
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = 'translate3d(0, ' + translateY.toFixed(1) + 'px, 0)';
      if(opacity > 0.04){
        el.style.visibility = 'visible';
        el.style.pointerEvents = 'auto';
      } else {
        el.style.visibility = 'hidden';
        el.style.pointerEvents = 'none';
      }
    };

    /* Progresión paramétrica continua para N testimonios:
       Garantiza la prioridad LECTURA > TRANSICIÓN adaptando la proporción según N
       sin saltos discretos ni condicionales fijos, conservando exactamente el 18%/22%/21% en N=3. */
    var W_final = Math.max(0.16, 0.21 - (N - 3) * 0.025);
    var P_active = 1 - W_final;
    var numCycles = N - 1;
    var cycleLen = P_active / numCycles;
    var stableRatio = Math.min(0.55, 0.455 + (N - 3) * 0.035);
    var stableLen = cycleLen * stableRatio;
    var transLen = cycleLen - stableLen;

    var onScroll = function(){
      ticking = false;
      var rect = track.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;

      if(rect.bottom < -50 || rect.top > vh + 50) return;

      var totalScroll = track.offsetHeight - vh;
      if(totalScroll <= 0) return;

      var scrolled = -rect.top;
      var p = scrolled / totalScroll;
      if(p < 0) p = 0;
      if(p > 1) p = 1;

      /* Zona final de reposo: Último testimonio consolidado y estable */
      if(p >= P_active){
        for(var i = 1; i < N; i++){
          layers[i].style.transform = 'translate3d(0, 0%, 0)';
        }
        for(var i = 0; i < N - 1; i++){
          updateStory(stories[i], 0, -14);
        }
        updateStory(stories[N - 1], 1, 0);
        return;
      }

      /* Ciclo activo k */
      var k = Math.floor(p / cycleLen);
      if(k >= numCycles) k = numCycles - 1;
      var cycleStart = k * cycleLen;
      var transStart = cycleStart + stableLen;

      /* Capas anteriores: completamente arriba (0%) */
      for(var i = 1; i <= k; i++){
        layers[i].style.transform = 'translate3d(0, 0%, 0)';
      }
      /* Capas posteriores: completamente abajo (100%) */
      for(var i = k + 2; i < N; i++){
        layers[i].style.transform = 'translate3d(0, 100%, 0)';
      }

      /* Textos anteriores: ocultos arriba (-14px) */
      for(var i = 0; i < k; i++){
        updateStory(stories[i], 0, -14);
      }
      /* Textos posteriores: ocultos abajo (+16px) */
      for(var i = k + 2; i < N; i++){
        updateStory(stories[i], 0, 16);
      }

      /* Dentro del ciclo k: estado estable vs transición k -> k+1 */
      if(p < transStart){
        layers[k + 1].style.transform = 'translate3d(0, 100%, 0)';
        updateStory(stories[k], 1, 0);
        if(k + 1 < N) updateStory(stories[k + 1], 0, 16);
      } else {
        var t = (p - transStart) / transLen;
        if(t < 0) t = 0;
        if(t > 1) t = 1;

        var yNext = (1 - t) * 100;
        layers[k + 1].style.transform = 'translate3d(0, ' + yNext.toFixed(2) + '%, 0)';

        if(t <= 0.38){
          var subExit = t / 0.38;
          updateStory(stories[k], 1 - subExit, -subExit * 14);
          updateStory(stories[k + 1], 0, 16);
        } else if(t <= 0.54){
          updateStory(stories[k], 0, -14);
          updateStory(stories[k + 1], 0, 16);
        } else {
          var subEnter = (t - 0.54) / 0.46;
          updateStory(stories[k], 0, -14);
          updateStory(stories[k + 1], subEnter, (1 - subEnter) * 14);
        }
      }
    };

    window.addEventListener('scroll', function(){
      if(!ticking){
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    }, { passive: true });

    window.addEventListener('resize', function(){
      if(!ticking){
        ticking = true;
        window.requestAnimationFrame(function(){
          updateMetrics();
          onScroll();
        });
      }
    }, { passive: true });

    /* Inicialización al cargar */
    onScroll();
  }catch(e){ console.warn('testimonialsScroll', e); }
})();

/* ---------- scroll suave al CTA secundario del hero ---------- */
(function smoothAnchor(){
  try{
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener('click', function(e){
        var id = a.getAttribute('href').slice(1);
        if(!id) return;
        var target = document.getElementById(id);
        if(!target) return;
        e.preventDefault();
        target.scrollIntoView({behavior: prefersReducedMotion ? 'auto' : 'smooth', block:'start'});
      });
    });
  }catch(e){ console.warn('smoothAnchor', e); }
})();

/* ---------- Acordeón de botones reales: FAQ y condiciones a domicilio ----------
   Ambos usan el mismo patrón: <button aria-expanded aria-controls> junto a
   un panel con [hidden]. Sin JavaScript, el botón queda con
   aria-expanded="false" y el panel permanece oculto (contenido igualmente
   presente en el HTML, solo no visible), así que no hay contenido que
   dependa exclusivamente de este script. No toca los acordeones de bonos y
   condiciones de "En la clínica" (Fase 5), que siguen siendo
   <details>/<summary> nativos. */
(function realButtonAccordions(){
  try{
    var buttons = document.querySelectorAll('.faq__q, #desplazamiento .cond__q');
    if(!buttons.length) return;

    buttons.forEach(function(btn){
      btn.addEventListener('click', function(){
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        if(panel) panel.hidden = expanded;
      });
    });
  }catch(e){ console.warn('realButtonAccordions', e); }
})();

/* ---------- Carrusel de áreas (Servicios) ----------
   .area-carousel__card ya trae su composición (tamaño, desplazamiento,
   opacidad, orden) resuelta por CSS a partir de data-position (ver
   styles.css, sección 20). El DOM mantiene siempre el mismo orden fijo
   (physio, wellness, strength, stretching, pilates, domicilio); lo único que cambia es
   qué posición (-2..2) le corresponde a cada tarjeta según cuál esté
   activa, así que avanzar/retroceder/saltar es solo reescribir el
   data-position de las 5 tarjetas — el CSS anima el resto por su cuenta. */
(function areaCarousel(){
  try{
    var root = document.querySelector('.area-carousel');
    if(!root) return;
    var viewport = root.querySelector('.area-carousel__viewport');
    var track = root.querySelector('.area-carousel__track');
    if(!viewport || !track) return;
    var cards = Array.prototype.slice.call(track.children);
    var total = cards.length;
    if(total < 2) return;
    var half = Math.floor(total / 2);

    var activeIndex = cards.findIndex(function(card){
      return card.getAttribute('data-position') === '0';
    });
    if(activeIndex === -1) activeIndex = 0;

    function applyPositions(){
      cards.forEach(function(card, domIndex){
        var pos = ((domIndex - activeIndex + half) % total + total) % total - half;
        card.setAttribute('data-position', String(pos));
      });
    }

    function goTo(domIndex){
      var target = ((domIndex % total) + total) % total;
      if(target === activeIndex) return;
      activeIndex = target;
      applyPositions();
    }
    function next(){ goTo(activeIndex + 1); }
    function prev(){ goTo(activeIndex - 1); }

    /* -- Autoplay: cada 2.5-3s, solo mientras la sección esté visible y no
       esté en pausa por interacción del usuario. -- */
    var AUTOPLAY_MS = 2800;
    var RESUME_DELAY_MS = 900;
    var timer = null;
    var resumeTimer = null;
    var isVisible = false;
    var isPaused = false;

    function startAutoplay(){
      if(timer || !isVisible || isPaused || prefersReducedMotion) return;
      timer = setInterval(next, AUTOPLAY_MS);
    }
    function stopAutoplay(){
      if(timer){ clearInterval(timer); timer = null; }
    }
    function pause(){
      isPaused = true;
      clearTimeout(resumeTimer);
      stopAutoplay();
    }
    function resume(){
      isPaused = false;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(startAutoplay, RESUME_DELAY_MS);
    }

    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          isVisible = entry.isIntersecting;
          if(isVisible) startAutoplay(); else stopAutoplay();
        });
      }, { threshold: .4 });
      io.observe(root);
    } else {
      isVisible = true;
      startAutoplay();
    }

    /* -- Pausa por hover, foco y pestaña inactiva; reanudación controlada. -- */
    root.addEventListener('pointerenter', pause);
    root.addEventListener('pointerleave', function(){
      if(!isDragging) resume();
    });
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', function(){
      setTimeout(function(){
        if(!isDragging && !root.contains(document.activeElement)) resume();
      }, 50);
    });
    document.addEventListener('visibilitychange', function(){
      if(document.hidden) pause(); else resume();
    });

    /* -- Selección por clic: una tarjeta lateral centra en vez de navegar;
       la tarjeta activa conserva su enlace normal. -- */
    var wasDragged = false;
    cards.forEach(function(card){
      var link = card.querySelector('.area-carousel__card-link');
      if(!link) return;
      link.addEventListener('click', function(e){
        if(wasDragged){
          wasDragged = false;
          e.preventDefault();
          return;
        }
        if(card.getAttribute('data-position') !== '0'){
          e.preventDefault();
          goTo(cards.indexOf(card));
          pause();
          resume();
        }
      });
    });

    /* -- Flechas de teclado, con el foco dentro del carrusel. -- */
    root.addEventListener('keydown', function(e){
      if(e.key === 'ArrowRight'){
        e.preventDefault();
        next();
        pause();
        resume();
      } else if(e.key === 'ArrowLeft'){
        e.preventDefault();
        prev();
        pause();
        resume();
      }
    });

    /* -- Arrastre con ratón y deslizamiento táctil (Pointer Events, mismo
       mecanismo que "disclosures" usa para unificar ratón/táctil). El
       viewport usa touch-action:pan-y (CSS) para no secuestrar el scroll
       vertical: el gesto horizontal se resuelve aquí, el vertical lo
       gestiona el navegador de forma nativa. -- */
    var isDragging = false;
    var dragStartX = 0;
    var dragDx = 0;
    var dragIsHorizontal = null;
    var DRAG_THRESHOLD = 40;
    var CLICK_CANCEL_THRESHOLD = 8;

    viewport.addEventListener('pointerdown', function(e){
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      isDragging = true;
      dragIsHorizontal = null;
      dragDx = 0;
      dragStartX = e.clientX;
      root.classList.add('is-dragging');
      pause();
      try{ viewport.setPointerCapture(e.pointerId); }catch(err){}
    });

    viewport.addEventListener('pointermove', function(e){
      if(!isDragging) return;
      dragDx = e.clientX - dragStartX;
      if(dragIsHorizontal === null && Math.abs(dragDx) > 6){
        dragIsHorizontal = true;
      }
      if(dragIsHorizontal){
        track.style.transform = 'translateX(' + dragDx + 'px)';
      }
    });

    function endDrag(){
      if(!isDragging) return;
      isDragging = false;
      root.classList.remove('is-dragging');
      var dx = dragDx;
      track.style.transform = '';
      wasDragged = dragIsHorizontal === true && Math.abs(dx) > CLICK_CANCEL_THRESHOLD;
      if(dragIsHorizontal && Math.abs(dx) > DRAG_THRESHOLD){
        if(dx < 0) next(); else prev();
      }
      dragIsHorizontal = null;
      resume();
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    applyPositions();
  }catch(e){ console.warn('areaCarousel', e); }
})();

/* ---------- Cinta de reseñas de Google (Fisioterapia): movimiento continuo ----------
   Bucle infinito por transform, sin <marquee> ni librerías nuevas. La única
   lista semántica es [data-reviews-track] (las 6 reseñas reales); el
   duplicado que cierra el bucle se genera aquí clonando ese nodo y
   marcándolo aria-hidden + inert, así los lectores de pantalla no lo
   anuncian ni el teclado lo alcanza (las tarjetas no tienen elementos
   focuseables dentro, así que no hace falta tocar tabindex tarjeta a
   tarjeta). Con prefers-reduced-motion, o si algo falla, no se crea
   ningún duplicado ni arranca ningún bucle: [data-reviews-viewport] se
   queda con su overflow-x:auto de base (CSS) y las 6 reseñas reales
   siguen visibles y explorables a mano, igual que en la fase estática. */
(function googleReviewsMarquee(){
  try{
    var section = document.querySelector('.google-reviews');
    if(!section || prefersReducedMotion) return;
    var viewport = section.querySelector('[data-reviews-viewport]');
    var rail = section.querySelector('[data-reviews-rail]');
    var track = section.querySelector('[data-reviews-track]');
    if(!viewport || !rail || !track) return;

    /* -- Móvil (<768px, igual que el breakpoint de tablet en CSS): sin
       bucle automático. Con una sola tarjeta casi completa por pantalla
       leer mientras la cinta se mueve sola es incómodo, así que ahí se
       queda en el mismo estado que sin JS / reduced-motion: scroll
       horizontal nativo, sin clon, sin transform, botón de pausa oculto
       (nada que pausar). marqueeEnabled decide en qué modo está la
       sección; se reevalúa en cada resize/orientationchange, no solo al
       cargar, para que rotar el dispositivo o cambiar de ventana cruce
       el umbral sin tener que recargar la página. -- */
    var MOBILE_MAX = 767;
    var mobileMq = window.matchMedia ? window.matchMedia('(max-width:' + MOBILE_MAX + 'px)') : null;
    var marqueeEnabled = false;
    var clone = null;

    var SPEED = 32; /* px/s: lento y constante, no un carrusel de diapositivas */
    var offset = 0;
    var setWidth = 0;

    /* -- No se mide con "clone.left - track.left": esa distancia es la de
       la CAJA flex de track (su flex-basis, ligado al ancho del rail), no
       la del CONTENIDO real de sus tarjetas. Desde que .google-review-card
       usa flex-basis en % pensados para que sobresalgan más tarjetas de
       las que caben en esa caja ("tres completas + un fragmento"), el
       contenido de track se desborda mucho más allá de su propia caja, así
       que esa resta se queda corta y el clon empieza a solaparse con
       tarjetas reales que aún no han terminado de desfilar. Se mide en su
       lugar el tramo real: del borde izquierdo de la primera tarjeta al
       borde derecho de la última, más un gap para mantener la misma
       separación en la costura entre track y su clon. -- */
    function measure(){
      if(!clone) return;
      var cards = track.querySelectorAll('.google-review-card');
      if(!cards.length) return;
      var first = cards[0].getBoundingClientRect();
      var last = cards[cards.length - 1].getBoundingClientRect();
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var w = (last.right - first.left) + gap;
      if(w > 0) setWidth = w;
    }

    function wrap(){
      if(setWidth <= 0) return;
      offset = ((offset % setWidth) + setWidth) % setWidth;
    }
    function render(){
      rail.style.transform = marqueeEnabled ? 'translateX(-' + offset + 'px)' : 'none';
    }

    /* -- Motivos de pausa: hover, foco, arrastre, pestaña oculta, fuera de
       vista. Cualquiera activo detiene el bucle; solo cuando ninguno lo
       está, sigue avanzando. Nunca "encaja" en una posición fija: al
       reanudar continúa desde el offset donde se quedó. -- */
    var pausedByHover = false;
    var pausedByFocus = false;
    var pausedByDrag = false;
    var pausedByVisibility = document.hidden;
    var pausedByIntersection = true; /* hasta que el observer confirme visibilidad */

    function shouldRun(){
      return marqueeEnabled && !(pausedByHover || pausedByFocus || pausedByDrag ||
        pausedByVisibility || pausedByIntersection);
    }

    var rafId = null;
    var lastTime = null;
    function frame(now){
      if(lastTime == null) lastTime = now;
      var dt = (now - lastTime) / 1000;
      lastTime = now;
      offset += SPEED * dt;
      wrap();
      render();
      rafId = requestAnimationFrame(frame);
    }
    function start(){
      if(rafId || !shouldRun()) return;
      lastTime = null;
      rafId = requestAnimationFrame(frame);
    }
    function stop(){
      if(rafId){ cancelAnimationFrame(rafId); rafId = null; }
    }
    function sync(){
      if(shouldRun()) start(); else stop();
    }

    /* -- Crea/retira el clon inert+aria-hidden que hace el bucle sin
       costuras. Solo existe mientras marqueeEnabled es true: en móvil no
       tiene sentido duplicar 6 reseñas en el DOM si nunca se anima. -- */
    function createClone(){
      if(clone) return;
      clone = track.cloneNode(true);
      clone.removeAttribute('data-reviews-track');
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('inert', '');
      rail.appendChild(clone);
      measure();
    }
    function removeClone(){
      if(!clone) return;
      rail.removeChild(clone);
      clone = null;
      setWidth = 0;
    }

    function enableMarquee(){
      if(marqueeEnabled) return;
      marqueeEnabled = true;
      createClone();
      offset = 0;
      section.classList.add('has-marquee');
      render();
      sync();
    }
    function disableMarquee(){
      if(!marqueeEnabled) return;
      marqueeEnabled = false;
      stop();
      section.classList.remove('has-marquee');
      removeClone();
      offset = 0;
      render();
    }
    function applyResponsiveMode(){
      var isMobile = !!(mobileMq && mobileMq.matches);
      if(isMobile) disableMarquee(); else enableMarquee();
    }

    /* -- Pasar el cursor por la cinta. -- */
    viewport.addEventListener('pointerenter', function(){ pausedByHover = true; sync(); });
    viewport.addEventListener('pointerleave', function(){ pausedByHover = false; sync(); });

    /* -- Foco en la sección o en el botón de pausa (teclado). -- */
    section.addEventListener('focusin', function(){ pausedByFocus = true; sync(); });
    section.addEventListener('focusout', function(){
      setTimeout(function(){
        if(!section.contains(document.activeElement)){ pausedByFocus = false; sync(); }
      }, 50);
    });

    /* -- Pestaña no visible: pausa por completo, no solo "se nota poco". -- */
    document.addEventListener('visibilitychange', function(){
      pausedByVisibility = document.hidden;
      sync();
    });

    /* -- Fuera de vista: no consume ciclos si la sección no está en
       pantalla (cancela el rAF, no solo lo salta en vacío). -- */
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          pausedByIntersection = !entry.isIntersecting;
          sync();
        });
      }, { threshold: .1 });
      io.observe(section);
    } else {
      pausedByIntersection = false;
    }

    /* -- Arrastre manual (ratón o táctil, Pointer Events, igual que el
       carrusel de áreas): pausa el avance automático y deja explorar la
       cinta a mano. El offset es el mismo que usa el bucle automático, así
       que al soltar continúa sin saltos desde donde quedó, sin encajar en
       ninguna tarjeta fija. En móvil (marqueeEnabled=false) no se activa:
       ahí el gesto horizontal lo resuelve el scroll nativo del viewport
       (overflow-x:auto), que no bloquea el scroll vertical de la página. -- */
    var isDragging = false;
    var dragStartX = 0;
    var dragStartOffset = 0;

    viewport.addEventListener('pointerdown', function(e){
      if(!marqueeEnabled) return;
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      isDragging = true;
      pausedByDrag = true;
      dragStartX = e.clientX;
      dragStartOffset = offset;
      viewport.classList.add('is-dragging');
      sync();
      try{ viewport.setPointerCapture(e.pointerId); }catch(err){}
    });
    viewport.addEventListener('pointermove', function(e){
      if(!isDragging) return;
      offset = dragStartOffset - (e.clientX - dragStartX);
      wrap();
      render();
    });
    function endDrag(){
      if(!isDragging) return;
      isDragging = false;
      viewport.classList.remove('is-dragging');
      pausedByDrag = false;
      sync();
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    /* -- Recalcula el ancho de una vuelta si cambia el layout (resize,
       cambio de breakpoint del ancho en % de las tarjetas) y, sobre todo,
       revisa si el ancho cruzó el umbral móvil/tablet para activar o
       desactivar el bucle en caliente (sin recargar). orientationchange
       se escucha aparte porque en algunos navegadores dispara antes de
       que matchMedia/innerWidth reflejen el nuevo tamaño; el timeout
       compartido con resize le da margen a que el layout se asiente. -- */
    var resizeTimer = null;
    function scheduleResponsiveCheck(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){
        applyResponsiveMode();
        measure();
        wrap();
        render();
      }, 150);
    }
    window.addEventListener('resize', scheduleResponsiveCheck);
    window.addEventListener('orientationchange', scheduleResponsiveCheck);

    applyResponsiveMode();
  }catch(e){ console.warn('googleReviewsMarquee', e); }
})();

/* ---------- Método Marshall — Experiencia narrativa y cinética (Fase 2) ----------
   Página dedicada (src/pages/metodo.html / .page-metodo).
   Sincroniza:
   1. Frame cinematográfico expansivo del Hero mediante scroll scrub pasivo
   2. Espina bio-cinética lateral (barra de progreso vertical y pulso activo)
   La sincronización de las 5 fases clínicas con la navegación sticky y su
   smooth scroll viven ahora en metodoFasesSystem() (Fase 3, más abajo).
   Respeta prefersReducedMotion y opera 100% con scroll nativo pasivo sin trabas. */
(function metodoMarshallExperience(){
  try{
    var page = document.querySelector('.page-metodo');
    if(!page) return;

    var cinemaWrap = document.getElementById('hero-cinema-wrap');
    var threadBar = document.getElementById('method-thread-bar');
    var threadPulse = document.getElementById('method-thread-pulse');

    /* El hilo lateral es un recurso narrativo del recorrido Hero → Método →
       las 5 fases (Fase 1 de refinamiento): representa "entrada al método →
       Escuchar → Valorar → Tratar → Acompañar → Evolucionar → final", no el
       scroll de la página entera. Por eso su progreso y su visibilidad se
       miden contra el final real de .method-system (cierre de "05
       Evolucionar"), nunca contra document.documentElement.scrollHeight:
       pasado ese punto (Primera visita, testimonio, CTA, footer) el hilo
       deja de tener sentido conceptual y se oculta, no se queda al 100%. */
    var threadEndSection = document.querySelector('.method-system');

    /* Scroll Scrub Pasivo: Hero Cinematográfico y Espina Lateral */
    var ticking = false;
    var lastScrollY = -1;

    function onScroll(){
      if(ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
    }

    function render(){
      ticking = false;
      var y = window.scrollY || window.pageYOffset || 0;
      if(y === lastScrollY) return;
      lastScrollY = y;

      var threadEndY = threadEndSection
        ? threadEndSection.getBoundingClientRect().bottom + y
        : (document.documentElement.scrollHeight - window.innerHeight);
      var progress = threadEndY > 0 ? Math.min(Math.max(y / threadEndY, 0), 1) : 0;
      var pastThread = y > threadEndY;

      page.classList.toggle('has-scrolled', y > 50 && !pastThread);

      /* Barra de progreso de la espina bio-cinética lateral */
      if(threadBar){
        threadBar.style.height = (progress * 100).toFixed(1) + '%';
      }
      if(threadPulse){
        threadPulse.style.top = (progress * 100).toFixed(1) + '%';
      }

      /* Hero Cinematic Frame: expansión armónica de 88% a 98% en los primeros 450px de scroll */
      if(!prefersReducedMotion && cinemaWrap){
        var scrub = Math.min(Math.max(y / 450, 0), 1);
        var heroWidth = 88 + (scrub * 10);
        var heroRadius = 24 - (scrub * 18);
        var heroScale = 1.0 + (scrub * 0.05);

        cinemaWrap.style.setProperty('--hero-width', heroWidth.toFixed(2) + '%');
        cinemaWrap.style.setProperty('--hero-radius', heroRadius.toFixed(1) + 'px');
        cinemaWrap.style.setProperty('--hero-scale', heroScale.toFixed(3));
      }
    }

    window.addEventListener('scroll', onScroll, {passive: true});
    render();

  }catch(e){ console.warn('metodoMarshallExperience', e); }
})();

/* ---------- Método Marshall — Las 5 fases como escena continua (Fase 3) ----------
   Página dedicada (src/pages/metodo.html). En escritorio amplio y sin
   motion reducido, fija .method-system__stage (sticky) y funde las 5
   <article class="method-scene"> entre sí según una posición continua de
   scroll (0..4) — mismo patrón de pin + rAF que umbralSequence() (más
   arriba): nunca preventDefault() sobre el scroll, nunca temporizador,
   solo interpolación lineal de la posición de scroll dentro de
   .method-system__pin-wrap. Sincroniza en el mismo frame: el panel activo
   (opacidad + microdesplazamiento, texto y foto real juntos, a diferencia
   de El umbral que solo funde texto contra una escena abstracta), el
   numeral editorial compartido (01-05, se disuelve dígito a dígito como
   .umbral__num), el fondo del escenario (interpola entre los tonos
   claro/niebla reales de cada fase) y el riel sticky de navegación (clase
   activa + línea de progreso continua).
   Sin JS, con motion reducido, o por debajo de 960px de ancho / 560px de
   alto (el layout de 2 columnas de .method-scene__container ya requiere
   960px), measure() nunca activa el pin: las 5 fases quedan en su flujo
   normal de documento —el fallback real, no una versión "cortada"— y la
   navegación sticky se sincroniza con el mismo IntersectionObserver
   discreto que usaba la Fase 2. */
(function metodoFasesSystem(){
  try{
    var system = document.querySelector('.method-system');
    var pinWrap = system && system.querySelector('[data-fases-pin]');
    var stage = pinWrap && pinWrap.querySelector('[data-fases-stage]');
    var panelsHost = stage && stage.querySelector('[data-fases-panels]');
    var numHost = stage && stage.querySelector('[data-fases-num]');
    var header = document.getElementById('site-header');
    var stickyNav = document.getElementById('method-system-nav');
    var navProgress = document.querySelector('[data-fases-nav-progress]');
    if(!system || !pinWrap || !stage || !panelsHost || !numHost || !header || !stickyNav) return;

    var scenes = Array.prototype.slice.call(panelsHost.querySelectorAll('.method-scene'));
    var digits = numHost.querySelectorAll('.method-system__stage-num-digit');
    var navItems = Array.prototype.slice.call(document.querySelectorAll('.method-system__nav-item'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.method-system__nav-link'));
    if(scenes.length !== 5 || digits.length !== 5) return;

    /* Tono de fondo real de cada fase — misma alternancia que
       .method-scene--0N en CSS: JS solo interpola estos tres canales RGB
       entre fases consecutivas, nunca decide un color nuevo. */
    var BG = [
      [255,255,255], /* 01 Escuchar — blanco */
      [243,246,245], /* 02 Valorar — niebla */
      [255,255,255], /* 03 Tratar — blanco */
      [243,246,245], /* 04 Acompañar — niebla */
      [255,255,255]  /* 05 Evolucionar — blanco */
    ];

    var lerp = function(a,b,t){ return a + (b - a) * t; };

    var active = false;
    var headerOffset = 0;
    var maxScroll = 0;
    var ticking = false;
    var currentIndex = -1;

    /* Recorrido de scroll por transición de fase, en fracción de la altura
       visible del escenario. Deliberadamente más corto que umbralSequence:
       un panel con texto + foto real ya comunica progresión por sí mismo y
       no necesita tanto "aire" como la escena abstracta de luz de El
       umbral. */
    var getStepFraction = function(){ return .62; };

    var isReducedMotion = function(){
      return (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || prefersReducedMotion;
    };

    /* Fuente única de verdad del ítem activo del riel sticky, tanto en modo
       fijado (posición continua redondeada) como en el fallback por
       IntersectionObserver (índice discreto). */
    var setActiveNav = function(idx){
      if(idx === currentIndex) return;
      currentIndex = idx;
      navItems.forEach(function(item, i){
        var isActive = i === idx;
        item.classList.toggle('is-active', isActive);
        var link = item.querySelector('.method-system__nav-link');
        if(link){
          if(isActive) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }
      });
    };

    /* Interpola la posición continua de fase (0..4): funde opacidad y
       microdesplazamiento de cada panel completo (texto + foto real) con
       la misma curva cosenoidal que .umbral__phase, funde dígito a dígito
       el numeral compartido, interpola el fondo del escenario y sincroniza
       el riel sticky + su línea de progreso. */
    var render = function(phasePos){
      var clamped = Math.min(Math.max(phasePos, 0), scenes.length - 1);

      scenes.forEach(function(scene, idx){
        var dist = clamped - idx;
        var absDist = Math.abs(dist);
        var op = 0;
        var yShift = 0;
        if(absDist < 0.85){
          op = Math.max(0, Math.cos((absDist / 0.85) * Math.PI * 0.5));
          yShift = dist * 22;
        }
        var isVis = op > 0.01;
        scene.style.opacity = isVis ? op.toFixed(3) : '0';
        scene.style.transform = isVis ? 'translate3d(0, ' + yShift.toFixed(1) + 'px, 0)' : 'translate3d(0, 26px, 0)';
        scene.style.visibility = isVis ? 'visible' : 'hidden';
        scene.style.pointerEvents = op > 0.55 ? 'auto' : 'none';
      });

      digits.forEach(function(digit, idx){
        digit.style.opacity = Math.max(0, 1 - Math.abs(clamped - idx));
      });

      var i = Math.min(Math.floor(clamped), BG.length - 2);
      var t = clamped - i;
      var a = BG[i], b = BG[i + 1];
      var r = Math.round(lerp(a[0], b[0], t));
      var g = Math.round(lerp(a[1], b[1], t));
      var bl = Math.round(lerp(a[2], b[2], t));
      stage.style.setProperty('--fases-bg', 'rgb(' + r + ',' + g + ',' + bl + ')');

      setActiveNav(Math.min(scenes.length - 1, Math.round(clamped)));
      if(navProgress){
        navProgress.style.width = ((clamped / (scenes.length - 1)) * 100).toFixed(1) + '%';
      }
    };

    /* Fallback (mobile, tablet, motion reducido o ventana baja): el riel
       sticky vuelve al IntersectionObserver discreto de la Fase 2, sobre
       las mismas 5 <article>, ahora en su flujo normal de documento. */
    var sceneObserver = null;
    var attachFallbackObserver = function(){
      if(sceneObserver || !('IntersectionObserver' in window)) return;
      sceneObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            var idx = parseInt(entry.target.getAttribute('data-phase-index'), 10);
            if(!isNaN(idx)) setActiveNav(idx);
          }
        });
      }, { rootMargin: '-25% 0px -40% 0px', threshold: 0.15 });
      scenes.forEach(function(s){ sceneObserver.observe(s); });
    };
    var detachFallbackObserver = function(){
      if(!sceneObserver) return;
      sceneObserver.disconnect();
      sceneObserver = null;
    };

    var resetInline = function(){
      pinWrap.style.height = '';
      stage.style.height = '';
      system.classList.remove('is-pin-active');
      stage.style.removeProperty('--fases-pin-top');
      stage.style.removeProperty('--fases-bg');
      scenes.forEach(function(scene){
        scene.style.opacity = '';
        scene.style.transform = '';
        scene.style.visibility = '';
        scene.style.pointerEvents = '';
      });
      digits.forEach(function(digit){ digit.style.opacity = ''; });
      if(navProgress) navProgress.style.width = '0%';
      currentIndex = -1;
    };

    var applyProgress = function(){
      ticking = false;
      if(!active) return;

      var rect = pinWrap.getBoundingClientRect();
      var scrolled = headerOffset - rect.top;
      scrolled = Math.min(Math.max(scrolled, 0), maxScroll);
      var progress = maxScroll > 0 ? scrolled / maxScroll : 0;
      render(progress * (scenes.length - 1));
    };

    var onScroll = function(){
      if(!active || ticking) return;
      ticking = true;
      window.requestAnimationFrame(applyProgress);
    };

    /* Decide si el modo fijado tiene sentido y, si lo tiene, calcula la
       altura extra real a partir del viewport actual — nunca de valores
       fijos dependientes de una resolución concreta (mismo criterio que
       umbralSequence). */
    var measure = function(){
      var canPin = !isReducedMotion() && window.innerWidth >= 960 && window.innerHeight >= 560;

      if(!canPin){
        if(active){
          active = false;
          resetInline();
        }
        attachFallbackObserver();
        return;
      }

      detachFallbackObserver();
      headerOffset = header.offsetHeight + stickyNav.offsetHeight;
      var innerHeight = Math.max(window.innerHeight - headerOffset, 1);
      var stepDistance = innerHeight * getStepFraction();
      maxScroll = stepDistance * (scenes.length - 1);

      stage.style.setProperty('--fases-pin-top', headerOffset + 'px');
      stage.style.height = innerHeight + 'px';
      pinWrap.style.height = (innerHeight + maxScroll) + 'px';
      system.classList.add('is-pin-active');
      active = true;

      applyProgress();
    };

    var resizeTimer = null;
    var scheduleMeasure = function(){
      if(resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 150);
    };

    /* Navegación suave: con el pin activo, cada fase ya no tiene un
       offsetTop propio (todas comparten la posición del escenario sticky),
       así que se calcula el punto exacto del recorrido fijado; sin pin,
       se usa el desplazamiento normal a su <article>, igual que en la
       Fase 2. */
    navLinks.forEach(function(link, idx){
      link.addEventListener('click', function(e){
        var href = link.getAttribute('href');
        if(!href || href.indexOf('#') !== 0) return;
        e.preventDefault();
        var targetTop;
        if(active){
          var rect = pinWrap.getBoundingClientRect();
          var pinWrapDocTop = rect.top + window.scrollY;
          var frac = idx / (scenes.length - 1);
          targetTop = pinWrapDocTop - headerOffset + frac * maxScroll;
        }else{
          var target = document.querySelector(href);
          if(!target) return;
          targetTop = target.getBoundingClientRect().top + window.scrollY - 130;
        }
        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
        history.replaceState(null, '', href);
      });
    });

    measure();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('orientationchange', scheduleMeasure);
    window.addEventListener('load', scheduleMeasure);

    if(window.matchMedia){
      var rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if(rmQuery.addEventListener) rmQuery.addEventListener('change', scheduleMeasure);
      else if(rmQuery.addListener) rmQuery.addListener(scheduleMeasure);
    }

    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(scheduleMeasure)['catch'](function(){});
    }

    if('ResizeObserver' in window){
      var ro = new ResizeObserver(scheduleMeasure);
      ro.observe(panelsHost);
    }
  }catch(e){ console.warn('metodoFasesSystem', e); }
})();

