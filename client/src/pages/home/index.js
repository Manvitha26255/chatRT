import { useSelector } from "react-redux"; 
import ChatArea from "./components/chat";
import Header from "./components/header";
import Sidebar from "./components/sidebar";
import { io } from 'socket.io-client';
import { useEffect, useState } from "react";

const socket = io('http://localhost:5000');

function Home() {
  const { selectedChats ,user } = useSelector((state) => state.userReducer);
  const [onlineUser, setOnlineUser] = useState([]);

  useEffect(() => {

    if (!user) return;

    socket.emit('join-room', user._id);
    socket.emit('user-login', user._id);

    const handleOnlineUsers = (onlineusers) => {
      setOnlineUser(onlineusers);
    };

    socket.on('online-users', handleOnlineUsers);
    socket.on('online-users-updated', handleOnlineUsers);

    return () => {
      socket.off('online-users', handleOnlineUsers);
      socket.off('online-users-updated', handleOnlineUsers);
    };

  }, [user]);

  return (
    <div className="home-page">
      <Header socket={socket}></Header>
      <div className="main-content">
        <Sidebar socket={ socket } onlineUser ={onlineUser}></Sidebar>
        {selectedChats && <ChatArea socket ={socket} onlineUser={onlineUser}></ChatArea>}
      </div>
    </div>
  );
}

export default Home;
