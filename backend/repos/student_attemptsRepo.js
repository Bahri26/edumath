const knex = require('../db/knex');
const TABLE = 'student_attempts';

async function findAll({ page = 1, limit = 20, q, filters = {}, sort } = {}) {
  const offset = (page - 1) * limit;
  const qb = knex(TABLE).select('*');
  const colInfo = await knex(TABLE).columnInfo();
  const cols = Object.keys(colInfo || {});
  const pk = cols.includes('id') ? 'id' : (cols.includes('attempt_id') ? 'attempt_id' : cols[0]);

  if (q) {
    if (cols.includes('title')) qb.where('title', 'like', '%' + q + '%');
    else if (cols.includes('id')) qb.where('id', 'like', '%' + q + '%');
  }
  Object.entries(filters).forEach(([k, v]) => { if (cols.includes(k)) qb.andWhere(k, v); });
  if (sort) {
    const [col, dir] = sort.split('.');
    qb.orderBy(col, dir === 'desc' ? 'desc' : 'asc');
  } else {
    qb.orderBy(pk, 'desc');
  }
  const rows = await qb.limit(limit).offset(offset);
  const [{ count } = { count: 0 }] = await knex(TABLE).count({ count: '*' });
  return { rows, total: Number(count) };
}

async function findById(id) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.attempt_id ? 'attempt_id' : Object.keys(colInfo)[0]);
  return knex(TABLE).where({ [pk]: id }).first();
}
async function create(data) {
  const [insertId] = await knex(TABLE).insert(data);
  return findById(insertId);
}
async function update(id, data) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.attempt_id ? 'attempt_id' : Object.keys(colInfo)[0]);
  await knex(TABLE).where({ [pk]: id }).update(data);
  return findById(id);
}
async function remove(id) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.attempt_id ? 'attempt_id' : Object.keys(colInfo)[0]);
  return knex(TABLE).where({ [pk]: id }).del();
}

module.exports = { findAll, findById, create, update, remove };
