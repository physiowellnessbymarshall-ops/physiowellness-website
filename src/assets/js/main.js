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
      document.body.style.overflow = 'hidden';
      var firstLink = menu.querySelector('a');
      if(firstLink) firstLink.focus();
    };
    var closeMenu = function(){
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded','false');
      document.body.style.overflow = '';
      toggle.focus();
    };

    toggle.addEventListener('click', function(){
      if(menu.classList.contains('is-open')) closeMenu(); else open();
    });
    if(close) close.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
    window.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
    });
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
