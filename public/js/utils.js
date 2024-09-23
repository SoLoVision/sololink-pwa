function createSlug(artist, title) {
    return encodeURIComponent(artist.toLowerCase().replace(/\s+/g, '-').replace(/,/g, '-')) + '-' +
        encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-').replace(/,/g, '-'));
}

async function getMostCommonColor(imgUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imgUrl;

        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const colorCount = {};

            for (let i = 0; i < imageData.length; i += 4) {
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                if (r + g + b < 10) continue;
                const rgb = `${r},${g},${b}`;
                colorCount[rgb] = (colorCount[rgb] || 0) + 1;
            }

            const mostCommonColor = Object.keys(colorCount).sort((a, b) => colorCount[b] - colorCount[a])[0];
            resolve(mostCommonColor ? `rgb(${mostCommonColor})` : 'rgb(0,0,0)');
        };

        img.onerror = function () {
            reject("Error loading image");
        };
    });
}

export { createSlug, getMostCommonColor };