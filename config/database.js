require('dotenv').config();
const mysql = require('mysql2/promise');
const { URL } = require('url');

const createPool = (connectionUrl) => {
    if (!connectionUrl) return null;
    try {
        const url = new URL(connectionUrl);
        return mysql.createPool({
            host: url.hostname, user: url.username, password: url.password,
            database: url.pathname.substring(1), port: url.port || 3306,
            ssl: { rejectUnauthorized: true },
            waitForConnections: true, connectionLimit: 1, queueLimit: 0, 
            connectTimeout: 20000, enableKeepAlive: true
        });
    } catch (error) { return null; }
};

// ONLY Cart Pool here
const pools = {
    carts: createPool(process.env.DB_CARTS_URL)
};

module.exports = pools;