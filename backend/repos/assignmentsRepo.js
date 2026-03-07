const knex = require('../db/knex');
const TABLE = 'assignments';

async function findAll({ page = 1, limit = 20, q, filters = {}, sort } = {}) {
  const offset = (page - 1) * limit;
  const qb = knex(TABLE).select('*');
  // determine primary key column dynamically (some DBs use assignment_id)
  let pk = 'id';
  try {
    const colInfo = await knex(TABLE).columnInfo();
    pk = colInfo.id ? 'id' : (colInfo.assignment_id ? 'assignment_id' : 'id');
    if (q) {
      qb.where(function() {
        if (colInfo.id) this.where('id', 'like', '%' + q + '%');
        if (colInfo.assignment_id) this.orWhere('assignment_id', 'like', '%' + q + '%');
        if (colInfo.title) this.orWhere('title', 'like', '%' + q + '%');
        if (colInfo.name) this.orWhere('name', 'like', '%' + q + '%');
      });
    }
    Object.entries(filters).forEach(([k, v]) => { if (colInfo[k]) qb.andWhere(k, v); });
  } catch (e) {
    if (q) qb.where('id', 'like', '%' + q + '%');
  }

  if (sort) {
    const [col, dir] = sort.split('.');
    qb.orderBy(col, dir === 'desc' ? 'desc' : 'asc');
  } else {
    qb.orderBy(pk, 'desc');
  }
  const rows = await qb.limit(limit).offset(offset);
  const [{ count } = { count: 0 }] = await knex(TABLE).count({ count: '*' });

  // normalize common column names to id/title
  const mapped = rows.map(r => {
    const out = Object.assign({}, r);
    if (out.assignment_id && !out.id) out.id = out.assignment_id;
    if (out.name && !out.title) out.title = out.name;
    return out;
  });

  return { rows: mapped, total: Number(count) };
}

async function findById(id) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.assignment_id ? 'assignment_id' : 'id');
  return knex(TABLE).where({ [pk]: id }).first();
}
async function create(data) {
  const [insertId] = await knex(TABLE).insert(data);
  return findById(insertId);
}
async function update(id, data) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.assignment_id ? 'assignment_id' : 'id');
  await knex(TABLE).where({ [pk]: id }).update(data);
  return findById(id);
}
async function remove(id) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.assignment_id ? 'assignment_id' : 'id');
  return knex(TABLE).where({ [pk]: id }).del();
}

module.exports = { findAll, findById, create, update, remove };
