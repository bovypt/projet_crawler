const mongoose = require('mongoose');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'database' },
    transports: [
        new winston.transports.Console()
    ]
});

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/webcrawler';
        const conn = await mongoose.connect(mongoUri);

        logger.info(`MongoDB connecté: ${conn.connection.host}`);
    } catch (error) {
        logger.error('Erreur de connexion à MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB; 