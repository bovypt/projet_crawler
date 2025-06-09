// Connexion WebSocket
const socket = io();

// Éléments du DOM
const statusContainer = document.getElementById('crawl-status');
const urlInput = document.getElementById('url-input');
const startButton = document.getElementById('start-crawl');

console.log('Initialisation du crawler.js');
console.log('Socket:', socket);
console.log('Status Container:', statusContainer);
console.log('URL Input:', urlInput);
console.log('Start Button:', startButton);

// Fonction pour ajouter un message de statut
function addStatusMessage(message, type = 'info', archiveUrl = null) {
    console.log('Ajout message:', message, 'type:', type);
    updateDebugInfo('event', `${type}: ${message}`);
    
    const messageElement = document.createElement('div');
    messageElement.className = `status-message ${type}`;
    
    const messageContent = document.createElement('div');
    messageContent.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    messageElement.appendChild(messageContent);

    // Ajouter un bouton de téléchargement si une archive est disponible
    if (archiveUrl) {
        const downloadButton = document.createElement('a');
        downloadButton.href = archiveUrl;
        downloadButton.className = 'download-button';
        downloadButton.textContent = 'Télécharger l\'archive';
        downloadButton.target = '_blank';
        messageElement.appendChild(downloadButton);
    }

    statusContainer.insertBefore(messageElement, statusContainer.firstChild);
}

// Écouteur d'événements pour le bouton de démarrage
startButton.addEventListener('click', async () => {
    console.log('Bouton cliqué');
    const url = urlInput.value.trim();
    console.log('URL saisie:', url);
    
    if (!url) {
        addStatusMessage('Veuillez entrer une URL', 'error');
        return;
    }

    try {
        console.log('Envoi de la requête au serveur');
        updateDebugInfo('event', `Envoi de la requête pour ${url}`);
        
        const response = await fetch('/crawl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                socketId: socket.id
            }),
        });

        console.log('Réponse reçue:', response);
        const data = await response.json();
        console.log('Données reçues:', data);
        
        if (response.ok) {
            addStatusMessage(`Démarrage du crawling pour ${url}`, 'success');
        } else {
            if (data.error === 'URL already processed') {
                const processedDate = new Date(data.processedAt).toLocaleString();
                addStatusMessage(`Cette URL a déjà été traitée le ${processedDate}`, 'error');
            } else {
                addStatusMessage(`Erreur: ${data.error}`, 'error');
            }
        }
    } catch (error) {
        console.error('Erreur lors de la requête:', error);
        addStatusMessage(`Erreur de connexion: ${error.message}`, 'error');
    }
});

// Écouteurs d'événements WebSocket
socket.on('connect', () => {
    console.log('Socket connecté');
    updateDebugInfo('socket', 'Connecté');
    addStatusMessage('Connecté au serveur', 'success');
});

socket.on('disconnect', () => {
    console.log('Socket déconnecté');
    updateDebugInfo('socket', 'Déconnecté');
    addStatusMessage('Déconnecté du serveur', 'error');
});

socket.on('crawl-status', (data) => {
    console.log('Status reçu:', data);
    updateDebugInfo('event', `Status: ${data.message}`);
    addStatusMessage(data.message, data.type || 'info', data.archiveUrl);
});

socket.on('crawl-error', (error) => {
    console.log('Erreur reçue:', error);
    updateDebugInfo('event', `Erreur: ${error.message}`);
    addStatusMessage(`Erreur: ${error.message}`, 'error');
}); 