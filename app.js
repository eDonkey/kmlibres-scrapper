// app.js (modificación a la ruta /ads)
const express = require('express');
const mongoose = require('mongoose');
const scrapeMercadoLibre = require('./scraper');
const path = require('path');
const Ad = require('./ad'); // Asegúrate de importar el modelo

const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const PORT = 3000;

// Conectar a MongoDB
mongoose.connect('mongodb://admin:78895082b9a264f3b161f8bcfaef540641a459161aa30a6a@localhost:27017/miScraperDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a la base de datos MongoDB');
}).catch(err => {
    console.error('Error de conexión a MongoDB', err);
});

// Configura EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Ruta para la página principal
app.get('/', (req, res) => {
    res.render('index', { data: null });
});

// Ruta para realizar el scraping y guardar en MongoDB
// app.js (modificación en la ruta /scrape para incluir comentarios)
app.get('/scrape', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).send('URL es requerida');
    }

    const data = await scrapeMercadoLibre(url);

    if (data) {
        const adIdMatch = url.match(/MLA-(\d+)/);
        const adId = adIdMatch ? adIdMatch[1] : null;

        if (adId) {
            const newAd = new Ad({
                adId: adId,
                images: data.images,
                kilometers: data.kilometers,
                description: data.description,
                timestamp: new Date()
            });

            await newAd.save()
                .then(() => {
                    console.log('Anuncio guardado en MongoDB');
                })
                .catch(err => {
                    console.error('Error al guardar en MongoDB', err);
                });
        }

        res.render('index', { data: data }); // Redireccionar a "index" tras scrapear
    } else {
        res.status(500).send('Error al scrape');
    }
});

// Ruta para agregar un comentario
app.post('/ads/:adId/comments', async (req, res) => {
    const adId = req.params.adId;
    const { nickname, comment } = req.body; // Obtener apodo y comentario del formulario

    try {
        const ad = await Ad.findOne({ adId: adId });
        if (!ad) {
            return res.status(404).send('Anuncio no encontrado');
        }

        ad.comments.push({ nickname, comment, timestamp: new Date() }); // Agregar el comentario

        await ad.save();

        res.redirect(`/ads?page=1`); // Redirigir a la página de anuncios
    } catch (error) {
        console.error('Error al agregar comentario', error);
        res.status(500).send('Error al agregar comentario');
    }
});


// Ruta para consultar y mostrar los anuncios guardados
app.get('/ads', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Número de página, comenzando en 1
    const limit = 5; // Número de anuncios por página
    const skip = (page - 1) * limit; // Cómo omitir anuncios basados en la página

    try {
        const ads = await Ad.find().skip(skip).limit(limit); // Obtener anuncios paginados
        const totalAds = await Ad.countDocuments(); // Total de anuncios en la colección
        const totalPages = Math.ceil(totalAds / limit); // Total de páginas

        res.render('ads', { ads: ads, page: page, totalPages: totalPages }); // Pasar anuncios y datos de paginación a la vista
    } catch (error) {
        console.error('Error al obtener anuncios', error);
        res.status(500).send('Error al obtener anuncios');
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});