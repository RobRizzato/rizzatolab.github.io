(function () {
  function setCurrentYear() {
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  function parseHref(href) {
    var page = href || "index.html";
    var hash = "";

    if (page.indexOf("#") !== -1) {
      var parts = page.split("#");
      page = parts[0] || "index.html";
      hash = "#" + parts.slice(1).join("#");
    }

    if (page.charAt(0) === "#") {
      hash = page;
      page = "index.html";
    }

    return { page: page, hash: hash };
  }

  function initNavigation() {
    var nav = document.querySelector(".top-nav");
    if (!nav) return;

    function currentPage() {
      return location.pathname.split("/").pop() || "index.html";
    }

    function updateVisibility() {
      if (nav.dataset.alwaysVisible === "true") {
        nav.classList.add("visible");
        return;
      }

      nav.classList.toggle("visible", window.scrollY > 10);
    }

    function updateActiveLink() {
      var page = currentPage();
      var hash = location.hash || "";
      var links = nav.querySelectorAll("a");

      links.forEach(function (link) {
        var target = parseHref(link.getAttribute("href") || "");
        var targetPage = target.page.split("/").pop() || "index.html";
        var isActive = false;

        if (target.hash) {
          isActive = page === targetPage && hash === target.hash;
          if (!hash && target.hash === "#home" && page === targetPage) {
            isActive = true;
          }
        } else {
          isActive = page === targetPage && !hash;
        }

        link.classList.toggle("active", isActive);
      });
    }

    updateVisibility();
    updateActiveLink();

    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("hashchange", updateActiveLink);
    window.setTimeout(function () {
      updateVisibility();
      updateActiveLink();
    }, 80);
  }

  function initHeroRotation() {
    var hero = document.querySelector(".hero.hero-rotating[data-rotate-images]");
    if (!hero) return;

    var images = (hero.getAttribute("data-rotate-images") || "")
      .split(",")
      .map(function (src) { return src.trim(); })
      .filter(Boolean);
    if (images.length < 2) return;

    var intervalMs = Math.max(
      2500,
      parseInt(hero.getAttribute("data-rotate-interval") || "8000", 10) || 8000
    );
    var layerA = hero.querySelector(".hero-bg-a");
    var layerB = hero.querySelector(".hero-bg-b");
    if (!layerA || !layerB) return;

    images.forEach(function (src) {
      var preloaded = new Image();
      preloaded.src = src;
    });

    var index = 0;
    var showA = true;

    window.setInterval(function () {
      index = (index + 1) % images.length;
      var show = showA ? layerB : layerA;
      var hide = showA ? layerA : layerB;

      show.style.backgroundImage = "url('" + images[index] + "')";
      show.classList.add("is-active");
      hide.classList.remove("is-active");
      showA = !showA;
    }, intervalMs);
  }

  function initNewsCarousel() {
    var items = document.querySelectorAll(".news-item");
    var dots = document.querySelectorAll(".dot");
    if (!items.length || !dots.length) return;

    var current = 0;
    var intervalMs = 10000;

    function show(index) {
      if (!items[index] || !dots[index]) return;
      items.forEach(function (item) { item.classList.remove("active"); });
      dots.forEach(function (dot) {
        dot.classList.remove("active");
        dot.setAttribute("aria-selected", "false");
      });

      items[index].classList.add("active");
      dots[index].classList.add("active");
      dots[index].setAttribute("aria-selected", "true");
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        current = index;
        show(current);
      });
    });

    window.setInterval(function () {
      current = (current + 1) % items.length;
      show(current);
    }, intervalMs);
  }

  function initResearchBannerRotation() {
    var banner = document.querySelector(".research-banner[data-rotate-images]");
    if (!banner) return;

    var images = (banner.getAttribute("data-rotate-images") || "")
      .split(",")
      .map(function (src) { return src.trim(); })
      .filter(Boolean);
    if (images.length < 2) return;

    var imgA = banner.querySelector("img");
    if (!imgA) return;

    var intervalMs = Math.max(
      2000,
      parseInt(banner.getAttribute("data-rotate-interval") || "6000", 10) || 6000
    );

    banner.classList.add("rotating");
    imgA.classList.add("is-active");
    imgA.src = images[0];

    var imgB = document.createElement("img");
    imgB.alt = imgA.alt;
    imgB.setAttribute("aria-hidden", "true");
    imgB.src = images[1];
    banner.appendChild(imgB);

    images.slice(2).forEach(function (src) {
      var preloaded = new Image();
      preloaded.src = src;
    });

    var index = 1;
    var showA = false;

    window.setInterval(function () {
      index = (index + 1) % images.length;
      var show = showA ? imgA : imgB;
      var hide = showA ? imgB : imgA;

      show.src = images[index];
      show.classList.add("is-active");
      hide.classList.remove("is-active");
      showA = !showA;
    }, intervalMs);
  }

  setCurrentYear();
  initNavigation();
  initHeroRotation();
  initNewsCarousel();
  initResearchBannerRotation();
})();
