 // Disable right-click (context menu) globally on the entire webpage
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  });

  // Disable long-press interactions on links and images
  const disableLongPress = (element) => {
    // Prevent long-press on mobile
    element.addEventListener('touchstart', function(e) {
      e.preventDefault();
    });

    // Prevent the middle-click (open in new tab) or shift-click (open in new window)
    element.addEventListener('click', function(e) {
      if (e.which === 2 || e.shiftKey) {
        e.preventDefault();
        alert("Opening in new tabs/windows is disabled.");
      }
    });
  };

  // Apply the disabling functions to all links and images
  document.querySelectorAll('a, img').forEach(function(el) {
    disableLongPress(el);
  });

  // Disable default browser action for long press globally (images, links, etc.)
  document.addEventListener('touchstart', function(e) {
    if (e.target.tagName === 'A' || e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

