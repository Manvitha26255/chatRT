import { useDispatch, useSelector } from "react-redux";
import { createNewChat } from "../../../apiCalls/chat";
import { hideLoader, showLoader } from "../../../redux/loaderSlice";
import { setAllChats, setSelectedChats } from "../../../redux/usersSlice";
import toast from "react-hot-toast";
import moment from "moment";
import { useEffect } from "react";
import store from "../../../redux/store";

function UsersList({ searchKey, socket, onlineUser }) {
  const { allUsers, allChats, user: currentUser, selectedChats } =
    useSelector((state) => state.userReducer);

  const dispatch = useDispatch();

  // ---------------------------------------------------
  //  SAFE SOCKET LISTENER (TOP LEVEL, NEVER CONDITIONAL)
  // ---------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    socket.off("set-message-count").on("set-message-count", (message) => {
      let { allChats, selectedChats } = store.getState().userReducer;

      const updated = allChats.map((chat) => {
        if (chat?._id === message.chatId) {
          return {
            ...chat,
            unreadMessageCount:
              selectedChats?._id === message.chatId
                ? chat.unreadMessageCount
                : (chat.unreadMessageCount || 0) + 1,
            lastMessage: message,
          };
        }
        return chat;
      });

      const latestChat = updated.find((c) => c?._id === message.chatId);
      if (!latestChat) return;

      const others = updated.filter((c) => c?._id !== message.chatId);

      dispatch(setAllChats([latestChat, ...others]));
    });
  }, [socket, dispatch]);

  // ---------------------------------------------------
  //  PREVENT COMPONENT RENDER IF USER NOT LOADED
  // ---------------------------------------------------
  if (!currentUser) return null;

  // ---------------------------------------------------
  //  START NEW CHAT
  // ---------------------------------------------------
  const startNewChat = async (searchedUserId) => {
    try {
      dispatch(showLoader());
      const response = await createNewChat([
        currentUser._id,
        searchedUserId,
      ]);
      dispatch(hideLoader());

      if (response.success) {
        toast.success(response.message);
        dispatch(setAllChats([...allChats, response.data]));
      }
    } catch (error) {
      dispatch(hideLoader());
      toast.error(error.message);
    }
  };

  // ---------------------------------------------------
  //  OPEN CHAT
  // ---------------------------------------------------
  const openChat = (selectedUserId) => {
    const chat = allChats.find(
      (chat) =>
        chat?.members?.some((m) => (m?._id || m) === currentUser._id) &&
        chat?.members?.some((m) => (m?._id || m) === selectedUserId)
    );

    if (chat) dispatch(setSelectedChats(chat));
  };

  // ---------------------------------------------------
  //  IS SELECTED CHAT
  // ---------------------------------------------------
  const isSelectedChat = (user) => {
    return selectedChats?.members?.some(
      (m) => (m?._id || m) === user._id
    );
  };

  // ---------------------------------------------------
  //  LAST MESSAGE PREVIEW
  // ---------------------------------------------------
  const getLastMessage = (userId) => {
    const chat = allChats.find((chat) =>
      chat?.members?.some((m) => (m?._id || m) === userId)
    );

    if (!chat?.lastMessage) return "";

    const prefix =
      chat.lastMessage.sender === currentUser._id ? "You: " : "";

    return prefix + (chat.lastMessage.text || "").substring(0, 25);
  };

  const getLastMessageTime = (userId) => {
    const chat = allChats.find((chat) =>
      chat?.members?.some((m) => (m?._id || m) === userId)
    );

    if (!chat?.lastMessage) return "";

    return moment(chat.lastMessage.createdAt).format("hh:mm A");
  };

  // ---------------------------------------------------
  //  UNREAD COUNT
  // ---------------------------------------------------
  const getUnreadMessageCount = (userId) => {
    const chat = allChats.find((chat) =>
      chat?.members?.some((m) => (m?._id || m) === userId)
    );

    if (
      chat &&
      chat.unreadMessageCount > 0 &&
      chat?.lastMessage?.sender !== currentUser._id
    ) {
      return (
        <div className="unread-msg-counter">
          {chat.unreadMessageCount}
        </div>
      );
    }

    return "";
  };

  // ---------------------------------------------------
  //  FORMAT NAME
  // ---------------------------------------------------
  const formatName = (user) => {
    const fname =
      user.firstname.charAt(0).toUpperCase() +
      user.firstname.slice(1).toLowerCase();
    const lname =
      user.lastname.charAt(0).toUpperCase() +
      user.lastname.slice(1).toLowerCase();
    return fname + " " + lname;
  };

  // ---------------------------------------------------
  //  SEARCH OR CHAT LIST
  // ---------------------------------------------------
  const getData = () => {
    if (!searchKey) return allChats;

    return allUsers.filter(
      (u) =>
        u.firstname.toLowerCase().includes(searchKey.toLowerCase()) ||
        u.lastname.toLowerCase().includes(searchKey.toLowerCase())
    );
  };

  // ---------------------------------------------------
  //  RENDER UI
  // ---------------------------------------------------
  return getData().map((obj) => {
    let user = obj;

    if (obj?.members?.length > 0) {
      user = obj.members.find(
        (m) => (m?._id || m) !== currentUser._id
      );
    }

    if (!user) return null;

    return (
      <div
        key={user._id}
        className="user-search-filter"
        onClick={() => openChat(user._id)}
      >
        <div
          className={isSelectedChat(user) ? "selected-user" : "filtered-user"}
        >
          <div className="filter-user-display">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.firstname + " profile"}
                className="user-profile-image"
                style={
                  onlineUser.includes(user._id)
                    ? { border: "#82e0aa 3px solid" }
                    : {}
                }
              />
            ) : (
              <div
                className={
                  isSelectedChat(user)
                    ? "user-selected-avatar"
                    : "user-default-avatar"
                }
                style={
                  onlineUser.includes(user._id)
                    ? { border: "#82e0aa 3px solid" }
                    : {}
                }
              >
                {user.firstname[0].toUpperCase() +
                  user.lastname[0].toUpperCase()}
              </div>
            )}

            <div className="filter-user-details">
              <div className="user-display-name">{formatName(user)}</div>
              <div className="user-display-email">
                {getLastMessage(user._id) || user.email}
              </div>
            </div>

            <div>
              {getUnreadMessageCount(user._id)}
              <div className="last-message-timestamp">
                {getLastMessageTime(user._id)}
              </div>
            </div>

            {!allChats.some((chat) =>
              chat?.members?.some((m) => (m?._id || m) === user._id)
            ) && (
              <button
                className="user-start-chat-btn"
                onClick={() => startNewChat(user._id)}
              >
                Start Chat
              </button>
            )}
          </div>
        </div>
      </div>
    );
  });
}

export default UsersList;
