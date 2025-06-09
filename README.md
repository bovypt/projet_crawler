# Web Crawler

Un crawler web simple qui permet de récupérer le contenu des pages web et de les sauvegarder localement.

## Fonctionnalités

- Crawling de pages web
- Sauvegarde du contenu HTML
- Création d'archives ZIP
- Interface web intuitive
- Historique des pages crawlees
- Recherche dans l'historique
- Téléchargement des archives

## Prérequis

- Node.js (v18 ou supérieur)
- Docker et Docker Compose
- Kubernetes (optionnel)

## Installation

### 1. Cloner le projet

```bash
git clone <votre-repo>
cd projet_crawler
```

### 2. Installer les dépendances

```bash
npm install
```

## Démarrage

### Option 1 : Docker Compose

1. Démarrer les conteneurs :
```bash
docker-compose up -d
```

2. Accéder à l'application :
- Interface web : http://localhost:3002
- API : http://localhost:3002/api

### Option 2 : Kubernetes

1. Créer l'image Docker :
```bash
docker build -t webcrawler-api:latest .
```

2. Appliquer les configurations Kubernetes :
```bash
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/mongodb-service.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/api-service.yaml
```

3. Exposer le service API :
```bash
kubectl port-forward service/api 3002:3002
```

4. Accéder à l'application :
- Interface web : http://localhost:3002
- API : http://localhost:3002/api

## Utilisation

1. Ouvrez l'interface web dans votre navigateur
2. Entrez l'URL de la page à crawler
3. Cliquez sur "Crawler"
4. Attendez que le processus soit terminé
5. Téléchargez l'archive ZIP si nécessaire
6. Consultez l'historique pour voir toutes les pages crawlees

## API Endpoints

- `POST /crawl` : Crawler une page web
  - Body: `{ "url": "https://example.com" }`
  - Response: `{ "message": "Crawling terminé", "data": { ... } }`

- `GET /pages` : Obtenir l'historique des pages
  - Response: `[{ "url": "...", "title": "...", ... }]`

- `GET /download/:filename` : Télécharger une archive

## Structure du projet

```
projet_crawler/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── script.js
│   │   └── history.js
│   ├── index.html
│   └── history.html
├── k8s/
│   ├── api-deployment.yaml
│   ├── api-service.yaml
│   ├── mongodb-deployment.yaml
│   └── mongodb-service.yaml
├── index.js
├── package.json
├── Dockerfile
└── docker-compose.yml
```

## Développement

Pour lancer le projet en mode développement :

```bash
npm install
npm start
```

## Arrêt

### Docker Compose
```bash
docker-compose down
```

### Kubernetes
```bash
kubectl delete -f k8s/
```