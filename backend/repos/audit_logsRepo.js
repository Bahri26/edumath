const knex = require('../db/knex');
const TABLE = 'audit_logs';

async function findAll({ page = 1, limit = 20, q, filters = {}, sort } = {}) {
  const offset = (page - 1) * limit;
  const qb = knex(TABLE).select('*');
  // determine primary key column dynamically and guard searches
  const colInfo = await knex(TABLE).columnInfo();
  const cols = Object.keys(colInfo || {});
  const pk = cols.includes('id') ? 'id' : (cols.includes('audit_log_id') ? 'audit_log_id' : (cols.includes('log_id') ? 'log_id' : cols[0]));

  if (q) {
    qb.where(function() {
      if (cols.includes('message')) this.where('message', 'like', '%' + q + '%');
      if (cols.includes('audit_log_id')) this.orWhere('audit_log_id', 'like', '%' + q + '%');
      if (cols.includes('log_id')) this.orWhere('log_id', 'like', '%' + q + '%');
      if (cols.includes('id')) this.orWhere('id', 'like', '%' + q + '%');
    });
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

  const mapped = rows.map(r => {
    const out = Object.assign({}, r);
    if (out.audit_log_id && !out.id) out.id = out.audit_log_id;
    return out;
  });

  return { rows: mapped, total: Number(count) };
}

async function findById(id) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.audit_log_id ? 'audit_log_id' : 'id');
  return knex(TABLE).where({ [pk]: id }).first();
}
async function create(data) {
  const [insertId] = await knex(TABLE).insert(data);
  return findById(insertId);
}
async function update(id, data) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.audit_log_id ? 'audit_log_id' : 'id');
  await knex(TABLE).where({ [pk]: id }).update(data);
  return findById(id);
}
async function remove(id) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.audit_log_id ? 'audit_log_id' : 'id');
  return knex(TABLE).where({ [pk]: id }).del();
}

module.exports = { findAll, findById, create, update, remove };
