// autohiding navbar code: https://stackoverflow.com/a/78069966

let throttling = false;

function onScrollThrottled() {
  if (!throttling) {
    throttling = true;
    requestAnimationFrame(() => {
      onScroll();
      throttling = false;
    });
  }
}

let navbarTop = 0;
let transition = true;
let position = "relative";
let lastScrollPosition = 0;

var navbar;

function onScroll() {

  const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

  if (currentScrollPosition <= 0) {

    lastScrollPosition = 0;
    navbarTop = 0;

    if (position !== "relative") { transition = true; }
    else { transition = false; }
    position = "relative";

  } else {

    if (currentScrollPosition > lastScrollPosition) {

      if (position !== "relative") { transition = true; }
      else { transition = false; }
      position = "relative";

      let { top, height } = navbar.getBoundingClientRect()
      navbarTop = currentScrollPosition + Math.max(top, -height);

    } else {

      const { top } = navbar.getBoundingClientRect()

      if (top >= 0) {

        navbarTop = 0;

        if (position !== "sticky") { transition = true; }
        else { transition = false; }
        position = "sticky";

      }

    }

    lastScrollPosition = currentScrollPosition;

  }
  navbar.style = `position: ${position}; top: ${navbarTop}px; transition: ${ transition ? "none" : "100ms linear" }`;
}
function processFeatured() {
  // gettin all the settings and stuff from inline dataset set by template when the site is built
  const featured = document.querySelector(`[data-name="featured-home"]`),
    ocList = featured.querySelector(`.oc-list`);
    ocs = Array.from(ocList.querySelectorAll(`.oc`)),
    shuffleEnabled = featured.dataset.shuffle,
    showAllFeaturedOcs = featured.dataset.showAllFeatured,
    visibleCount = Number(featured.dataset.maxVisible);

  if (shuffleEnabled === 'true') {
    // shuffle using Fisher–Yates
    for (let i = ocs.length - 1; i >= 1; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ocs[i], ocs[j]] = [ocs[j], ocs[i]];
    }
    // reorder DOM elements
    ocs.forEach((oc) => ocList.appendChild(oc));
  }

  if (showAllFeaturedOcs !== 'true') {
    // hide elements beyond the config-specified limit
    ocs.forEach((oc, index) => {
      if (index >= visibleCount) {
        oc.classList.add("hide");
      }
    });
    featured.classList.remove('loading');
  }
}
// Call our function when the DOM is ready.
document.addEventListener("DOMContentLoaded", function () {
  navbar = document.getElementById("navbar");
  window.addEventListener("scroll", onScrollThrottled, { passive: true });
  document.querySelector("#sort")?.addEventListener("change", (event) => {
    if (event.target.value) {
      window.location.href = event.target.value;
    }
  });
  if (document.querySelector(`[data-name="featured-home"]`)) { processFeatured() };
  document.querySelector("#mobile-menu").addEventListener("click", (event) => {
    if (document.querySelector("#mobile-menu").getAttribute("data-menu") === "closed") {
      document.querySelector("#mobile-menu").setAttribute("data-menu","open");
      document.querySelector(".nav .links").classList.add("open");
      document.querySelector("#mobile-menu").setAttribute("aria-label","Hide Site Navigation");
      document.body.classList.add("no-scroll");
    } else {
      document.querySelector("#mobile-menu").setAttribute("data-menu","closed");
      document.querySelector(".nav .links").classList.remove("open");
      document.querySelector("#mobile-menu").setAttribute("aria-label","Show Site Navigation");
      document.body.classList.remove("no-scroll");
    }
  });
  tippy('[data-tippy-content]', {
  content: (reference) => reference.getAttribute('title'),
    theme: 'tooltips',
    animation: 'perspective',
    inertia: true
  });
});
