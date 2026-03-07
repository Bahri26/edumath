import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';

/**
 * 🛒 XP MARKET - Öğrenciler puanlarını harcayıp ödüller alır
 */
export default function ShopPage() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    
    const [shopItems, setShopItems] = useState([]);
    const [userInventory, setUserInventory] = useState([]);
    const [userXP, setUserXP] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'inventory'
    const [buyingItemId, setBuyingItemId] = useState(null);

    const handleImageFallback = (event) => {
        const fallbackSrc = '/logo.svg';
        if (event?.currentTarget?.src?.endsWith(fallbackSrc)) return;
        event.currentTarget.src = fallbackSrc;
    };
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsRes, inventoryRes, userRes] = await Promise.all([
                api.get('/shop/items'),
                api.get('/shop/inventory'),
                api.get('/users/me')
            ]);

            setShopItems(itemsRes.data.data);
            setUserInventory(inventoryRes.data.data);
            setUserXP(userRes.data.data.xp_points);
        } catch (error) {
            console.error('❌ Veri yükleme hatası:', error);
            showNotification('Veriler yüklenemedi!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBuyItem = async (itemId, itemPrice) => {
        if (userXP < itemPrice) {
            showNotification(`Yetersiz XP! Gerekli: ${itemPrice} XP`, 'error');
            return;
        }

        setBuyingItemId(itemId);
        try {
            const response = await api.post('/shop/buy', { itemId });
            showNotification(response.data.data.message, 'success');
            
            // XP'yi güncelle ve envanter'i yenile
            setUserXP(response.data.data.remaining_xp);
            await fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Satın alma başarısız!';
            showNotification(errorMsg, 'error');
        } finally {
            setBuyingItemId(null);
        }
    };

    const handleEquipItem = async (inventoryId) => {
        try {
            const response = await api.put(`/shop/equip/${inventoryId}`);
            showNotification(response.data.data.message, 'success');
            await fetchData();
        } catch (error) {
            showNotification('İşlem başarısız!', 'error');
        }
    };

    const showNotification = (message, type) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const isOwned = (itemId) => {
        return userInventory.some(item => item.item_id === itemId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 sm:py-12 px-3 sm:px-4 transition-colors">
            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed top-20 sm:top-24 right-2 sm:right-4 left-2 sm:left-auto z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg animate-fade-in text-sm sm:text-base ${
                    notification.type === 'success' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                }`}>
                    {notification.message}
                </div>
            )}

            <div className="max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent mb-2 sm:mb-4">
                        🛒 XP Market
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base md:text-lg px-2">
                        Sınav puanlarını harca, havalı ödüller kazan!
                    </p>
                    
                    {/* XP Balance Card */}
                    <div className="inline-block mt-4 sm:mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-xl">
                        <p className="text-xs sm:text-sm font-semibold mb-1">Mevcut Bakiye</p>
                        <p className="text-2xl sm:text-3xl md:text-4xl font-black">{userXP} XP</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center gap-2 sm:gap-4 mb-8 sm:mb-10">
                    <button
                        onClick={() => setActiveTab('shop')}
                        className={`px-4 sm:px-8 py-2 sm:py-3 font-bold rounded-xl transition-all text-sm sm:text-base whitespace-nowrap ${
                            activeTab === 'shop'
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:scale-105'
                        }`}
                    >
                        🛍️ <span className="hidden sm:inline">Mağaza</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 sm:px-8 py-2 sm:py-3 font-bold rounded-xl transition-all text-sm sm:text-base whitespace-nowrap ${
                            activeTab === 'inventory'
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:scale-105'
                        }`}
                    >
                        🎒 <span className="hidden sm:inline">Envanterim</span>
                    </button>
                </div>

                {/* Shop Tab */}
                {activeTab === 'shop' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {shopItems.map((item) => {
                            const owned = isOwned(item.item_id);
                            const canAfford = userXP >= item.price;
                            const buying = buyingItemId === item.item_id;

                            return (
                                <div 
                                    key={item.item_id} 
                                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:scale-105 transition-all border-2 border-transparent hover:border-purple-400 dark:hover:border-purple-600"
                                >
                                    {/* Item Image */}
                                    <div className="h-32 sm:h-48 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center">
                                        <img 
                                            src={item.image_url || '/placeholder-item.png'} 
                                            alt={item.name}
                                            onError={handleImageFallback}
                                            className="w-20 sm:w-32 h-20 sm:h-32 object-contain"
                                        />
                                    </div>

                                    {/* Item Info */}
                                    <div className="p-4 sm:p-6">
                                        <div className="flex items-start justify-between mb-3 gap-2">
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white line-clamp-2">
                                                {item.name}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                item.type === 'avatar_frame' 
                                                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                                                    : item.type === 'background'
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                                    : 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                                            }`}>
                                                {item.type === 'avatar_frame' && '🖼️ Çerçeve'}
                                                {item.type === 'background' && '🎨 Arka Plan'}
                                                {item.type === 'badge' && '🏆 Rozet'}
                                            </span>
                                        </div>

                                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                                            {item.description}
                                        </p>

                                        {/* Price & Buy Button */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl sm:text-2xl font-black text-yellow-600 dark:text-yellow-400">
                                                    {item.price}
                                                </span>
                                                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">XP</span>
                                            </div>

                                            {owned ? (
                                                <span className="px-3 sm:px-4 py-1 sm:py-2 bg-green-500 text-white rounded-lg font-semibold text-sm">
                                                    ✅ Sahipsin
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleBuyItem(item.item_id, item.price)}
                                                    disabled={!canAfford || buying}
                                                    className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2 rounded-lg font-bold transition-all text-sm sm:text-base ${
                                                        canAfford
                                                            ? buying 
                                                                ? 'bg-gray-400 cursor-not-allowed'
                                                                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                                                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {buying ? '⏳ Satın.' : canAfford ? '💳 Satın Al' : '🔒'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {userInventory.length === 0 ? (
                            <div className="col-span-full text-center py-12 sm:py-20">
                                <p className="text-5xl sm:text-6xl mb-4">🎒</p>
                                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 font-semibold px-4">
                                    Henüz hiç ürün satın almadın!
                                </p>
                                <button
                                    onClick={() => setActiveTab('shop')}
                                    className="mt-4 sm:mt-6 px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:scale-105 transition-all text-sm sm:text-base"
                                >
                                    Mağazaya Git 🛍️
                                </button>
                            </div>
                        ) : (
                            userInventory.map((item) => (
                                <div 
                                    key={item.inventory_id}
                                    className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:scale-105 transition-all border-2 ${
                                        item.is_equipped 
                                            ? 'border-green-500 dark:border-green-400 shadow-green-300 dark:shadow-green-900' 
                                            : 'border-transparent'
                                    }`}
                                >
                                    {/* Equipped Badge */}
                                    {item.is_equipped && (
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-1 sm:py-2 font-bold text-xs sm:text-sm">
                                            ✨ Kuşanmış
                                        </div>
                                    )}

                                    {/* Item Image */}
                                    <div className="h-32 sm:h-48 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center">
                                        <img 
                                            src={item.image_url || '/placeholder-item.png'} 
                                            alt={item.name}
                                            onError={handleImageFallback}
                                            className="w-20 sm:w-32 h-20 sm:h-32 object-contain"
                                        />
                                    </div>

                                    {/* Item Info */}
                                    <div className="p-4 sm:p-6">
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-3">
                                            {item.name}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                                            {item.description}
                                        </p>

                                        {/* Equip Button */}
                                        <button
                                            onClick={() => handleEquipItem(item.inventory_id)}
                                            className={`w-full py-2 sm:py-3 rounded-lg font-bold transition-all text-sm sm:text-base ${
                                                item.is_equipped
                                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg'
                                            }`}
                                        >
                                            {item.is_equipped ? '❌ Çıkar' : '✨ Kuşan'}
                                        </button>

                                        {/* Purchased Date */}
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                                            📅 Satın alındı: {new Date(item.purchased_at).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
