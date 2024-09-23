import { getThemeFromFirestore, saveThemeToFirestore } from './firestore.js';

let activeTheme = 'default';

function setTheme(theme) {
    activeTheme = theme;
    document.getElementById('theme').href = `themes/theme-${theme}.css`;
}

document.getElementById('themeSelect').addEventListener('change', async e => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    await saveThemeToFirestore(newTheme);
});

auth.onAuthStateChanged(user => {
    if (user) {
        getThemeFromFirestore();
    }
});

export { setTheme, activeTheme };