/* ==========================================================================
   Physio Wellness — prototipo Home — main.js
   Cada bloque va envuelto en try/catch: un efecto roto no tumba el resto.
   Todo el contenido crítico ya está en el HTML; esto solo enriquece.
   ========================================================================== */

document.documentElement.classList.add('js');

var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- header sólido al hacer scroll ---------- */
(function headerState(){
  try{
    var header = document.getElementById('site-header');
    if(!header) return;
    var onScroll = function(){
      if(window.scrollY > 24){
        header.classList.add('is-solid');
      } else {
        header.classList.remove('is-solid');
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
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
