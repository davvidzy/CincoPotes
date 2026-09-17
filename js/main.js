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

  /* ---------- indicador dos carrosséis ----------
     Vale para qualquer .snap-track (passos e depoimentos). O card que
     ocupa mais de 60% da trilha é o "atual" e acende a bolinha. As
     bolinhas são procuradas dentro do mesmo wrapper da trilha, então
     cada carrossel controla só o indicador dele. */
  if ('IntersectionObserver' in window) {
    [].slice
      .call(document.querySelectorAll('.snap-track'))
      .forEach(function (track) {
        var dots = [].slice.call(track.parentNode.querySelectorAll('.dots b'));
        if (!dots.length) return;

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
      });
  }

  /* ---------- lightbox dos depoimentos ----------
     No card o print fica pequeno demais para ler. Tocar abre em tela
     cheia, com rolagem vertical quando a imagem é mais alta que a tela.
     Overlay simples em vez de <dialog>: funciona em WebView antiga. */
  var lb = document.getElementById('lightbox');
  var opens = [].slice.call(document.querySelectorAll('.depo-open'));

  if (lb && opens.length) {
    var lbImg = lb.querySelector('img');
    var lbClose = lb.querySelector('.lightbox-close');
    var lastFocus = null;

    var abrir = function (btn) {
      var img = btn.querySelector('img');
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lastFocus = btn;
      lb.hidden = false;
      /* trava o fundo para o scroll não "vazar" atrás do overlay */
      document.documentElement.style.overflow = 'hidden';
      lb.scrollTop = 0;
      lbClose.focus();
    };

    var fechar = function () {
      lb.hidden = true;
      document.documentElement.style.overflow = '';
      lbImg.removeAttribute('src');
      if (lastFocus) lastFocus.focus();
    };

    opens.forEach(function (btn) {
      btn.addEventListener('click', function () {
        abrir(btn);
      });
    });

    /* fecha no X e em qualquer toque fora da imagem */
    lb.addEventListener('click', function (e) {
      if (e.target !== lbImg) fechar();
    });

    document.addEventListener('keydown', function (e) {
      if (!lb.hidden && (e.key === 'Escape' || e.key === 'Esc')) fechar();
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
    '.desconto > .alt-plano',
    '.passo',
    '.apoio-card',
    '.numero',
    '.depo-card',
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
    '.depo-track',
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
        if (el.classList.contains('snap-track')) {
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
    var track = el.closest('.snap-track');
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

  /* ---------- vagas do desconto ----------
     O número cai sozinho com o passar do tempo e nunca volta a subir para
     quem já viu um valor menor - é o que faz a contagem parecer contínua
     em vez de reiniciar a cada visita.

     Três regras seguram o comportamento:
     1. V_ANCORA fixa o começo da rodada. Enquanto ela não mudar, todo mundo
        vê o mesmo número no mesmo momento. Suba a data ao abrir uma rodada
        nova - o localStorage guarda a âncora junto e se reinicia sozinho.
     2. V_PISO é onde a contagem para. Nunca chega a zero, que quebraria a
        frase e o próprio argumento da página.
     3. V_MAX_SESSAO limita as baixas ao vivo. Sem isso, uma aba esquecida
        aberta derrubaria o contador até o piso. As primeiras V_RAPIDAS saem
        rápido (a pessoa precisa ver o número se mexer logo que olha para a
        seção); as demais, dentro do limite de V_MAX_SESSAO, voltam ao ritmo
        normal, mais lento. */
  var vagasEl = document.getElementById('vagasRestantes');

  if (vagasEl) {
    var V_INICIO = 23;
    var V_PISO = 4;
    var V_ANCORA = Date.UTC(2026, 8, 17, 9, 0, 0); /* rodada atual */
    var V_PASSO_MS = 8 * 60 * 60 * 1000; /* uma baixa a cada 8h */
    var V_CHAVE = 'cp.vagas';
    var V_MAX_SESSAO = 6;
    var V_RAPIDAS = 3; /* quantas das baixas desta sessao saem no ritmo curto */
    var V_RAPIDA_MIN_MS = 3000;
    var V_RAPIDA_MAX_MS = 8000;
    var V_NORMAL_MIN_MS = 45000;
    var V_NORMAL_MAX_MS = 65000;

    var vagasPorTempo = function () {
      var decorrido = Date.now() - V_ANCORA;
      if (decorrido < 0) return V_INICIO;
      return Math.max(V_PISO, V_INICIO - Math.floor(decorrido / V_PASSO_MS));
    };

    var vagasSalvas = function () {
      try {
        var bruto = window.localStorage.getItem(V_CHAVE);
        if (!bruto) return null;
        var d = JSON.parse(bruto);
        return d && d.a === V_ANCORA && typeof d.v === 'number' ? d.v : null;
      } catch (e) {
        return null;
      }
    };

    var salvaVagas = function (v) {
      try {
        window.localStorage.setItem(
          V_CHAVE,
          JSON.stringify({ a: V_ANCORA, v: v })
        );
      } catch (e) {
        /* navegação anônima ou storage bloqueado: segue sem persistir */
      }
    };

    var vagas = vagasPorTempo();
    var salvo = vagasSalvas();
    if (salvo !== null && salvo < vagas) vagas = salvo;
    vagasEl.textContent = vagas;
    salvaVagas(vagas);

    var semMovimento = false;
    try {
      semMovimento = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
    } catch (e) {}

    var baixaUma = function () {
      if (vagas <= V_PISO) return false;
      vagas--;
      salvaVagas(vagas);

      if (semMovimento) {
        vagasEl.textContent = vagas;
        return true;
      }

      vagasEl.classList.remove('baixou');
      void vagasEl.offsetWidth; /* reinicia a animação */
      vagasEl.classList.add('baixou');
      /* troca o número no meio do movimento, enquanto ele está fora de
         vista - o de cima sai e o de baixo entra já com o valor novo */
      setTimeout(function () {
        vagasEl.textContent = vagas;
      }, 230);
      return true;
    };

    var restamNaSessao = V_MAX_SESSAO;
    var feitasNaSessao = 0;
    var agendaBaixa = function () {
      if (restamNaSessao <= 0 || vagas <= V_PISO) return;
      /* as primeiras V_RAPIDAS baixas vêm rápido, para o número já se mexer
         enquanto a pessoa ainda está olhando a seção; o resto volta ao ritmo
         normal, senão a contagem esvazia rápido demais e para de parecer
         orgânica */
      var rapida = feitasNaSessao < V_RAPIDAS;
      var min = rapida ? V_RAPIDA_MIN_MS : V_NORMAL_MIN_MS;
      var faixa = rapida
        ? V_RAPIDA_MAX_MS - V_RAPIDA_MIN_MS
        : V_NORMAL_MAX_MS - V_NORMAL_MIN_MS;
      setTimeout(function () {
        if (baixaUma()) {
          restamNaSessao--;
          feitasNaSessao++;
        }
        agendaBaixa();
      }, min + Math.random() * faixa);
    };

    /* só começa a agendar quando a seção chega perto do meio da tela: a
       baixa precisa acontecer com a pessoa já olhando bem para o número,
       senão não comunica nada */
    var secDesconto = document.getElementById('desconto');
    if (secDesconto && 'IntersectionObserver' in window) {
      var obsVagas = new IntersectionObserver(
        function (e) {
          if (!e[0].isIntersecting) return;
          obsVagas.disconnect();
          agendaBaixa();
        },
        { threshold: 0.5 }
      );
      obsVagas.observe(secDesconto);
    } else {
      agendaBaixa();
    }
  }
})();
