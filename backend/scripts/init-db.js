const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const schemaPath = path.join(__dirname, '../../database/schema.sql');

if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not defined in .env');
    process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});

async function initDb() {
    try {
        console.log('Reading schema file...');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Connecting to database...');
        const client = await pool.connect();

        try {
            console.log('Executing schema...');
            await client.query(schema);
            console.log('Database initialized successfully!');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initDb();
