require('dotenv').config();

module.exports = {
  development: {
    client: process.env.DB_CLIENT || 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'edumath',
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true
    },
    pool: { 
      min: 2, 
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000
    },
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' }
  },

  production: {
    client: 'mysql2',
    connection: async () => {
      // Google Cloud SQL Connector kullanarak bağlantı
      const Connector = require('@google-cloud/cloud-sql-connector').Connector;
      const connector = new Connector();

      const clientOpts = await connector.getOptions({
        instanceConnectionString: process.env.SQL_INSTANCE_CONNECTION_NAME,
        ipType: 'PUBLIC'
      });

      return {
        ...clientOpts,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      };
    },
    pool: { 
      min: 2, 
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    },
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' }
  }
};

