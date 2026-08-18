/**
 * Google Search Console API Authentication Service
 * Authenticates via Service Account with read-only search console scopes
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly'
];

let searchConsoleClient = null;
let authClient = null;

/**
 * Initializes and returns the authenticated Google Search Console client
 */
export function getSearchConsoleClient() {
  if (searchConsoleClient) {
    return searchConsoleClient;
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Handle escaped newlines in environment variable private key strings
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : null;

  if (!clientEmail || !privateKey) {
    console.warn('[GoogleAuth] Google Service Account credentials not provided in env. Archiver will run with simulation mode for local development.');
    return null;
  }

  try {
    authClient = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      SCOPES
    );

    searchConsoleClient = google.searchconsole({
      version: 'v1',
      auth: authClient
    });

    console.log(`[GoogleAuth] Initialized Google Search Console client for service account: ${clientEmail}`);
    return searchConsoleClient;
  } catch (error) {
    console.error('[GoogleAuth] Failed to initialize Search Console client:', error.message);
    return null;
  }
}

export default {
  getSearchConsoleClient,
  SCOPES
};
