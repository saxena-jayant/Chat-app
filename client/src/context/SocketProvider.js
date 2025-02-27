import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [userOnline, setUserOnline] = useState(true);
  const heartbeatTimeoutRef = useRef();
  const socketURL = "http://localhost:5001"; // Change this to your backend URL

  const handleConnect = (newSocket) => {
    console.log("Connected to server:", newSocket.id);
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user) {
      newSocket.emit("setUser", user.user_id);
      setUserOnline(true);
    }
  };

  const handleDisconnect = () => {
    console.log("Disconnected from server");
    setUserOnline(false);
  };

  const handleHeartbeat = (newSocket) => {
    newSocket.emit("heartbeat");

    clearTimeout(heartbeatTimeoutRef.current);
    heartbeatTimeoutRef.current = setTimeout(() => {
      console.log("Connection lost, no heartbeat received.");
      setUserOnline(false);
    }, 7000);
  };

  const createNewConnection = () => {
    console.log("Creating a new socket connection...");

    if (socket) {
      console.log("Closing existing socket connection...");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("heartbeat");
      socket.close();
    }

    const newSocket = io(socketURL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => handleConnect(newSocket));
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("heartbeat", () => handleHeartbeat(newSocket));
  };

  useEffect(() => {
    createNewConnection();

    // Handle browser tab close or refresh
    const handleUnload = () => {
      console.log("Closing socket due to page unload");
      socket?.close();
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      socket?.off("connect");
      socket?.off("disconnect");
      socket?.off("heartbeat");
      socket?.close();
      clearTimeout(heartbeatTimeoutRef.current);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, userOnline, createNewConnection }}>
      {children}
    </SocketContext.Provider>
  );
};

const useSocket = () => {
  return useContext(SocketContext);
};

export { SocketProvider, useSocket };
