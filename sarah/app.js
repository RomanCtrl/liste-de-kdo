(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

  /* ---------- Butterfly drawing ---------- */

  // One wing pair (left), mirrored for the right. Body centre is x=20.
  var WING =
    '<path class="w" d="M20 15C15 3 4 0 2.5 8.5 1.5 14 10 17.5 20 16Z"/>' +
    '<path class="w" d="M20 17C12 17.5 5 22 7.5 27.5 10 31.5 17 26 20 18Z"/>' +
    '<circle class="spot" cx="8" cy="8.5" r="2"/>' +
    '<circle class="spot" cx="11.5" cy="24" r="1.3"/>';

  var BUTTERFLY_SVG =
    '<svg viewBox="0 0 40 32" aria-hidden="true">' +
      '<g class="bf-wings">' + WING +
        '<g transform="matrix(-1 0 0 1 40 0)">' + WING + '</g>' +
      '</g>' +
      '<path class="ant" d="M19.6 11Q18 5 14.5 3.5M20.4 11Q22 5 25.5 3.5"/>' +
      '<ellipse class="body" cx="20" cy="17" rx="1.3" ry="6.5"/>' +
    '</svg>';

  var VARIANTS = ["", "bf--wine", "bf--cream"];

  function butterfly(variant, cls) {
    var b = document.createElement("span");
    b.className = "bf " + (variant || "") + " " + (cls || "");
    b.innerHTML = BUTTERFLY_SVG;
    return b;
  }

  function randomVariant() {
    return VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
  }

  /* ---------- Header: sparkles and butterflies drifting up ---------- */

  function decorateHeader() {
    document.querySelector(".ornament").appendChild(butterfly());

    if (reduceMotion) return;
    var box = document.querySelector(".sparkles");
    var glyphs = ["✦", "✧", "·", "✦", "⋆"];
    var count = window.innerWidth < 600 ? 22 : 30;

    for (var i = 0; i < count; i++) {
      var isBf = i % 4 === 0; // about one in four is a butterfly
      var s = isBf ? butterfly(randomVariant(), "spark") : document.createElement("span");
      if (!isBf) {
        s.className = "spark";
        s.textContent = glyphs[i % glyphs.length];
      }
      s.style.left = Math.random() * 100 + "%";
      s.style.fontSize = (isBf ? 16 + Math.random() * 12 : 8 + Math.random() * 12) + "px";
      s.style.animationDuration = (isBf ? 12 + Math.random() * 8 : 8 + Math.random() * 8) + "s";
      s.style.animationDelay = (-Math.random() * 18) + "s";
      s.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
      if (isBf) s.style.setProperty("--flap", (.3 + Math.random() * .25) + "s");
      box.appendChild(s);
    }
  }

  /* ---------- Overlay layer for flying butterflies ---------- */

  var layer = null;

  function getLayer() {
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "bf-layer";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    return layer;
  }

  // A butterfly flies from (x, y) by (dx, dy), facing its direction of travel.
  function fly(x, y, dx, dy, size, duration, delay, endScale) {
    var b = butterfly(randomVariant());
    b.style.left = (x - size / 2) + "px";
    b.style.top = (y - size * .4) + "px";
    b.style.fontSize = size + "px";
    b.style.setProperty("--flap", (.1 + Math.random() * .08) + "s");
    getLayer().appendChild(b);

    var rot = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    var wobble = Math.random() * 40 - 20;
    var anim = b.animate([
      { transform: "translate(0,0) rotate(" + rot + "deg) scale(.3)", opacity: 0 },
      { opacity: 1, offset: .15 },
      { transform: "translate(" + dx + "px," + dy + "px) rotate(" + (rot + wobble) + "deg) scale(" + endScale + ")", opacity: 1 }
    ], { duration: duration, delay: delay, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
    return { el: b, anim: anim };
  }

  /* ---------- Link click: a short burst of butterflies covers the screen ---------- */

  var opening = false;

  function swarm(x, y, done) {
    var l = getLayer();
    var veil = document.createElement("div");
    veil.className = "bf-veil";
    veil.style.setProperty("--x", x + "px");
    veil.style.setProperty("--y", y + "px");
    l.appendChild(veil);
    veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: "ease-in", fill: "forwards" });

    var w = window.innerWidth, h = window.innerHeight;
    var n = w < 600 ? 34 : 54;
    var reach = Math.hypot(w, h);

    for (var i = 0; i < n; i++) {
      var angle = (i / n) * Math.PI * 2 + Math.random() * .5;
      var dist = reach * (.15 + Math.random() * .65);
      fly(x, y, Math.cos(angle) * dist, Math.sin(angle) * dist,
        22 + Math.random() * 22, 550 + Math.random() * 200, Math.random() * 80, 2 + Math.random() * 1.8);
    }
    setTimeout(done, 700);
  }

  function clearLayer() {
    if (!layer) return;
    var old = layer;
    layer = null;
    var fade = old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: "ease-out", fill: "forwards" });
    fade.onfinish = function () { old.remove(); };
  }

  function setupLinks() {
    document.getElementById("sections").addEventListener("click", function (e) {
      var a = e.target.closest("a.card");
      if (!a || reduceMotion) return;
      // Let ctrl/cmd/shift-clicks behave normally.
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      if (opening) return;
      opening = true;

      var x = e.clientX, y = e.clientY;
      if (!x && !y) { // keyboard: start from the card's centre
        var r = a.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }

      swarm(x, y, function () {
        var win = window.open(a.href, "_blank");
        if (win) {
          try { win.opener = null; } catch (_) { /* ignore */ }
        } else {
          window.location.href = a.href; // pop-up blocked: open here instead
        }
        clearLayer();
        opening = false;
      });
    });

    // Coming back with the Back button: make sure the page is clean.
    window.addEventListener("pageshow", function () {
      if (layer) { layer.remove(); layer = null; }
      opening = false;
    });
  }

  /* ---------- Rendering ---------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function hasPrice(g) {
    return typeof g.price === "number";
  }

  function render(data) {
    var root = document.getElementById("sections");
    var all = [];
    var index = 0;

    data.sections.forEach(function (s, si) {
      var section = el("section", "section");
      var head = el("div", "section__head");
      head.appendChild(el("h2", null, s.title));
      if (s.subtitle) head.appendChild(el("span", "section__sub", s.subtitle));
      var restBf = butterfly(VARIANTS[si % VARIANTS.length], "section__bf");
      restBf.querySelector(".bf-wings").style.animationDelay = (-Math.random() * 6) + "s";
      head.appendChild(restBf);
      section.appendChild(head);

      var grid = el("ul", "grid");
      s.gifts.forEach(function (g) {
        if (hasPrice(g)) all.push(g.price);

        var li = el("li");
        li.dataset.price = hasPrice(g) ? g.price : "";
        li.style.setProperty("--i", index++);

        var a = el("a", "card");
        a.href = g.url;
        a.target = "_blank";
        a.rel = "noopener";

        var imgBox = el("div", "card__img");
        var img = el("img");
        img.src = g.image;
        img.alt = g.name;
        img.loading = "lazy";
        imgBox.appendChild(img);

        var body = el("div", "card__body");
        if (g.shop) body.appendChild(el("p", "card__shop", g.shop));
        body.appendChild(el("p", "card__name", g.name));
        if (g.note) body.appendChild(el("p", "card__note", g.note));
        var foot = el("div", "card__foot");
        foot.appendChild(hasPrice(g)
          ? el("span", "price", euro.format(g.price))
          : el("span", "price price--unknown", "Prix sur le site"));
        var cta = el("span", "cta", "Voir ");
        cta.appendChild(el("span", "cta__arrow", "→"));
        foot.appendChild(cta);
        body.appendChild(foot);

        a.appendChild(imgBox);
        a.appendChild(body);
        li.appendChild(a);
        li.appendChild(butterfly(randomVariant(), "card__bf"));
        grid.appendChild(li);
      });

      section.appendChild(grid);
      root.appendChild(section);
    });

    var min = Math.min.apply(null, all);
    var max = Math.max.apply(null, all);
    document.getElementById("budget-pill").textContent =
      "Des idées de " + euro.format(min) + " à " + euro.format(max);
  }

  /* ---------- Budget filter (cards flutter away, then FLIP slide) ---------- */

  function setupFilters() {
    var chips = document.querySelectorAll(".chip");
    var busy = false;

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (busy || chip.classList.contains("is-active")) return;
        chips.forEach(function (c) {
          c.classList.toggle("is-active", c === chip);
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        busy = true;
        applyFilter(Number(chip.dataset.min), Number(chip.dataset.max), function () { busy = false; });
      });
    });
  }

  // 2–3 butterflies rise out of a card that is leaving.
  function flutterFrom(li) {
    var r = li.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return; // off screen
    var n = 2 + Math.round(Math.random());
    for (var i = 0; i < n; i++) {
      var x = r.left + r.width * (.2 + Math.random() * .6);
      var y = r.top + r.height * (.25 + Math.random() * .5);
      var f = fly(x, y, Math.random() * 160 - 80, -(160 + Math.random() * 160),
        16 + Math.random() * 10, 900 + Math.random() * 300, i * 70, 1.1);
      f.anim.onfinish = (function (b) {
        return function () {
          b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }).onfinish = function () { b.remove(); };
        };
      })(f.el);
      setTimeout(f.el.remove.bind(f.el), 2500); // safety net if an animation stalls
    }
  }

  function applyFilter(min, max, done) {
    var items = Array.prototype.slice.call(document.querySelectorAll(".grid > li"));
    var showAll = min === 0 && max === Infinity;
    var match = function (li) {
      if (showAll) return true;
      if (li.dataset.price === "") return false; // unknown price: only under "Tous"
      var p = Number(li.dataset.price);
      return p >= min && p < max;
    };

    items.forEach(function (li) { li.style.animation = "none"; });

    var leaving = items.filter(function (li) { return !li.classList.contains("is-hidden") && !match(li); });
    var duration = reduceMotion ? 200 : 300;

    if (!reduceMotion) leaving.forEach(flutterFrom);
    leaving.forEach(function (li) { li.classList.add("is-leaving"); });

    setTimeout(function () {
      var first = new Map();
      items.forEach(function (li) {
        if (!li.classList.contains("is-hidden")) first.set(li, li.getBoundingClientRect());
      });

      items.forEach(function (li) {
        li.classList.toggle("is-hidden", !match(li));
        li.classList.remove("is-leaving");
      });

      var anyVisible = false;
      document.querySelectorAll(".section").forEach(function (s) {
        var visible = s.querySelector(".grid > li:not(.is-hidden)") !== null;
        s.classList.toggle("is-hidden", !visible);
        anyVisible = anyVisible || visible;
      });
      document.getElementById("empty").hidden = anyVisible;

      items.forEach(function (li) {
        if (li.classList.contains("is-hidden")) return;
        var last = li.getBoundingClientRect();
        var prev = first.get(li);
        li.style.transition = "none";
        if (prev && !reduceMotion) {
          li.style.transform = "translate(" + (prev.left - last.left) + "px," + (prev.top - last.top) + "px)";
        } else if (!prev) {
          li.style.opacity = "0";
          li.style.transform = reduceMotion ? "none" : "scale(.85)";
        }
      });

      void document.body.offsetHeight;
      items.forEach(function (li) {
        li.style.transition = "";
        li.style.transform = "";
        li.style.opacity = "";
      });
      setTimeout(done, duration);
    }, leaving.length ? duration : 0);
  }

  /* ---------- Start ---------- */

  decorateHeader();

  fetch("gifts.json")
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (data) {
      render(data);
      setupFilters();
      setupLinks();
    })
    .catch(function () {
      var empty = document.getElementById("empty");
      empty.textContent = "Oups, la liste n'a pas pu se charger. Rechargez la page pour réessayer.";
      empty.hidden = false;
    });
})();
