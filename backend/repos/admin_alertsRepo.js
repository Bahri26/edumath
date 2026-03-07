const knex = require('../db/knex');
const TABLE = 'admin_alerts';

// Note: this table uses `alert_id` as primary key (see DB schema). Use that column name.
async function findAll({ page = 1, limit = 20, q, filters = {}, sort } = {}) {
  const offset = (page - 1) * limit;
  const qb = knex(TABLE).select('*');
  if (q) qb.where('alert_id', 'like', '%' + q + '%');
  Object.entries(filters).forEach(([k, v]) => qb.andWhere(k, v));
  if (sort) {
    const [col, dir] = sort.split('.');
    qb.orderBy(col, dir === 'desc' ? 'desc' : 'asc');
  } else {
    qb.orderBy('alert_id', 'desc');
  }
  const rows = await qb.limit(limit).offset(offset);
  const [{ count } = { count: 0 }] = await knex(TABLE).count({ count: '*' });
  return { rows, total: Number(count) };
}

async function findById(id) { return knex(TABLE).where({ alert_id: id }).first(); }
async function create(data) { const [insertId] = await knex(TABLE).insert(data); return findById(insertId); }
async function update(id, data) { await knex(TABLE).where({ alert_id: id }).update(data); return findById(id); }
async function remove(id) { return knex(TABLE).where({ alert_id: id }).del(); }

module.exports = { findAll, findById, create, update, remove };
