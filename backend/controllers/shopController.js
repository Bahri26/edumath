const shopRepo = require('../repos/shop_itemsRepo');
const purchasesRepo = require('../repos/user_purchasesRepo');
const usersRepo = require('../repos/usersRepo');

async function items(req, res) {
  try {
    const result = await shopRepo.findAll({ page: 1, limit: 500 });
    // return in frontend-friendly shape
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function inventory(req, res) {
  try {
    const uid = req.user && (req.user.id || (req.user.dbUser && req.user.dbUser.user_id));
    if (!uid) return res.status(401).json({ error: 'unauthenticated' });
    const result = await purchasesRepo.findAll({ page: 1, limit: 500, filters: { user_id: uid } });
    return res.json({ data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function buy(req, res) {
  try {
    const uid = req.user && (req.user.id || (req.user.dbUser && req.user.dbUser.user_id));
    if (!uid) return res.status(401).json({ error: 'unauthenticated' });
    const { itemId } = req.body || {};
    if (!itemId) return res.status(400).json({ error: 'itemId required' });
    const item = await shopRepo.findById(Number(itemId));
    if (!item) return res.status(404).json({ error: 'item not found' });

    const user = await usersRepo.findById(Number(uid));
    const userXp = Number(user && (user.xp_points || user.xp || 0));
    const price = Number(item.price || 0);
    if (userXp < price) return res.status(400).json({ error: 'insufficient_xp' });

    // create purchase
    const purchase = await purchasesRepo.create({ user_id: uid, item_id: itemId, purchased_at: new Date(), is_equipped: 0 });

    // deduct xp (update user)
    const remaining = userXp - price;
    await usersRepo.update(Number(uid), { xp_points: remaining });

    return res.json({ data: { message: 'Satın alındı', remaining_xp: remaining, purchase } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function equip(req, res) {
  try {
    const uid = req.user && (req.user.id || (req.user.dbUser && req.user.dbUser.user_id));
    if (!uid) return res.status(401).json({ error: 'unauthenticated' });
    const inventoryId = Number(req.params.inventoryId);
    if (!inventoryId) return res.status(400).json({ error: 'invalid id' });

    const inv = await purchasesRepo.findById(inventoryId);
    if (!inv || inv.user_id !== uid) return res.status(404).json({ error: 'not found' });

    // For simplicity, toggle equip state; set this as equipped and unset others of same item type
    // Set all user's purchases is_equipped=0
    const knex = require('../db/knex');
    await knex('user_purchases').where({ user_id: uid }).update({ is_equipped: 0 });
    await purchasesRepo.update(inventoryId, { is_equipped: 1 });

    return res.json({ data: { message: 'Kuşanıldı' } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { items, inventory, buy, equip };
