require('dotenv').config();
const config = require('../knexfile');
const env = process.env.NODE_ENV || 'development';
const selectedConfig = config[env] || config.development;
const knex = require('knex')(selectedConfig);
module.exports = knex;
