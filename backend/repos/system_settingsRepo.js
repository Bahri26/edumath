const knex = require('../db/knex');
const TABLE = 'system_settings';
const PK = 'setting_id';
const KEY = 'setting_key';

async function findAll({ page = 1, limit = 20, q, filters = {}, sort } = {}) {
  const offset = (page - 1) * limit;
  const qb = knex(TABLE).select('*');
  if (q) qb.where(KEY, 'like', '%' + q + '%');
  Object.entries(filters).forEach(([k, v]) => qb.andWhere(k, v));
  if (sort) {
    const [col, dir] = sort.split('.');
    qb.orderBy(col, dir === 'desc' ? 'desc' : 'asc');
  } else {
    qb.orderBy(PK, 'desc');
  }
  const rows = await qb.limit(limit).offset(offset);
  const [{ count } = { count: 0 }] = await knex(TABLE).count({ count: '*' });
  return { rows, total: Number(count) };
}

async function findById(id) { return knex(TABLE).where({ [PK]: id }).first(); }
async function findByKey(key) { return knex(TABLE).where({ [KEY]: key }).first(); }
async function create(data) { const [id] = await knex(TABLE).insert(data); return findById(id); }
async function update(id, data) { await knex(TABLE).where({ [PK]: id }).update(data); return findById(id); }
async function remove(id) { return knex(TABLE).where({ [PK]: id }).del(); }

async function upsertByKey(settingKey, settingValue) {
  const existing = await findByKey(settingKey);
  if (existing?.[PK]) {
    await knex(TABLE).where({ [PK]: existing[PK] }).update({ setting_value: settingValue });
    return findById(existing[PK]);
  }

  const [id] = await knex(TABLE).insert({ setting_key: settingKey, setting_value: settingValue });
  return findById(id);
}

module.exports = { findAll, findById, findByKey, create, update, remove, upsertByKey };
