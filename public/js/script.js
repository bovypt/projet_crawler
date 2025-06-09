async function crawlUrl() {
    const urlInput = document.getElementById('url');
    const resultDiv = document.getElementById('result');
    const url = urlInput.value;

    if (!url) {
        resultDiv.textContent = 'Veuillez entrer une URL valide';
        return;
    }

    try {
        resultDiv.textContent = 'Crawling en cours...';
        const response = await fetch('/crawl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();
        
        if (response.ok) {
            resultDiv.textContent = `Crawling terminé pour ${url}`;
            if (data.data && data.data.archiveUrl) {
                resultDiv.innerHTML += `<br><a href="/download/${data.data.archiveUrl}">Télécharger le fichier ZIP</a>`;
            }
        } else {
            resultDiv.textContent = `Erreur: ${data.error}`;
        }
    } catch (error) {
        resultDiv.textContent = `Erreur: ${error.message}`;
    }
} 