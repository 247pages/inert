// Menu toggle function
function toggleMenu() {
  const menuItems = document.getElementById("menu-items");
  menuItems.classList.toggle("show");
}

// Scroll-based animation for services section
window.addEventListener('scroll', () => {
  const serviceSection = document.querySelector('.services');
  const servicePosition = serviceSection.getBoundingClientRect().top;
  const screenPosition = window.innerHeight / 1.2;

  if (servicePosition < screenPosition) {
    serviceSection.style.animation = 'slideUp 1s ease-in-out forwards';
  }
});

// Lazy Loading Functionality
document.addEventListener("DOMContentLoaded", function () {
  const lazyImages = document.querySelectorAll('.lazy-thumbnail');

  const lazyLoad = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.parentElement.parentElement.getAttribute('data-src');
        img.src = src;
        img.onload = () => img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  };

  const imageObserver = new IntersectionObserver(lazyLoad, {
    rootMargin: "0px 0px 200px 0px",
    threshold: 0.1
  });

  lazyImages.forEach(image => {
    imageObserver.observe(image);
  });
});

// Viewport Animation for Highlight Items
const highlightItems = document.querySelectorAll('.highlight-item');

const revealOnScroll = (entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
};

const sectionObserver = new IntersectionObserver(revealOnScroll, {
  threshold: 0.2
});

highlightItems.forEach(item => {
  sectionObserver.observe(item);
});

// Viewport Animation for Community Section
const communitySection = document.querySelector('.community');

const communityReveal = (entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-community');
      observer.unobserve(entry.target);
    }
  });
};

const communityObserver = new IntersectionObserver(communityReveal, {
  threshold: 0.3
});

if (communitySection) {
  communityObserver.observe(communitySection);
}



