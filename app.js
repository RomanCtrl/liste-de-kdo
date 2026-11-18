(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

  /* ---------- Decorations ---------- */

  function makeSnow() {
    if (reduceMotion) return;
    var snow = document.querySelector(".snow");
    for (var i = 0; i < 28; i++) {
      var f = document.createElement("span");
      f.className = "flake";
      f.textContent = "❄";
      f.style.left = Math.random() * 100 + "%";
      f.style.fontSize = (8 + Math.random() * 12) + "px";
      f.style.animationDuration = (7 + Math.random() * 8) + "s";
      f.style.animationDelay = (-Math.random() * 15) + "s";
      f.style.setProperty("--drift", (Math.random() * 60 - 30) + "px");
      snow.appendChild(f);
    }
  }

  function makeLights() {
    var colors = ["#e74c3c", "#e8c26a", "#2ecc71", "#ffffff", "#3fa9f5"];
    var row = document.querySelector(".lights");
    for (var i = 0; i < 28; i++) {
      var b = document.createElement("span");
      b.className = "bulb";
      b.style.setProperty("--c", colors[i % colors.length]);
      b.style.animationDelay = (i % colors.length) * 0.45 + "s";
      row.appendChild(b);
    }
  }

  /* ---------- Rendering ---------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function render(data) {
    var root = document.getElementById("sections");
    var all = [];
    var index = 0;

    data.sections.forEach(function (s) {
      var section = el("section", "section");
      var head = el("div", "section__head");
      head.appendChild(el("h2", null, s.game));
      head.appendChild(el("span", "section__faction", s.faction));
      section.appendChild(head);

      var grid = el("ul", "grid");
      s.gifts.forEach(function (g) {
        all.push(g.price);

        var li = el("li");
        li.dataset.price = g.price;
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
        img.width = 450;
        img.height = 450;
        imgBox.appendChild(img);

        var body = el("div", "card__body");
        body.appendChild(el("p", "card__name", g.name));
        var foot = el("div", "card__foot");
        foot.appendChild(el("span", "price", euro.format(g.price)));
        var cta = el("span", "cta", "Voir le produit ");
        cta.appendChild(el("span", "cta__arrow", "→"));
        foot.appendChild(cta);
        body.appendChild(foot);

        a.appendChild(imgBox);
        a.appendChild(body);
        li.appendChild(a);
        grid.appendChild(li);
      });

      section.appendChild(grid);
      root.appendChild(section);
    });

    var min = Math.min.apply(null, all);
    var max = Math.max.apply(null, all);
    document.getElementById("budget-pill").textContent =
      "Des idées pour tous les budgets : de " + euro.format(min) + " à " + euro.format(max);
  }

  /* ---------- Budget filter (fade out, then FLIP slide) ---------- */

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

  function applyFilter(min, max, done) {
    var items = Array.prototype.slice.call(document.querySelectorAll(".grid > li"));
    var match = function (li) {
      var p = Number(li.dataset.price);
      return p >= min && p < max;
    };

    // Stop the entrance animation from fighting the filter transitions.
    items.forEach(function (li) { li.style.animation = "none"; });

    var leaving = items.filter(function (li) { return !li.classList.contains("is-hidden") && !match(li); });
    var duration = reduceMotion ? 200 : 300;

    leaving.forEach(function (li) { li.classList.add("is-leaving"); });

    setTimeout(function () {
      // FLIP: remember positions of cards that stay visible
      var first = new Map();
      items.forEach(function (li) {
        if (!li.classList.contains("is-hidden")) first.set(li, li.getBoundingClientRect());
      });

      items.forEach(function (li) {
        var show = match(li);
        li.classList.toggle("is-hidden", !show);
        li.classList.remove("is-leaving");
      });

      // Hide sections with nothing left in them
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
          // slide from old spot
          li.style.transform = "translate(" + (prev.left - last.left) + "px," + (prev.top - last.top) + "px)";
        } else if (!prev) {
          // newly shown card: grow in
          li.style.opacity = "0";
          li.style.transform = reduceMotion ? "none" : "scale(.85)";
        }
      });

      // force a layout so the start positions apply, then animate to final place
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

  makeSnow();
  makeLights();

  fetch("gifts.json")
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (data) {
      render(data);
      setupFilters();
    })
    .catch(function () {
      var empty = document.getElementById("empty");
      empty.innerHTML = "Oups, la liste n'a pas pu se charger. " +
        "<a href=\"liste-de-noel.pdf\">Ouvrir la liste en PDF</a>.";
      empty.hidden = false;
    });
})();
