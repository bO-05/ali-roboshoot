require('dotenv').config(); // Load .env variables
// const express = require('express'); // No longer needed
const mysql = require('mysql2/promise'); // Use promise version
// const cors = require('cors'); // Will handle CORS via headers
// const serverless = require('serverless-http'); // No longer needed

console.log('Direct FC handler loading...');

// --- Database Connection Pool (Keep this part) ---
console.log('Creating database connection pool...');
let dbPool;
try {
    dbPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 15000,
        ssl: false
    });
    console.log('Database connection pool created successfully.');
} catch (poolError) {
    console.error('FATAL: Error creating database connection pool:', poolError);
    // Store the error to report it in the handler if pool is unavailable
    dbPool = null; // Ensure dbPool is null if creation failed
}

// --- Main Function Compute Handler ---
module.exports.handler = async (req, resp, context) => {
    console.log(`Handler invoked. Method: ${req.method}, Path: ${req.path}`);

    // Basic CORS Headers (Adjust origin if needed for production)
    resp.setHeader('Access-Control-Allow-Origin', '*');
    resp.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    resp.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS preflight request.');
        resp.setStatusCode(204); // No Content
        resp.send('');
        return;
    }

    // Check if pool is available
    if (!dbPool) {
        console.error('Handler error: Database pool is not available.');
        resp.setStatusCode(500);
        resp.setHeader('Content-Type', 'application/json');
        resp.send(JSON.stringify({ message: "Database configuration error" }));
        return;
    }

    let connection;
    try {
        // --- Route based on method and path ---
        if (req.method === 'GET' && req.path === '/scores') {
            console.log('Routing to GET /scores');
            const limit = parseInt(req.queries.limit) || 10;
            console.log('Attempting to get connection...');
            connection = await dbPool.getConnection();
            console.log('Got connection. Executing SELECT...');
            const [rows] = await connection.query(
                'SELECT player_initials, score FROM high_scores ORDER BY score DESC LIMIT ?',
                [limit]
            );
            console.log('SELECT successful. Sending response.');
            resp.setStatusCode(200);
            resp.setHeader('Content-Type', 'application/json');
            resp.send(JSON.stringify(rows));

        } else if (req.method === 'POST' && req.path === '/scores') {
            console.log('Routing to POST /scores');
            let body;
            try {
                body = JSON.parse(req.body.toString());
                console.log('Request body parsed:', body);
            } catch (parseError) {
                console.error('Error parsing request body:', parseError);
                resp.setStatusCode(400);
                resp.setHeader('Content-Type', 'application/json');
                resp.send(JSON.stringify({ message: "Invalid JSON body" }));
                return;
            }

            const { initials, score } = body;
            if (typeof score !== 'number') {
                console.log('Validation failed: Score not a number.');
                resp.setStatusCode(400);
                resp.setHeader('Content-Type', 'application/json');
                resp.send(JSON.stringify({ message: "Score must be a number" }));
                return;
            }
            const playerInitials = (typeof initials === 'string' && initials.length <= 3) ? initials.toUpperCase() : 'AAA';

            console.log('Attempting to get connection...');
            connection = await dbPool.getConnection();
            console.log('Got connection. Executing INSERT...');
            const [result] = await connection.query(
                'INSERT INTO high_scores (player_initials, score) VALUES (?, ?)',
                [playerInitials, score]
            );
            console.log('INSERT successful. Insert ID:', result.insertId);
            resp.setStatusCode(201);
            resp.setHeader('Content-Type', 'application/json');
            resp.send(JSON.stringify({ id: result.insertId, player_initials: playerInitials, score }));

        } else {
            console.log('Route not found.');
            resp.setStatusCode(404);
            resp.setHeader('Content-Type', 'application/json');
            resp.send(JSON.stringify({ message: "Not Found" }));
        }

    } catch (error) {
        console.error('Handler error:', error.message, error.stack);
        resp.setStatusCode(500);
        resp.setHeader('Content-Type', 'application/json');
        resp.send(JSON.stringify({ message: "Internal Server Error", error: error.message }));
    } finally {
        if (connection) {
            console.log('Releasing connection...');
            connection.release();
            console.log('Connection released.');
        }
        console.log('Handler finished.');
    }
};

console.log('Direct FC handler export complete.'); 