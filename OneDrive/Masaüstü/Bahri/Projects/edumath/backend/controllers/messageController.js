const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// Konuşmaları getir (öğrenci/öğretmen)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({ participantIds: userId })
      .populate('participantIds', 'name email profilePicture role')
      .populate({
        path: 'lastMessage',
        select: 'content senderId createdAt'
      })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments({ participantIds: userId });

    res.status(200).json({
      success: true,
      data: conversations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Konuşmalar alınırken hata oluştu',
      error: err.message
    });
  }
};

// Belirli bir konuşmanın mesajlarını getir
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Konuşma bulunamadı'
      });
    }

    // Kullanıcının konuşmada katılımcı olup olmadığını kontrol et
    if (!conversation.participantIds.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Bu konuşmaya erişim yetkiniz yok'
      });
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false
    })
      .populate('senderId', 'name email profilePicture')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({
      conversationId,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Mesajlar alınırken hata oluştu',
      error: err.message
    });
  }
};

// Mesaj gönder
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId, content, conversationId } = req.body;

    if (!content || !recipientId) {
      return res.status(400).json({
        success: false,
        message: 'İçerik ve alıcı zorunludur'
      });
    }

    // Konuşmayı bul veya oluştur
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else {
      conversation = await Conversation.findOne({
        participantIds: { $all: [userId, recipientId] }
      });

      if (!conversation) {
        conversation = new Conversation({
          participantIds: [userId, recipientId]
        });
      }
    }

    // Mesaj oluştur
    const message = new Message({
      senderId: userId,
      recipientId,
      conversationId: conversation._id,
      content
    });

    await message.save();
    await message.populate('senderId', 'name email profilePicture');

    // Konuşmayı güncelle
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json({
      success: true,
      message: 'Mesaj gönderildi',
      data: message
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Mesaj gönderilirken hata oluştu',
      error: err.message
    });
  }
};

// Mesajı oku
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Mesaj işaretlenirken hata oluştu',
      error: err.message
    });
  }
};

// Konuşmadaki tüm mesajları oku
exports.markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const result = await Message.updateMany(
      {
        conversationId,
        recipientId: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Konuşma mesajları okundu işaretle',
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Mesajlar işaretlenirken hata oluştu',
      error: err.message
    });
  }
};

// Mesajı düzenle
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'İçerik zorunludur'
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
      });
    }

    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu mesajı düzenleme yetkiniz yok'
      });
    }

    message.content = content;
    message.editedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Mesaj düzenlendi',
      data: message
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Mesaj düzenlenirken hata oluştu',
      error: err.message
    });
  }
};

// Mesajı sil
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
      });
    }

    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu mesajı silme yetkiniz yok'
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Mesaj silindi'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Mesaj silinirken hata oluştu',
      error: err.message
    });
  }
};

// Okunmamış mesajları say
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipientId: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Okunmamış mesaj sayısı alınırken hata oluştu',
      error: err.message
    });
  }
};
