const knex = require('../db/knex');
const TABLE = 'courses';

async function findAll({ page = 1, limit = 20, q, filters = {}, sort } = {}) {
  const offset = (page - 1) * limit;
  const qb = knex(TABLE).select('*');
  // determine primary key column dynamically
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.course_id ? 'course_id' : 'id');
  if (q) qb.where(function() {
    this.where('id', 'like', '%' + q + '%').orWhere('course_id', 'like', '%' + q + '%').orWhere('course_name', 'like', '%' + q + '%');
  });
  Object.entries(filters).forEach(([k, v]) => qb.andWhere(k, v));
  if (sort) {
    const [col, dir] = sort.split('.');
    qb.orderBy(col, dir === 'desc' ? 'desc' : 'asc');
  } else {
    qb.orderBy(pk, 'desc');
  }
  const rows = await qb.limit(limit).offset(offset);
  const [{ count } = { count: 0 }] = await knex(TABLE).count({ count: '*' });
  // Normalize possible column names (some DBs use course_id/course_name)
  const mapped = rows.map(r => {
    const out = Object.assign({}, r);
    if (out.course_id && !out.id) out.id = out.course_id;
    if (out.course_name && !out.title) out.title = out.course_name;
    return out;
  });
  return { rows: mapped, total: Number(count) };
}

async function findById(id) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.course_id ? 'course_id' : 'id');
  return knex(TABLE).where({ [pk]: id }).first();
}
async function create(data) { const [insertId] = await knex(TABLE).insert(data); return findById(insertId); }
async function update(id, data) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.course_id ? 'course_id' : 'id');
  await knex(TABLE).where({ [pk]: id }).update(data);
  return findById(id);
}
async function remove(id) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.course_id ? 'course_id' : 'id');
  return knex(TABLE).where({ [pk]: id }).del();
}

module.exports = { findAll, findById, create, update, remove };
