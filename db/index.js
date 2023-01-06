const { Client, Pool } = require('pg');

const config = {
  host: 'localhost',
  database: 'transfer',
  port: 5432,
  connectionTimeoutMillis: 120000,
  max: 5
};

const pool = new Pool(config);

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback);
  },
  connect: () => {
    return pool.connect();
  }
};
