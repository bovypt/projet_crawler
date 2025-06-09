const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const archiver = require('archiver');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).json({ error: err.message });
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

console.log('Chemin du dossier public:', path.join(__dirname, 'public'));
console.log('Contenu du dossier public:', fs.readdirSync(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    if (req.path === '/' || req.path.startsWith('/public/')) {
        const filePath = path.join(__dirname, 'public', req.path === '/' ? 'index.html' : req.path);
        console.log('Tentative d\'accès au fichier:', filePath);
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Fichier non trouvé:', filePath);
                next(err);
            } else {
                next();
            }
        });
    } else {
        next();
    }
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crawler', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connecté à MongoDB');
}).catch(err => {
    console.error('Erreur de connexion MongoDB:', err);
});

const Page = mongoose.model('Page', new mongoose.Schema({
    url: String,
    title: String,
    description: String,
    h1: String,
    links: [String],
    content: String,
    zipFile: String,
    crawledAt: { type: Date, default: Date.now }
}));

async function crawlUrl(url, downloadDir) {
    try {
        console.log(`Traitement de l'URL: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const data = {
            url,
            title: $('title').text(),
            description: $('meta[name="description"]').attr('content'),
            h1: $('h1').first().text(),
            links: $('a').map((i, el) => $(el).attr('href')).get(),
            content: response.data
        };

        const fileName = `${Date.now()}-${url.replace(/[^a-z0-9]/gi, '_')}.html`;
        const filePath = path.join(downloadDir, fileName);
        await fs.ensureDir(downloadDir);
        await fs.writeFile(filePath, response.data);

        const zipPath = path.join(downloadDir, `${fileName}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip');
        output.on('close', () => {
            console.log(`Archive créée: ${zipPath}`);
        });
        archive.pipe(output);
        archive.file(filePath, { name: fileName });
        await archive.finalize();

        return { ...data, archiveName: `${fileName}.zip` };
    } catch (error) {
        console.error(`Erreur lors du traitement de ${url}:`, error);
        throw error;
    }
}

app.post('/crawl', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const existingPage = await Page.findOne({ url });
        if (existingPage) {
            return res.status(400).json({ 
                error: 'URL already processed', 
                processedAt: existingPage.crawledAt 
            });
        }

        const downloadDir = path.join(__dirname, 'downloads');
        const crawlResult = await crawlUrl(url, downloadDir);
        
        const page = new Page({
            url,
            title: crawlResult.title,
            description: crawlResult.description,
            h1: crawlResult.h1,
            links: crawlResult.links,
            content: crawlResult.content,
            zipFile: crawlResult.archiveName
        });
        await page.save();

        res.json({ 
            message: `Crawling terminé pour ${url}`,
            data: {
                url: page.url,
                title: page.title,
                description: page.description,
                h1: page.h1,
                links: page.links,
                crawledAt: page.crawledAt,
                archiveUrl: page.zipFile
            }
        });
    } catch (error) {
        console.error('Erreur lors du crawling:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.get('/pages', async (req, res) => {
    try {
        const pages = await Page.find()
            .sort({ crawledAt: -1 })
            .limit(100);
        res.json(pages);
    } catch (error) {
        console.error('Erreur lors de la récupération des pages:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'downloads', filename);
    res.download(filePath, (err) => {
        if (err) {
            console.error('Erreur lors du téléchargement:', err);
            res.status(404).json({ error: 'Fichier non trouvé' });
        }
    });
});

app.get('/', (req, res) => {
    console.log('Accès à la page d\'accueil');
    const indexPath = path.join(__dirname, 'public', 'index.html');
    console.log('Chemin du fichier index:', indexPath);
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Erreur lors de l\'envoi du fichier index:', err);
            res.status(500).send('Erreur lors du chargement de la page');
        }
    });
});

const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Serveur démarré sur http://0.0.0.0:${port}`);
    console.log('Dossier public:', path.join(__dirname, 'public'));
    console.log('Dossier downloads:', path.join(__dirname, 'downloads'));
});

server.on('error', (error) => {
    console.error('Erreur du serveur:', error);
});

server.on('connection', (socket) => {
    console.log('Nouvelle connexion:', socket.remoteAddress);
}); 