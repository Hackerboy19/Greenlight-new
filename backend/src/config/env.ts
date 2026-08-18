import dotenv from 'dotenv';
dotenv.config();

export const env = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'greenlight_db',
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'greenlight-jwt-secret-key-2026',
  GSC_PROPERTY_URI: process.env.GSC_PROPERTY_URI || 'sc-domain:greenlight.fsia.in',
  GSC_PRIMARY_HOST: process.env.GSC_PRIMARY_HOST || 'greenlight.fsia.in',
};
