const gallery = document.querySelector("#gallery");

if (gallery) {
    const galleryItems = [...gallery.children],
          galleryImages = gallery.querySelectorAll("img");
      

  const lightbox = document.querySelector("#lightbox"),
        lightboxImage = document.querySelector("#lightbox-image"),
        lightboxTitle = document.querySelector("#lightbox-title"),
        lightboxCaption = document.querySelector("#lightbox-caption"),
        lightboxCounter = document.querySelector("#lightbox-counter");

  const closeButton = document.querySelector(".lightbox-close"),
        prevButton = document.querySelector(".lightbox-prev"),
        nextButton = document.querySelector(".lightbox-next");

  let currentIndex = 0,
      lastOpened = null;

  function showImage(index) {
    currentIndex = Number(index < 0 ? galleryImages.length - 1 : index >= galleryImages.length ? 0 : index);
    const image = galleryImages[currentIndex];
    // Full-size image
    lightboxImage.src = image.dataset.full;
    lightboxImage.alt = image.alt;
    lightboxTitle.innerHTML = image.dataset.title;
    lightboxCaption.innerHTML = image.dataset.caption;
    // Counter
    lightboxCounter.textContent = `${currentIndex+1} / ${galleryImages.length}`;
  }


  function openLightbox(index) {
    // looping logic
    showImage(index);
    lightbox.classList.add("is-open");
    document.body.classList.add("no-scroll");
    lightbox.querySelector(".lightbox-wrapper").focus();
  }


  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightboxImage.src = "";
    document.body.classList.remove("no-scroll");
  }
  // add handler
  galleryImages.forEach(image => {
      image.addEventListener("click", (event) => {
          if (event.target == image) {
              openLightbox(image.dataset.index);
              lastOpened = event.target;
          }
      });
  });

  prevButton.addEventListener("click", (event) => {
    showImage(currentIndex - 1);
  });

  nextButton.addEventListener("click", (event) => {
    showImage(currentIndex + 1);
  });

  closeButton.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox.querySelector(".lightbox-wrapper")) {
      closeLightbox();
    }
  });


  /* Keyboard navigation */

  document.addEventListener("keydown", (event) => {
    if (lightbox.classList.contains("is-open")) {

          if (event.key === "Escape") {
              closeLightbox();
              lastOpened.focus();
          }
          if (event.target == closeButton) {
            if (event.key === "Enter") {
              closeLightbox();
              lastOpened.focus();
            }
          }

          if (event.key === "ArrowLeft") {
              showImage(currentIndex - 1);
              lightbox.querySelector(".lightbox-wrapper").focus();
          }

          if (event.key === "ArrowRight") {
              showImage(currentIndex + 1);
              lightbox.querySelector(".lightbox-wrapper").focus();
          }
      } else if (event.target.dataset.index) {
          if (event.key === "Enter") {
            openLightbox(event.target.dataset.index)
            lastOpened = event.target;
          }
      }
  });

  function getColumnCount() {
    const width = window.innerWidth;

    if (width >= 1200) return 4;
    if (width >= 800) return 3;
    if (width >= 500) return 2;

    return 1;
  }


  function createMasonry() {
    const columnCount = getColumnCount();
    console.log("columnCount",columnCount,"creating masonry?")
    // Remove existing columns
    gallery.innerHTML = "";

    // Create columns
    const columns = [];

    for (let i = 0; i < columnCount; i++) {
      const column = document.createElement("div");

      column.className = "masonry-column";

      columns.push(column);
      gallery.appendChild(column);
    }

    // Add images to the shortest column
    galleryItems.forEach((item) => {
      const shortestColumn = columns.reduce((shortest, column) => {
        return column.offsetHeight < shortest.offsetHeight
          ? column
          : shortest;
      });

      shortestColumn.appendChild(item);
    });
  }

  // Wait until all images have loaded
  const imagePromises = galleryItems.map((item) => {
    const image = item.querySelector("img");

    if (image.complete) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
      window.addEventListener("resize", createMasonry);
      Promise.all(imagePromises).then(createMasonry);
  });
}