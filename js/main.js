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
})();
