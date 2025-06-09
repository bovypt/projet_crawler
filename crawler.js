const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

// Configuration du logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'crawler' },
    transports: [
        new winston.transports.Console(),
        new ElasticsearchTransport({
            level: 'info',
            index: 'crawler-logs',
            clientOpts: { node: 'http://elasticsearch-service:9200' }
        })
    ]
});

/**
 * Fonction utilitaire pour crawler une URL et archiver le résultat
 * @param {string} url
 * @param {object} redis - instance redis connectée
 * @param {string} downloadDir - dossier où stocker les fichiers
 * @returns {object} données extraites et nom de l'archive
 */
async function crawlUrl(url, redis, downloadDir) {
    try {
        // Vérifier si l'URL a déjà été traitée dans Redis
        const isProcessed = await redis.get(`url:${url}`);
        if (isProcessed) {
            logger.info(`URL déjà traitée: ${url}`);
            return { alreadyProcessed: true };
        }
        logger.info(`Traitement de l'URL: ${url}`);
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        };
        const response = await axios.get(url, { 
            headers,
            timeout: 30000,
            validateStatus: status => status >= 200 && status < 500
        });
        if (response.status >= 400) {
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
        }
        const $ = cheerio.load(response.data);
        const data = {
            url,
            title: $('title').text(),
            description: $('meta[name="description"]').attr('content'),
            h1: $('h1').first().text(),
            links: $('a').map((i, el) => $(el).attr('href')).get(),
            content: response.data
        };
        // Sauvegarder le contenu
        const fileName = `${Date.now()}-${url.replace(/[^a-z0-9]/gi, '_')}.html`;
        const filePath = path.join(downloadDir, fileName);
        await fs.ensureDir(downloadDir);
        await fs.writeFile(filePath, response.data);
        // Créer le ZIP
        const zipPath = path.join(downloadDir, `${fileName}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip');
        output.on('close', () => {
            logger.info(`Archive créée: ${zipPath}`);
        });
        archive.pipe(output);
        archive.file(filePath, { name: fileName });
        await archive.finalize();
        // Marquer l'URL comme traitée
        await redis.set(`url:${url}`, 'processed', { EX: 86400 });
        logger.info(`URL traitée avec succès: ${url}`);
        return { ...data, archiveName: `${fileName}.zip` };
    } catch (error) {
        logger.error(`Erreur lors du traitement de ${url}:`, error);
        throw error;
    }
}

module.exports = crawlUrl; 