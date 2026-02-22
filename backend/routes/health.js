const router = require('express').Router();
const mongoose = require('mongoose');
const { version, name } = require('../package.json');

const startTime = Date.now();
const readyStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
};

router.get('/', async (req, res) => {
    const dbState = readyStates[mongoose.connection.readyState] || 'unknown';
    const uptimeSeconds = Math.round(process.uptime());

    // Optional ping to DB
    let dbPingMs = null;
    try {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        dbPingMs = Date.now() - start;
    } catch (err) {
        dbPingMs = null;
    }

    res.json({
        status: 'ok',
        service: name,
        version,
        time: new Date().toISOString(),
        uptimeSeconds,
        db: {
            status: dbState,
            host: mongoose.connection.host,
            name: mongoose.connection.name,
            pingMs: dbPingMs,
        },
        env: process.env.NODE_ENV || 'development',
        startedAt: new Date(startTime).toISOString(),
    });
});

module.exports = router;

