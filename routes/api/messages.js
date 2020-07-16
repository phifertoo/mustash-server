const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

// route: POST http://localhost:5000/api/messages
// description: write a message
// access: private

// Fan on write

router.post('/:recipient_id', auth, async (req, res) => {
  try {
    const { newMessage } = req.body;
    const { recipient_id } = req.params;
    const sender_id = req.user.user;
    const sender = await User.findOne({ _id: sender_id });
    const senderConversations = sender.conversations;
    const conversation_id =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const message_id =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    senderConversations.push({
      _id: conversation_id,
      messages: [
        {
          _id: message_id,
          message: newMessage,
          sender: sender_id,
          recipient: recipient_id,
          read: true,
        },
      ],
    });

    const recipient = await User.findOne({ _id: recipient_id });
    const recipientConversations = recipient.conversations;
    recipientConversations.push({
      _id: conversation_id,
      messages: [
        {
          _id: message_id,
          message: newMessage,
          sender: sender_id,
          recipient: recipient_id,
          read: false,
        },
      ],
    });

    sender.save((err1, result1) => {
      const output = {};
      if (err1) {
        console.log(err1);
        return res.status(400).json({
          error: 'database error',
        });
      }
      output.result1 = result1;
      recipient.save((err2, result2) => {
        if (err2) {
          return res.status(400).json({
            error: 'database error',
          });
        }
        output.result2 = result2;
        res.json(output);
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// route: POST http://localhost:5000/api/messages/respond/:recipient_id/:conversation_id
// description: respond to a message
// access: private

router.post('/reply/:recipient_id/:conversation_id', auth, async (req, res) => {
  try {
    const { newMessage } = req.body;
    const { recipient_id, conversation_id } = req.params;
    const message_id =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const sender_id = req.user.user;
    const sender = await User.findOne({ _id: sender_id });
    const senderMessages = sender.conversations.find(
      (element) => element._id === conversation_id
    ).messages;
    senderMessages.push({
      _id: message_id,
      message: newMessage,
      sender: sender_id,
      recipient: recipient_id,
      read: true,
    });

    const recipient = await User.findOne({ _id: recipient_id });
    const recipientConversation = recipient.conversations.find(
      (element) => element._id === conversation_id
    );
    if (recipientConversation) {
      recipientConversation.messages.push({
        _id: message_id,
        message: newMessage,
        sender: sender_id,
        recipient: recipient_id,
        read: false,
      });
    } else {
      recipient.conversations.push({
        _id: conversation_id,
        messages: [
          {
            _id: message_id,
            message: newMessage,
            sender: sender_id,
            recipient: recipient_id,
            read: false,
          },
        ],
      });
    }

    sender.save((err1, result1) => {
      const output = {};
      if (err1) {
        console.log(err1);
        return res.status(400).json({
          error: 'database error',
        });
      }
      output.result1 = result1;
      recipient.save((err2, result2) => {
        if (err2) {
          return res.status(400).json({
            error: 'database error',
          });
        }
        output.result2 = result2;
        res.json(output);
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// route: GET http://localhost:5000/api/messages/
// description: delete conversation
// access: private

router.get('/', auth, async (req, res) => {
  try {
    const user_id = req.user.user;
    const user = await User.findOne({ _id: user_id });
    res.json(user.conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// route: DELETE http://localhost:5000/api/messages/:conversation_id
// description: delete conversation
// access: private

router.delete('/:conversation_id', auth, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const user_id = req.user.user;
    const user = await User.findOne({ _id: user_id });
    const index = user.conversations.findIndex(
      (element) => element._id === conversation_id
    );
    user.conversations.splice(index, 1);

    user.save((err, result) => {
      if (err) {
        console.log(err);
        return res.status(400).json({
          error: 'database error',
        });
      }
      res.json(result);
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
