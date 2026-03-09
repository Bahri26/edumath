const knex = require('../db/knex');
const TABLE = 'shop_items';

let shopMetaCache = null;
async function getShopMeta() {
  if (shopMetaCache) return shopMetaCache;
  const has = await knex.schema.hasTable(TABLE);
  if (!has) {
    shopMetaCache = { pk: 'id' };
    return shopMetaCache;
  }
  const info = await knex(TABLE).columnInfo();
  const cols = new Set(Object.keys(info || {}));
  const pk = cols.has('shop_item_id')
    ? 'shop_item_id'
    : cols.has('id')
    ? 'id'
    : Array.from(cols)[0];
  shopMetaCache = { pk };
  return shopMetaCache;
}

async function findAll({ page = 1, limit = 20, q, filters = {}, sort } = {}) {
  const { pk } = await getShopMeta();
  const offset = (page - 1) * limit;
  const qb = knex(TABLE).select('*');
  if (q) qb.where(pk, 'like', '%' + q + '%');
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
  const { pk } = await getShopMeta();
  return knex(TABLE).where({ [pk]: id }).first();
}
async function create(data) {
  const { pk } = await getShopMeta();
  const [id] = await knex(TABLE).insert(data);
  return findById(id);
}
async function update(id, data) {
  const { pk } = await getShopMeta();
  await knex(TABLE).where({ [pk]: id }).update(data);
  return findById(id);
}
async function remove(id) {
  const { pk } = await getShopMeta();
  return knex(TABLE).where({ [pk]: id }).del();
}

module.exports = { findAll, findById, create, update, remove };
