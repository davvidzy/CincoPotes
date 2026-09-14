(function () {
  /* ---------- CTA fixo ----------
     Entra depois do hero, sai quando a oferta está em tela: enquanto a
     oferta é visível a barra só cobriria o próprio botão de compra. */
  var cta = document.getElementById('stickyCta');
  var hero = document.querySelector('.hero');
  var offer = document.getElementById('oferta');

  if (cta && hero && offer && 'IntersectionObserver' in window) {
    var pastHero = false,
      onOffer = false;

    var sync = function () {
      cta.classList.toggle('show', pastHero && !onOffer);
    };

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
  }

  /* ---------- indicador do carrossel de passos ----------
     O card que ocupa mais de 60% da trilha é o "atual". */
  var track = document.querySelector('.passos-track');
  var dots = [].slice.call(document.querySelectorAll('#dots b'));

  if (track && dots.length && 'IntersectionObserver' in window) {
    var slides = [].slice.call(track.children);
    var dotObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.intersectionRatio <= 0.6) return;
          var i = slides.indexOf(en.target);
          dots.forEach(function (d, n) {
            d.classList.toggle('on', n === i);
          });
        });
      },
      { root: track, threshold: [0.6] }
    );
    slides.forEach(function (s) {
      dotObs.observe(s);
    });
  }

  /* ---------- reveal ao scroll ----------
     Espelha o bloco "REVEAL AO SCROLL" de css/style.css: se mexer em um,
     mexa no outro. O CSS esconde, aqui só liberamos com .is-in. */
  var REVEAL_SELECTOR = [
    '.hero > *',
    '.sec-head > *',
    '.receber-item',
    '.band-photo',
    '.price-block',
    '.desconto > .btn',
    '.passo',
    '.passos > .btn-ghost',
    '.apoio-card',
    '.numero',
    '.quote',
    '.offer-card',
    '.garantia-row',
    '.faq details',
    '.fechamento > .btn',
    '.site-footer > *',
  ].join(',');

  /* cascata só onde os itens entram juntos na tela; listas altas já ganham
     escalonamento natural do próprio scroll */
  var STAGGER_PARENTS = [
    '.hero',
    '.sec-head',
    '.receber-list',
    '.passos-track',
    '.numeros-grid',
    '.faq',
    '.site-footer',
  ].join(',');

  var root = document.documentElement;
  clearTimeout(window.__rvSafety);

  if (!root.classList.contains('js')) return;

  if (!('IntersectionObserver' in window)) {
    root.classList.remove('js'); // sem suporte: mostra tudo, sem animação
    return;
  }

  [].slice
    .call(document.querySelectorAll(STAGGER_PARENTS))
    .forEach(function (parent) {
      var step = 0;
      [].slice.call(parent.children).forEach(function (el) {
        if (!el.matches(REVEAL_SELECTOR)) return;
        el.style.setProperty('--rv-delay', Math.min(step, 4) * 0.06 + 's');
        step++;
      });
    });

  var revealObs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        /* a trilha é só gatilho: quem recebe .is-in são os cards */
        if (el.classList.contains('passos-track')) {
          revealObs.unobserve(el);
          [].slice.call(el.children).forEach(reveal);
          return;
        }
        reveal(el);
      });
    },
    { threshold: 0, rootMargin: '0px 0px -10% 0px' }
  );

  function reveal(el) {
    el.classList.add('is-in');
    revealObs.unobserve(el); // dispara uma vez só
  }

  var pending = [].slice.call(document.querySelectorAll(REVEAL_SELECTOR));
  var tracked = [];
  pending.forEach(function (el) {
    /* Os cards do carrossel ficam fora da tela na horizontal: sozinhos nunca
       intersectariam o viewport. O gatilho deles é a trilha inteira. */
    var track = el.closest('.passos-track');
    if (track) {
      if (tracked.indexOf(track) === -1) {
        tracked.push(track);
        revealObs.observe(track);
      }
      return;
    }
    revealObs.observe(el);
  });

  /* Rede de segurança, 150ms depois que o scroll para. Cobre dois furos
     do observer:
     1. o rootMargin negativo cria uma faixa morta no fim da página - o
        último item do rodapé nunca entraria na zona de disparo;
     2. num scroll muito rápido o IntersectionObserver pode não chegar a
        registrar um elemento que passou voando pela tela.
     Nos dois casos, libera o que já deveria estar visível. */
  var flushTimer;
  function flushMissed() {
    pending = pending.filter(function (el) {
      if (el.classList.contains('is-in')) return false;
      if (el.getBoundingClientRect().top > window.innerHeight) return true;
      reveal(el);
      return false;
    });
    if (!pending.length) window.removeEventListener('scroll', onScroll);
  }
  function onScroll() {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flushMissed, 150);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
