const knex = require('../db/knex');
const TABLE = 'learning_paths';

let learningPathsColumnsCache = null;

async function getColumns() {
  if (learningPathsColumnsCache) return learningPathsColumnsCache;
  const info = await knex(TABLE).columnInfo();
  learningPathsColumnsCache = new Set(Object.keys(info || {}));
  return learningPathsColumnsCache;
}

async function getPkColumn() {
  const cols = await getColumns();
  if (cols.has('path_id')) return 'path_id';
  if (cols.has('id')) return 'id';
  return 'path_id';
}

async function findAll({ page = 1, limit = 20, q, filters = {}, sort } = {}) {
  const offset = (page - 1) * limit;
  const cols = await getColumns();
  const pk = await getPkColumn();
  const qb = knex(TABLE).select('*');
  if (q) {
    if (cols.has('path_name')) qb.where('path_name', 'like', '%' + q + '%');
    else qb.where(pk, 'like', '%' + q + '%');
  }
  Object.entries(filters).forEach(([k, v]) => qb.andWhere(k, v));
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
  const pk = await getPkColumn();
  return knex(TABLE).where({ [pk]: id }).first();
}

async function create(data) {
  const [id] = await knex(TABLE).insert(data);
  return findById(id);
}

async function update(id, data) {
  const pk = await getPkColumn();
  await knex(TABLE).where({ [pk]: id }).update(data);
  return findById(id);
}

async function remove(id) {
  const pk = await getPkColumn();
  return knex(TABLE).where({ [pk]: id }).del();
}

module.exports = { findAll, findById, create, update, remove };
