#!/usr/bin/env node
/**
 * Gmail OAuth2 Setup Helper
 * 
 * Run this ONCE to get a refresh token for sending emails via Gmail API.
 * 
 * Prerequisites:
 *   1. Enable Gmail API in Google Cloud Console
 *   2. Create OAuth2 credentials (Desktop App type)
 *   3. Download the credentials JSON
 *   4. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env
 * 
 * Usage: node setup-gmail-oauth.js
 */

require('dotenv').config();
const http = require('http');
const url = require('url');
const { google } = require('googleapis');

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('\n❌ Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET in .env\n');
    console.log('Steps to get them:');
    console.log('1. Go to https://console.cloud.google.com/apis/credentials');
    console.log('2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"');
    console.log('3. Application type: "Web application"');
    console.log('4. Add Authorized redirect URI: http://localhost:3001/oauth2callback');
    console.log('5. Copy Client ID and Client Secret to .env as:');
    console.log('   GMAIL_CLIENT_ID=your_client_id');
    console.log('   GMAIL_CLIENT_SECRET=your_client_secret\n');
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
    prompt: 'consent',
});

console.log('\n🔐 Gmail OAuth2 Setup\n');
console.log('1. Open this URL in your browser:\n');
console.log(`   ${authUrl}\n`);
console.log('2. Sign in with: evolve.cce@gmail.com');
console.log('3. Grant permission to send emails');
console.log('4. You will be redirected back here automatically\n');
console.log('⏳ Waiting for authorization...\n');

// Start a temporary server to catch the OAuth callback
const server = http.createServer(async (req, res) => {
    const query = url.parse(req.url, true).query;

    if (query.code) {
        try {
            const { tokens } = await oauth2Client.getToken(query.code);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <html><body style="font-family: sans-serif; text-align: center; padding: 60px; background: #0f0f1e; color: #fff;">
                    <h1 style="color: #22c55e;">✅ Authorization Successful!</h1>
                    <p>You can close this tab and return to the terminal.</p>
                </body></html>
            `);

            console.log('✅ Authorization successful!\n');
            console.log('Add this to your .env file:\n');
            console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);

            server.close();
            process.exit(0);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error getting tokens');
            console.error('❌ Error:', err.message);
            server.close();
            process.exit(1);
        }
    }
});

server.listen(3001, () => {
    console.log('📡 Callback server listening on http://localhost:3001\n');
});
