// Viewport animation for sections
const sections = document.querySelectorAll('.about-section, .platform-features, .mission, .inert-section');

const revealSection = (entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
};

const sectionObserver = new IntersectionObserver(revealSection, {
  threshold: 0.2
});

sections.forEach(section => {
  sectionObserver.observe(section);
});
