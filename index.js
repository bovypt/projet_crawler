const axios = require('axios');
const cheerio = require('cheerio');

class WebCrawler {
    constructor(options = {}) {
        this.visitedUrls = new Set();
        this.maxDepth = options.maxDepth || 2;
        this.maxPages = options.maxPages || 100;
        this.delay = options.delay || 1000; 
        this.baseUrl = options.baseUrl || '';
        this.results = [];
    }

    normalizeUrl(url) {
        try {
            if (!url.startsWith('http')) {
                if (url.startsWith('/')) {
                    return new URL(url, this.baseUrl).href;
                }
                return new URL(`/${url}`, this.baseUrl).href;
            }
            return url;
        } catch (error) {
            console.error(`Error normalizing URL ${url}:`, error.message);
            return null;
        }
    }

    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            const baseUrlObj = new URL(this.baseUrl);
            return urlObj.hostname === baseUrlObj.hostname;
        } catch {
            return false;
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    extractData($, url) {
        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || '';
        const h1 = $('h1').first().text().trim();
        const links = $('a')
            .map((i, el) => $(el).attr('href'))
            .get()
            .filter(href => href && !href.startsWith('#'));

        return {
            url,
            title,
            description,
            h1,
            links
        };
    }

    async crawlUrl(url, depth = 0) {
        if (depth > this.maxDepth || this.visitedUrls.size >= this.maxPages) {
            return;
        }

        const normalizedUrl = this.normalizeUrl(url);
        if (!normalizedUrl || this.visitedUrls.has(normalizedUrl) || !this.isValidUrl(normalizedUrl)) {
            return;
        }

        this.visitedUrls.add(normalizedUrl);
        console.log(`Crawling: ${normalizedUrl} (depth: ${depth})`);

        try {
            await this.sleep(this.delay);
            const response = await axios.get(normalizedUrl);
            const $ = cheerio.load(response.data);
            
            const pageData = this.extractData($, normalizedUrl);
            this.results.push(pageData);

            for (const link of pageData.links) {
                const nextUrl = this.normalizeUrl(link);
                if (nextUrl && !this.visitedUrls.has(nextUrl)) {
                    await this.crawlUrl(nextUrl, depth + 1);
                }
            }
        } catch (error) {
            console.error(`Error crawling ${normalizedUrl}:`, error.message);
        }
    }

    async start(url) {
        this.baseUrl = url;
        this.visitedUrls.clear();
        this.results = [];
        
        console.log(`Starting crawler for: ${url}`);
        console.log(`Max depth: ${this.maxDepth}`);
        console.log(`Max pages: ${this.maxPages}`);
        
        await this.crawlUrl(url);
        
        console.log('\nCrawling completed!');
        console.log(`Pages crawled: ${this.visitedUrls.size}`);
        
        return this.results;
    }
}

const crawler = new WebCrawler({
    maxDepth: 2,
    maxPages: 50,
    delay: 1000
});

const targetUrl = 'https://nodejs.org/en';

crawler.start(targetUrl)
    .then(results => {
        console.log('\nResults:');
        console.log(JSON.stringify(results, null, 2));
    })
    .catch(error => {
        console.error('Error:', error);
    }); 