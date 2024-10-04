let deferredPrompt;

// Detect if the app is installed
const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

// Hide the download options and show the installed message if the app is already installed
if (isPWAInstalled) {
    document.getElementById('installPWA').style.display = 'none';
    document.querySelector('.download-btn').style.display = 'none';
    document.getElementById('downloadTitle').style.display = 'none';
    document.getElementById('installedMessage').classList.remove('hidden');
}

// PWA installation prompt logic
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installPWA').style.display = 'block';
});

document.getElementById('installPWA').addEventListener('click', () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the PWA installation');
            } else {
                console.log('User dismissed the PWA installation');
            }
            deferredPrompt = null;
        });
    }
});
