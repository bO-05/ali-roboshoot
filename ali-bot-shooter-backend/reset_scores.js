const path = require('path'); // Import path module
// Load .env variables from the script's directory
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const mysql = require('mysql2/promise'); // Use promise version

async function resetHighScores() {
    let connection;
    console.log('Attempting to connect to database...');

    try {
        // Create a single connection (pool not needed for a one-off script)

        // --- DEBUG: Log the connection details being used ---
        console.log("Attempting connection with:");
        console.log(`  Host: ${process.env.DB_HOST}`);
        console.log(`  User: ${process.env.DB_ACC}`);
        console.log(`  Password: ${process.env.DB_ACC_PASS ? '[Set]' : '[Not Set]'}`); // Don't log the actual password
        console.log(`  Database: ${process.env.DB_DATABASE}`);
        console.log(`  Port: ${process.env.DB_PORT || 3306}`);
        // ----------------------------------------------------

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_ACC,       // Use admin account username
            password: process.env.DB_ACC_PASS, // Use admin account password
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT || 3306,
            connectTimeout: 10000, // 10 second timeout
            ssl: false // Assuming SSL is not used based on server.js
        });
        console.log('Database connection successful.');

        console.log('Executing DELETE FROM high_scores...');
        const [result] = await connection.execute('DELETE FROM high_scores;');
        console.log(`Successfully deleted ${result.affectedRows} score(s).`);

    } catch (error) {
        console.error('Error during score reset:', error.message);
        if (error.code) {
            console.error(`Error Code: ${error.code}`);
        }
        // Exit with error code if something went wrong
        process.exitCode = 1;
    } finally {
        if (connection) {
            console.log('Closing database connection...');
            await connection.end();
            console.log('Connection closed.');
        }
    }
}

// Run the reset function
resetHighScores(); 