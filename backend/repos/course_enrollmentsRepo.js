const knex = require('../db/knex');
const TABLE = 'course_enrollments';

async function findAll({ page = 1, limit = 20, q, filters = {}, sort } = {}) {
  const offset = (page - 1) * limit;
  const qb = knex(TABLE).select('*');
  // determine primary key column dynamically (some DBs use course_enrollment_id)
  let pk = 'id';
  try {
    const colInfo = await knex(TABLE).columnInfo();
    pk = colInfo.id ? 'id' : (colInfo.course_enrollment_id ? 'course_enrollment_id' : 'id');
    if (q) {
      qb.where(function() {
        if (colInfo.id) this.where('id', 'like', '%' + q + '%');
        if (colInfo.course_enrollment_id) this.orWhere('course_enrollment_id', 'like', '%' + q + '%');
        if (colInfo.user_id) this.orWhere('user_id', 'like', '%' + q + '%');
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

  const mapped = rows.map(r => {
    const out = Object.assign({}, r);
    if (out.course_enrollment_id && !out.id) out.id = out.course_enrollment_id;
    return out;
  });

  return { rows: mapped, total: Number(count) };
}

async function findById(id) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.course_enrollment_id ? 'course_enrollment_id' : 'id');
  return knex(TABLE).where({ [pk]: id }).first();
}
async function create(data) {
  const [insertId] = await knex(TABLE).insert(data);
  return findById(insertId);
}
async function update(id, data) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.course_enrollment_id ? 'course_enrollment_id' : 'id');
  await knex(TABLE).where({ [pk]: id }).update(data);
  return findById(id);
}
async function remove(id) {
  const colInfo = await knex(TABLE).columnInfo();
  const pk = colInfo.id ? 'id' : (colInfo.course_enrollment_id ? 'course_enrollment_id' : 'id');
  return knex(TABLE).where({ [pk]: id }).del();
}

module.exports = { findAll, findById, create, update, remove };
