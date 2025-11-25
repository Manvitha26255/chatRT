import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { createNewMessage, getAllMessages } from "../../../apiCalls/message";
import { hideLoader, showLoader } from "../../../redux/loaderSlice";
import { useEffect, useState } from "react";
import { clearUnreadMessageCount } from "./../../../apiCalls/chat";
import moment from "moment";
import store from "../../../redux/store";
import { setAllChats } from "../../../redux/usersSlice";
import EmojiPicker from "emoji-picker-react";

function ChatArea({ socket }) {
  const dispatch = useDispatch();
  const { selectedChats, user, allChats } = useSelector(
    (state) => state.userReducer
  );
  //const selectedUser = selectedChats.members.find((u) => u._id !== user._id);
  const selectedUser =
  selectedChats?.members?.find((u) => u?._id !== user?._id) || null;

  const [message, setMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [data,setData] = useState(null);

  const sendMessage = async (image = null) => {
    try {
      const newmessage = {
        chatId: selectedChats._id,
        sender: user._id,
        text: message,
        image,
      };
      //only emit if there' s something to send
      if(!message && !image) return;

      socket.emit("send-message", {
        ...newmessage,
       // members: selectedChats.members.map((m) => m._id),
       members:selectedChats?.members?.map((m) => m?._id),
        read: false,
        createdAt: new Date().toISOString(),
      });

      const response = await createNewMessage(newmessage);

      if (response.success) {
        setMessage("");
        setShowEmojiPicker(false);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatTime = (timestamp) => {
    const now = moment();
    const diff = now.diff(moment(timestamp), "days");

    if (diff < 1) {
      return `Today ${moment(timestamp).format("hh:mm A")}`;
    } else if (diff === 1) {
      return `Yesterday ${moment(timestamp).format("hh:mm A")}`;
    } else {
      return moment(timestamp).format("MMM D, hh:mm A");
    }
  };

  const getMessages = async () => {
    try {
      dispatch(showLoader());
      const response = await getAllMessages(selectedChats._id);
      dispatch(hideLoader());

      if (response.success) {
        setAllMessages(response.data);
      }
    } catch (error) {
      dispatch(hideLoader());
      toast.error(error.message);
    }
  };

  const clearUnreadMessages = async () => {
    try {
      socket.emit("clear-unread-messages", {
        chatId: selectedChats._id,
        members: selectedChats.members.map((m) => m._id),
      });
      const response = await clearUnreadMessageCount(selectedChats._id);
      dispatch(hideLoader());

      if (response.success) {
        allChats.map((chat) => {
          if (chat._id === selectedChats._id) {
            return response.data;
          }
          return chat;
        });
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  function formatName(user) {
    let fname =
      user.firstname.at(0).toUpperCase() +
      user.firstname.slice(1).toLowerCase();
    let lname =
      user.lastname.at(0).toUpperCase() +
      user.lastname.slice(1).toLowerCase();
    return fname + " " + lname;
  }

  const sendImage = async(e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async() =>{
      const base64Image = reader.result;
      console.log("BASE 64 IMAGE:",reader.result);
      sendMessage(reader.result);

    }

  }

  useEffect(() => {
    getMessages();
    if (selectedChats?.lastMessage?.sender !== user._id) {
      clearUnreadMessages();
    }
    socket.off("receive-message").on("receive-message", (message) => {
      const selectedChats = store.getState().userReducer.selectedChats;
      // if (selectedChats._id === message.chatId) {
      if (selectedChats?._id === message.chatId){
        setAllMessages((prevmsg) => [...prevmsg, message]);
      }
      if (selectedChats._id === message.chatId && message.sender !== user._id) {
        clearUnreadMessages();
      }
    });

    socket.on("message-count-cleared", (data) => {
      const selectedChats = store.getState().userReducer.selectedChats;
      const allChats = store.getState().userReducer.allChats;

      if (selectedChats._id === data.chatId) {
        const updatedChats = allChats.map((chat) => {
          if (chat._id === data.chatId) {
            return { ...chat, unreadMessageCount: 0 };
          }
          return chat;
        });
        dispatch(setAllChats(updatedChats));

        setAllMessages((prevmsgs) => {
          return prevmsgs.map((msg) => {
            return { ...msg, read: true };
          });
        });
      }
    });

    socket.on("started-typing", (data) => {
      setData(data);
      if (selectedChats._id === data.chatId && data.sender !== user._id) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    });
  }, [selectedChats]);

  useEffect(() => {
    const msgContainer = document.getElementById("main-chat-area");
    if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
  }, [allMessages, isTyping]);

  return (
    <>
      {selectedChats && (
        <div className="app-chat-area">
          <div className="app-chat-area-header">{formatName(selectedUser)}</div>

          <div className="main-chat-area" id="main-chat-area">
            {allMessages.map((msg) => {
              const isCurrentUserSender = msg.sender === user._id;

              return (
                <div
                  className="message-container"
                  style={
                    isCurrentUserSender
                      ? { justifyContent: "end" }
                      : { justifyContent: "start" }
                  }
                >
                  <div>
                    <div
                      className={
                        isCurrentUserSender
                          ? "send-message"
                          : "received-message"
                      }
                    >
                      <div>{msg.text}</div>
                      <div>{msg.image && <img src ={msg.image} alt ="image" height ="120" width="120"></img>}</div>
                    </div>
                    <div
                      className="message-timestamp"
                      style={
                        isCurrentUserSender
                          ? { float: "right" }
                          : { float: "left" }
                      }
                    >
                      {formatTime(msg.createdAt)}{" "}
                      {isCurrentUserSender && msg.read && (
                        <i
                          className="fa fa-check-circle"
                          aria-hidden="true"
                          style={{ color: "#e74c3c" }}
                        ></i>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="typing-indicator">
              {isTyping && selectedChats?.members.map((m) => m._id).includes(data?.sender) && <i>typing...</i>}

            </div>
          </div>

          {/*Emoji picker properly positioned, does not hide buttons */}
          {showEmojiPicker && (
            <div
              className="emoji-picker-container"
              style={{
                position: "absolute",
                bottom: "70px",
                right: "20px",
                zIndex: 1000,
              }}
            >
              <EmojiPicker
                onEmojiClick={(emoji) =>
                  setMessage((prev) => prev + emoji.emoji)
                }
              />
            </div>
          )}

          <div className="send-message-div">
            <input
              type="text"
              className="send-message-input"
              placeholder="Type a message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                socket.emit("user-typing", {
                  chatId: selectedChats._id,
                  members: selectedChats.members.map((m) => m._id),
                  sender: user._id,
                });
              }}
            />
            <label for ="file">
              <i className="fa fa-picture-o send-image-btn"></i>
            <input 
            type ="file"
             id="file" 
            style={{display:'none'}}
            accept="image/jpg,image/png,image/jpeg,image/gif"
            onChange={sendImage}
            >
            </input>
            </label>
            <button
              className="fa fa-paper-plane send-message-btn"
              aria-hidden="true"
              onClick={ () =>sendMessage('')}
            ></button>

            <button
              className="fa fa-smile-o send-emoji-btn"
              aria-hidden="true"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            ></button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatArea;


