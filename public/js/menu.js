let menuOpen = false;

const navMenuIcon = document.querySelector('.navbar .fas');
navMenuIcon.addEventListener('click', function (event) {
    event.stopPropagation();
    toggleMenu();
});

function openMenu() {
    menuOpen = true;
    const menuEl = document.getElementById('menu');
    menuEl.classList.add('open');
}

function closeMenu() {
    menuOpen = false;
    const menuEl = document.getElementById('menu');
    menuEl.classList.remove('open');
}

function toggleMenu() {
    if (menuOpen) {
        closeMenu();
    } else {
        openMenu();
    }
}

document.addEventListener('click', function (event) {
    const menuEl = document.getElementById('menu');
    if (!menuEl.contains(event.target) && !navMenuIcon.contains(event.target) && menuOpen) {
        closeMenu();
    }
});