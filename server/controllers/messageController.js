const route = require('express').Router();
const authMiddleware = require('./../middlewares/authMiddleware');
const Chat = require('./../models/chat');
const Message = require('./../models/message');
route.post('/new-message', authMiddleware, async (req, res) => {
try {
    // store message in collection
   // const newMessage = new Message(req.body);
   console.log("REQ BODY IMAGE LENGTH:", req.body.image?.length);

   const newMessage = new Message({
  chatId: req.body.chatId,
  sender: req.body.sender,
  text: req.body.text,
  image: req.body.image,  // ✅ just this line added
  read: req.body.read || false
});

    const savedMessage = await newMessage.save();



    //update last message in chat collection
    //const currentChat = await Chat.findById(req.body.chatId);
    //currentChat.lastMessage = savedMessage._id;
    //await currentChat.save()

    const currentChat = await Chat.findOneAndUpdate({
        _id: req.body.chatId
    }, {
            lastMessage: savedMessage._id,
            $inc: {unreadMessageCount: 1}
    });

    res.status(201).send({
        message: 'Message sent successfully',
        success: true,
        data: savedMessage
    })
} catch (error) {
    res.status(400).send({
        message: error.message,
        success: false
    });
    
}
});


route.get('/get-all-messages/:chatId',authMiddleware,async (req, res) => {
    try {
         const allMessages = await Message.find({chatId: req.params.chatId})
                                        .sort({createdAt: 1});
         res.send({
            message: 'Messages fetched  successfully',
            success: true,
            data: allMessages
         })
    } catch (error) {
        res.status(400).send({
            message: error.message,
            success: false
        });
        
    }
})

module.exports = route;