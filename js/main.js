(function () {
  /* CTA fixo: entra depois do hero, sai quando a oferta está em tela */
  var cta = document.getElementById('stickyCta');
  var hero = document.getElementById('top');
  var offer = document.getElementById('oferta');
  var pastHero = false,
    onOffer = false;

  function sync() {
    cta.classList.toggle('show', pastHero && !onOffer);
  }

  new IntersectionObserver(
    function (e) {
      pastHero = !e[0].isIntersecting;
      sync();
    },
    { threshold: 0, rootMargin: '-70% 0px 0px 0px' }
  ).observe(hero);

  new IntersectionObserver(
    function (e) {
      onOffer = e[0].isIntersecting;
      sync();
    },
    { threshold: 0.18 }
  ).observe(offer);

  /* indicador da galeria */
  var gal = document.getElementById('gallery');
  var dots = [].slice.call(document.querySelectorAll('#dots b'));
  var slides = [].slice.call(gal.children);
  var obs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (en) {
        if (en.intersectionRatio > 0.6) {
          var i = slides.indexOf(en.target);
          dots.forEach(function (d, n) {
            d.classList.toggle('on', n === i);
          });
        }
      });
    },
    { root: gal, threshold: [0.6] }
  );
  slides.forEach(function (s) {
    obs.observe(s);
  });

  /* ---------- reveal ao scroll ----------
     Espelha o bloco "REVEAL AO SCROLL" de css/style.css: se mexer em um,
     mexa no outro. O CSS esconde, aqui só liberamos com .is-in. */
  var REVEAL_SELECTOR = [
    '.hero > *',
    '.sec-head > *',
    '.pain-list li',
    '.pain-close',
    '.compare-col',
    '.compare-note',
    '.step',
    '.gallery-wrap',
    '.gallery-cta',
    '.deliver li',
    '.extras',
    '.number',
    '.quote-hero',
    // observado como gatilho: os .quote-sm entram em cascata pelo CSS,
    // senão o 3º card (fora da tela na horizontal) nunca apareceria
    '.quote-row',
    '.objection',
    '.offer-card',
    '.price-val',
    '.guarantee',
    '.faq details',
    '.closing > *',
    '.site-footer > *',
  ].join(',');

  /* cascata só onde os itens entram juntos na tela; listas altas já ganham
     escalonamento natural do próprio scroll */
  var STAGGER_PARENTS = [
    '.hero',
    '.sec-head',
    '.pain-list',
    '.compare',
    '.steps',
    '.deliver',
    '.numbers',
    '.objections',
    '.faq',
    '.closing',
    '.site-footer',
  ].join(',');

  var root = document.documentElement;
  clearTimeout(window.__rvSafety);

  if (root.classList.contains('js')) {
    if (!('IntersectionObserver' in window)) {
      root.classList.remove('js'); // sem suporte: mostra tudo, sem animação
    } else {
      [].slice
        .call(document.querySelectorAll(STAGGER_PARENTS))
        .forEach(function (parent) {
          var step = 0;
          [].slice.call(parent.children).forEach(function (el) {
            if (!el.matches(REVEAL_SELECTOR)) return;
            el.style.setProperty(
              '--rv-delay',
              Math.min(step, 4) * 0.06 + 's'
            );
            step++;
          });
        });

      var revealObs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            reveal(en.target);
          });
        },
        { threshold: 0, rootMargin: '0px 0px -10% 0px' }
      );

      function reveal(el) {
        el.classList.add('is-in');
        revealObs.unobserve(el); // dispara uma vez só
      }

      var pending = [].slice.call(document.querySelectorAll(REVEAL_SELECTOR));
      pending.forEach(function (el) {
        revealObs.observe(el);
      });

      /* o rootMargin negativo cria uma faixa morta no fim da página: o último
         item do rodapé nunca entraria na zona de disparo. No fim do scroll,
         libera o que sobrou. */
      function flushAtBottom() {
        if (
          window.innerHeight + window.pageYOffset <
          document.body.scrollHeight - 4
        )
          return;
        pending = pending.filter(function (el) {
          if (el.classList.contains('is-in')) return false;
          reveal(el);
          return false;
        });
        window.removeEventListener('scroll', flushAtBottom);
      }
      window.addEventListener('scroll', flushAtBottom, { passive: true });
    }
  }
})();
