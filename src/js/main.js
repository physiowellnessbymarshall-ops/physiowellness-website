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
   real y funciona igual sin JavaScript (las cuatro áreas ya comparten el
   mismo precio, visible más abajo, con el texto fijo "Tarifa en clínica
   compartida por las cuatro áreas." que NO cambia con la selección). Esto
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
      if(contextCta) contextCta.textContent = 'Ver tarifas de ' + area;
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
   methodSequence(), leída de forma pasiva y aplicada con
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
    /* Las cinco "paradas" del riel: los cuatro servicios + el panel de
       transición. Flechas, teclado y el indicador 01/04 trabajan siempre
       sobre este mismo array, tanto en modo fijado como en el riel nativo
       de respaldo, para no duplicar la lógica de sincronización. */
    var stopEls = Array.prototype.slice.call(panels).concat([transitionEl]);

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

    /* Traduce el índice de parada (0-3 = servicios, 4 = panel de
       transición) al texto "01/04"…"04/04" y al estado disabled/is-final
       de flechas e indicador. Es el único punto que toca ese estado, tanto
       si lo dispara el scroll (fijado o riel nativo) como un clic o una
       tecla, para que nunca queden desincronizados entre sí. */
    var updateNav = function(index){
      currentIndex = index;
      var hasOverflow = maxTranslate > 0;

      if(progressCurrent){
        var label = index < 4 ? '0' + (index + 1) : '04';
        if(progressCurrent.textContent !== label) progressCurrent.textContent = label;
      }
      if(progressWrap) progressWrap.classList.toggle('is-final', index >= 4);

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
      var wrapHeight = innerHeight + maxTranslate;

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

/* ---------- The Marshall Method: secuencia scroll-driven ---------- */
(function methodSequence(){
  try{
    var wrap = document.querySelector('.method');
    if(!wrap) return;
    var steps = wrap.querySelectorAll('.method-step');
    var fill = wrap.querySelector('.method__bar-fill');
    if(!steps.length) return;

    var onScroll = function(){
      var wrapRect = wrap.getBoundingClientRect();
      var vh = window.innerHeight;

      if(fill){
        var total = wrap.offsetHeight - vh * 0.6;
        var scrolled = Math.min(Math.max(-wrapRect.top, 0), Math.max(total,1));
        var pct = total > 0 ? (scrolled/total)*100 : 0;
        fill.style.height = pct + '%';
      }

      steps.forEach(function(step){
        var r = step.getBoundingClientRect();
        var center = r.top + r.height/2;
        if(center < vh*0.75 && center > vh*0.1){
          step.classList.add('is-active');
        } else {
          step.classList.remove('is-active');
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
  }catch(e){ console.warn('methodSequence', e); }
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
   (physio, wellness, strength, pilates, domicilio); lo único que cambia es
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
