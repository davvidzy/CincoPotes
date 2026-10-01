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

  /* ---------- reveal ao scroll: REMOVIDO ----------
     Medido em celular fraco com 3G lento: o reveal deixava todo o conteúdo
     em opacity:0 até o main.js executar. Aos 6s de carregamento a tela
     mostrava só o cabeçalho e dois blocos de cor vazios - título do hero,
     preço e botões todos invisíveis, esperando um JS que só chegava aos
     ~6,3s. Numa página de vendas isso é o pior momento possível para não
     ter nada escrito na tela.

     A animação em si era barata (opacity/transform, sem jank no scroll),
     mas o custo não era de frame: era prender o conteúdo inteiro atrás do
     download do JS. Agora o HTML aparece assim que o CSS chega. */
})();
