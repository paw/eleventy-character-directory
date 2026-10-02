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
// Call our function when the DOM is ready.
document.addEventListener("DOMContentLoaded", function () {
  navbar = document.getElementById("navbar");
  window.addEventListener("scroll", onScrollThrottled, { passive: true });
});
