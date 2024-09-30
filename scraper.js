// scraper.js
const sizeOf = require('image-size');
const axios = require('axios');
const puppeteer = require('puppeteer');

async function getImageDimensions(url) {
    // Hacer una solicitud HEAD para obtener las dimensiones de la imagen
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const img = Buffer.from(res.data, 'binary');
    const dimensions = sizeOf(img); // Necesitas instalar 'image-size' para esto.
    return dimensions;
}

async function scrapeMercadoLibre(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const data = await page.evaluate(async () => {
        const images = Array.from(document.querySelectorAll('img')).map(img => img.src).filter(Boolean);
        const kilometers = document.querySelector('span[id^=":Rkrslena9im:-value"]')?.innerText || 'Kilómetros no disponibles';
        const description = document.querySelector('meta[name="description"]')?.content || 'Descripción no disponible';

        return {
            images: images,
            kilometers: kilometers,
            description: description
        };
    });

    // Filtrar imágenes que son más pequeñas que 200 px por 150 px
    const validImages = [];
    for (const img of data.images) {
        try {
            const dimensions = await getImageDimensions(img);
            if (dimensions.width >= 200 && dimensions.height >= 150) {
                validImages.push(img);
            }
        } catch (error) {
            console.error(`Error al obtener dimensiones de la imagen: ${img}`, error);
        }
    }

    data.images = validImages;

    await browser.close();
    return data;
}

module.exports = scrapeMercadoLibre;
