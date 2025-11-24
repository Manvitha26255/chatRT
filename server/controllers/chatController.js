// const router = require('express').Router();
// const Chat = require('./../models/chat');
// const Message = require('./../models/message');
// const authMiddleware = require('../middlewares/authMiddleware');

// router.post('/create-new-chat', authMiddleware, async (req, res) => {
//     try{
//         const chat = new Chat(req.body);
//         const savedChat = await chat.save();
//         await savedChat.populate('members');

        

//         res.status(201).send({
//             message: 'Chat created successfully',
//             success: true,
//             data: savedChat
//         })
//     }catch(error){
//         res.status(400).send({
//             message: error.message,
//             success: false
//         })
//     }
// })

// router.get('/get-all-chats', authMiddleware, async (req, res) => {
//     try{
//         const allChats = await Chat.find({members: {$in: req.userId}})
//         .populate('members').populate('lastMessage').sort({updatedAt: -1});
//         //const savedChat = await chat.save();
        

        

//         res.status(201).send({
//             message: 'Chat fetched successfully',
//             success: true,
//             data: allChats
//         })
//     }catch(error){
//         res.status(400).send({
//             message: error.message,
//             success: false
//         })
//     }
// })
// router.post('/clear-unread-message',authMiddleware,async(req ,res) =>{
//     try {
//         const chatId = req.body.chatId;
//         // update the unread message count in chat collection
//         const chat = await Chat.findById(chatId);
//         if(!chat){
//             res.send({
//                 message: "No Chat found with given chat ID.",
//                 success: false
//             })
//         }

//         const updatedChat = await Chat.findByIdAndUpdate(
//             chatId,
//             { unreadMessageCount: 0},
//             { new: true}
//         ).populate('members').populate('lastMessage');

//         //we want to update the read property to true in message collection
//         await Message.updateMany(
//             {chatId: chatId, read: false},
//             { read: true }
//         )

//         res.send({
//             message: "Unread message cleared successfully",
//             success: true,
//             data: updatedChat
//         })
//     }catch(error){
//         res.send({
//             message: error.message,
//             success: false
//         })
//     }
// })


// module.exports = router;
// controllers/chatController.js
const router = require("express").Router();
const Chat = require("../models/chat");
const Message = require("../models/message");
const authMiddleware = require("../middlewares/authMiddleware");

// Create new chat
router.post("/create-new-chat", authMiddleware, async (req, res) => {
  try {
    const { members } = req.body;

    // try to find existing chat with same members (both)
    let chat = await Chat.findOne({ members: { $all: members } })
      .populate("members")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", model: "users" },
      });

    if (chat) {
      return res.send({
        success: true,
        message: "Chat already exists",
        data: chat,
      });
    }

    const newChat = new Chat({ members });
    const saved = await newChat.save();

    const populated = await Chat.findById(saved._id)
      .populate("members")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", model: "users" },
      });

    res.status(201).send({
      success: true,
      message: "Chat created successfully",
      data: populated,
    });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

// Get all chats for a user
router.get("/get-all-chats", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const chats = await Chat.find({ members: { $in: userId } })
      .populate("members")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", model: "users" },
      })
      .sort({ updatedAt: -1 });

    res.send({ success: true, message: "Chats fetched", data: chats });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

// Clear unread messages for a chat
router.post("/clear-unread-message", authMiddleware, async (req, res) => {
  try {
    const chatId = req.body.chatId;
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.send({ success: false, message: "Chat not found" });
    }

    chat.unreadMessageCount = 0;
    await chat.save();

    // mark messages read
    await Message.updateMany({ chatId: chatId, read: false }, { read: true });

    const populated = await Chat.findById(chatId)
      .populate("members")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", model: "users" },
      });

    res.send({
      success: true,
      message: "Unread count cleared",
      data: populated,
    });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});

module.exports = router;
