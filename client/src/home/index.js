import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import classes from "./home.module.scss";
import { useSocket } from "../context/SocketProvider";
import { ROUTES } from "../shared/routes";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { socket, createNewConnection } = useSocket();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState();
  const [selectedUser, setSelectedUser] = useState();
  const [receiverStatus, setReceiverStatus] = useState();
  const [receiverTypingStatus, setReceiverTypingStatus] = useState(false);
  const [allMessages, setAllMessages] = useState();
  const [newMessage, setNewMessage] = useState({});
  const [updateMessageStatus, setUpdateMessageStatus] = useState(false);
  const [bottomPadding, setBottomPadding] = useState("81px");
  const [chatDetails, setChatDetails] = useState({
    sender_id: "",
    receiver_id: "",
    message: "",
    document: [],
    status: "",
    time_stamp: "",
  });
  const fileUploader = useRef();

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    createNewConnection();
    setUserId(user.user_id);
    api
      .post("/home/get-users", { user_id: user.user_id })
      .then(({ data }) => setUsers(data))
      .catch((err) => console.log(err));
  }, []);

  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsFocused(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (isFocused && selectedUser) {
      socket.emit(
        "send-receive-status",
        userId,
        selectedUser._id,
        (acknowledgment) => {
          // console.log(acknowledgment);
        }
      );
    }
  }, [isFocused, selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      setChatDetails({
        ...chatDetails,
        sender_id: userId,
        receiver_id: selectedUser._id,
      });
      api
        .post("/home/get-messages", {
          sender_id: userId,
          receiver_id: selectedUser._id,
        })
        .then(({ data }) => {
          setAllMessages(
            data.map((item) => {
              return { ...item, document: JSON.parse(item.document) };
            })
          );
          setTimeout(() => {
            var objDiv = document.getElementById("chat");
            objDiv.scrollTop = objDiv.scrollHeight;
          }, 100);
        })
        .catch((err) => console.log(err));
    }
  }, [selectedUser]);

  useEffect(() => {
    socket.on("receive-chat", (data) => {
      setNewMessage(data);
    });

    const handleTypingStatus = (data) => {
      setReceiverTypingStatus(data.status);

      setTimeout(() => {
        setReceiverTypingStatus(false);
      }, 2000);
    };

    socket.on("update-typing-status", (data) => {
      handleTypingStatus(data);
    });

    socket.on("update-receive-status", (data) => {
      setUpdateMessageStatus(!updateMessageStatus);
    });

    const checkStatus = () => {
      if (selectedUser) {
        socket.emit("checkUserStatus", selectedUser._id, (onlineStatus) => {
          setReceiverStatus(onlineStatus);
        });
      }
    };

    // Initial call
    checkStatus();

    // Set interval of 3 seconds
    let interval = setInterval(() => {
      checkStatus();
    }, 3000);

    return () => {
      socket.off("update-typing-status", handleTypingStatus);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    if (newMessage.message || newMessage.document) {
      setAllMessages([...allMessages, newMessage]);
      playSound();
      setTimeout(() => {
        var objDiv = document.getElementById("chat");
        objDiv.scrollTop = objDiv.scrollHeight;
      }, 100);
    }
  }, [newMessage]);

  useEffect(() => {
    const temp = allMessages?.map((item) => ({
      ...item,
      status: "received",
    }));
    setAllMessages(temp);
  }, [updateMessageStatus]);

  const playSound = () => {
    var audio = new Audio("/Message.mp3");
    audio.play();
  };

  const handleExtension = (item) => {
    return item.split(".")[item.split(".").length - 1];
  };

  const fileUpload = (e) => {};

  const handleRemove = (item) => {
    const temp = chatDetails.document.filter((each) => each !== item);
    setChatDetails({ ...chatDetails, document: temp });
  };

  const sendMessage = () => {
    const timeStamp = Date.now();
    socket.emit(
      "send-chat",
      { ...chatDetails, time_stamp: timeStamp },
      (acknowledgment) => {
        if (acknowledgment.success) {
          setAllMessages([...allMessages, acknowledgment.message]);
          document.getElementById("editableSpan").innerHTML = "";
        } else {
          console.error("Message not sent successfully");
        }
      }
    );
    setBottomPadding(81 + "px");
    setChatDetails({ ...chatDetails, message: "", document: [] });
  };

  const handleTime = (value) => {
    if (value) {
      const date = new Date(parseInt(value));

      let hours = date.getHours() % 12 || 12;
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = date.getHours() >= 12 ? "PM" : "AM";

      return `${hours}:${minutes} ${ampm}`;
    } else {
      return "";
    }
  };

  return (
    <section
      className="d-flex justify-content-center bg-black2 overflow-hidden"
      style={{ width: "100vw", minHeight: "100vh" }}
    >
      <div
        className="position-relative pt-60"
        style={{
          flex: "0.2",
          minWidth: "400px",
          boxShadow: "1px 0px 20px -4px rgb(0,0,0,0.5)",
        }}
      >
        <div
          className="d-flex align-items-center justify-content-between px-4 py-3 position-absolute w-100"
          style={{
            gap: "12px",
            boxShadow: "0px 1px 20px -4px rgb(0,0,0,0.5)",
            top: "0px",
            zIndex: "10",
          }}
        >
          <div className="d-flex align-items-center">
            <img src="/images/icons/profile-active.svg" alt="" />
            <p className="font-18 font-semi font-white mb-0">Contacts</p>
          </div>
          <button
            className="font-16 font-semi mb-0 bg-black2 font-red radius-8 px-2"
            style={{ border: "1px solid #f76152" }}
            onClick={() => {
              sessionStorage.removeItem("user");
              navigate(ROUTES.LOGIN.path);
            }}
          >
            Logout
          </button>
        </div>
        {users.map((item, i) => (
          <div
            key={i}
            className="d-flex align-items-center px-3 py-3"
            style={{ gap: "10px" }}
            onClick={() => setSelectedUser(item)}
          >
            <img
              src={item.picture}
              alt=""
              style={{ width: "40px", height: "40px", borderRadius: "50%" }}
            />
            <div>
              <p
                className="font-white font-16 font-semi mb-0"
                style={{ lineHeight: "18px" }}
              >
                {item.user_name}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div
        className="position-relative pt-70"
        style={{
          flex: "0.8",
        }}
      >
        {selectedUser && (
          <React.Fragment>
            <div
              className="d-flex align-items-center justify-content-between px-4 py-3 position-absolute w-100"
              style={{ gap: "10px", top: "0px" }}
            >
              <div
                className="d-flex align-items-center"
                style={{ gap: "10px" }}
              >
                <div className="position-relative">
                  <img
                    src={selectedUser.picture}
                    alt=""
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                    }}
                  />
                  <div
                    className={
                      receiverStatus
                        ? "position-absolute bg-green-2"
                        : "position-absolute bg-red"
                    }
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      bottom: "0px",
                      right: "0px",
                    }}
                  />
                </div>
                <div>
                  <p
                    className="font-white font-16 font-semi mb-0"
                    style={{ lineHeight: "18px" }}
                  >
                    {selectedUser.user_name}
                  </p>
                  <p
                    className="font-white font-14 mb-0"
                    style={{ lineHeight: "18px" }}
                  >
                    {receiverTypingStatus
                      ? "Typing..."
                      : receiverStatus
                      ? "online"
                      : "offline"}
                  </p>
                </div>
              </div>
              <img
                src="/images/icons/cross-01.svg"
                alt=""
                style={{ width: "24px" }}
                onClick={() => {
                  setSelectedUser();
                  setAllMessages();
                  setChatDetails({
                    sender_id: "",
                    receiver_id: "",
                    message: "",
                    document: [],
                    status: "",
                    time_stamp: "",
                  });
                }}
              />
            </div>
            <div
              className="overflow-scroll"
              id="chat"
              style={{
                height: "calc(100vh - 72px)",
                scrollBehavior: "smooth",
              }}
            >
              <div
                className="w-100 px-4 d-flex flex-column justify-content-end"
                style={{
                  paddingBottom: bottomPadding,
                  gap: "16px",
                  minHeight: "100%",
                }}
              >
                {allMessages?.map((item, i) => (
                  <div key={i}>
                    <div
                      className="mb-1"
                      style={
                        item.sender_id == userId
                          ? {
                              width: "fit-content",
                              maxWidth: "70%",
                              marginLeft: "auto",
                            }
                          : {
                              width: "fit-content",
                              maxWidth: "70%",
                            }
                      }
                    >
                      {item.document.length === 0 ? (
                        <p
                          className="mb-0 font-14 font-medium px-3 py-10 radius-8 bg-white "
                          dangerouslySetInnerHTML={{ __html: item.message }}
                          style={{
                            wordWrap: "break-word",
                            whiteSpace: "pre-wrap",
                            border: "1px solid #E5EBEF",
                          }}
                        />
                      ) : (
                        <React.Fragment>
                          {item.message !== "" && (
                            <p
                              className="mb-6 font-14 font-medium px-3 py-10 radius-8 bg-white "
                              dangerouslySetInnerHTML={{ __html: item.message }}
                              style={
                                item.sender_id == userId
                                  ? {
                                      wordWrap: "break-word",
                                      whiteSpace: "pre-wrap",
                                      border: "1px solid #E5EBEF",
                                      width: "fit-content",
                                      marginLeft: "auto",
                                    }
                                  : {
                                      wordWrap: "break-word",
                                      whiteSpace: "pre-wrap",
                                      border: "1px solid #E5EBEF",
                                      width: "fit-content",
                                    }
                              }
                            />
                          )}
                          <div
                            className={
                              item.sender_id == userId
                                ? "d-flex flex-wrap justify-content-end"
                                : "d-flex flex-wrap justify-content-start"
                            }
                            style={{ gap: "8px" }}
                          >
                            {item.document.map((item, i) => (
                              <div
                                className="d-flex align-items-center justify-content-center bg-black radius-4 overflow-hidden"
                                style={{ width: "100px", height: "100px" }}
                                key={i}
                                // onClick={() => {
                                //   if (handleExtension(item) !== "pdf") {
                                //     setSelectedFile(item);
                                //     setShowImage(true);
                                //   } else {
                                //     handleDownload(item);
                                //   }
                                // }}
                              >
                                {handleExtension(item) === "pdf" && (
                                  <div className="w-100 h-100 bg-white d-flex align-items-center justify-content-center">
                                    <img
                                      src="/images/icons/file-text.svg"
                                      alt=""
                                      style={{ width: "fit-content" }}
                                    />
                                  </div>
                                )}
                                {(handleExtension(item) === "mp4" ||
                                  handleExtension(item) === "ogg" ||
                                  handleExtension(item) === "mov" ||
                                  handleExtension(item) === "hevc" ||
                                  handleExtension(item) === "h.264") && (
                                  <video
                                    src={item}
                                    style={{
                                      maxWidth: "100%",
                                      maxHeight: "100%",
                                      borderRadius: "4px",
                                    }}
                                    controls={false}
                                  />
                                )}
                                {(handleExtension(item) === "png" ||
                                  handleExtension(item) === "jpeg" ||
                                  handleExtension(item) === "jpg" ||
                                  handleExtension(item) === "heif" ||
                                  handleExtension(item) === "heic") && (
                                  <img
                                    src={item}
                                    className="w-100"
                                    style={{
                                      maxWidth: "100%",
                                      maxHeight: "100%",
                                      borderRadius: "4px",
                                    }}
                                    alt=""
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </React.Fragment>
                      )}
                    </div>
                    {item.sender_id == userId && (
                      <div
                        className="d-flex align-items-center justify-content-end"
                        style={{ gap: "8px" }}
                      >
                        <p className="font-12 mb-0 font-white">
                          {handleTime(item.time_stamp)}
                        </p>
                        <img
                          src={
                            item.status === "sent"
                              ? "/images/icons/Single Tick.svg"
                              : "/images/icons/Double Tick.svg"
                          }
                          alt=""
                          style={{ width: "16px" }}
                        />
                      </div>
                    )}
                    {item.sender_id != userId && (
                      <div
                        className="d-flex align-items-center justify-content-between"
                        style={{ gap: "8px" }}
                      >
                        <p className="font-12 mb-0 font-white">
                          {handleTime(item.time_stamp)}
                        </p>
                        {/* <p className="font-10 mb-0">{item.status}</p> */}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div
              className="position-absolute d-flex align-items-end px-4 py-3 bg-white"
              id="footer"
              style={{ bottom: "0px", gap: "16px", width: "100%" }}
            >
              <input
                name="video"
                type="file"
                className="d-none"
                ref={fileUploader}
                onChange={async (e) => {
                  await fileUpload(e);
                  e.target.value = "";
                }}
                accept="video/mp4, video/ogg, video/mov, video/hevc, video/h.264, image/png, image/jpeg, image/jpg, image/heif, image/heic, application/pdf"
                multiple={true}
              />
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ width: "40px", height: "40px" }}
              >
                <img
                  src="/images/icons/outline.svg"
                  alt=""
                  // onClick={() => fileUploader.current.click()}
                />
              </div>
              <div
                className="w-100 d-inline-flex bg-gray radius-4 flex-column px-2 py-10 overflow-hidden"
                style={chatDetails.document.length === 0 ? {} : { gap: "10px" }}
              >
                <span
                  className={"w-100 font-14 font-medium " + classes.editable}
                  id="editableSpan"
                  role="textbox"
                  contentEditable="true"
                  style={{
                    outline: "none",
                    lineHeight: "20px",
                    maxHeight: "96px",
                    overflow: "scroll",
                    display: "block",
                  }}
                  suppressContentEditableWarning={true}
                  onInput={(e) => {
                    setChatDetails({
                      ...chatDetails,
                      message: e.currentTarget.innerHTML,
                    });
                    setBottomPadding(
                      document.getElementById("footer").clientHeight + 8 + "px"
                    );
                    if (socket) {
                      socket.emit("send-typing-status", selectedUser._id);
                    }
                  }}
                  placeholder="Write a message..."
                />

                <div
                  className={
                    "d-flex align-items-center overflow-scroll w-100 position-relative " +
                    classes.documents
                  }
                  style={{ gap: "8px" }}
                >
                  {chatDetails.document.length !== 0 &&
                    chatDetails.document?.map((item, i) => (
                      <div
                        className="position-relative bg-white d-flex align-items-center justify-content-center radius-4 overflow-hidden"
                        key={i}
                        style={{
                          width: "64px",
                          minWidth: "64px",
                          height: "64px",
                        }}
                      >
                        {handleExtension(item) === "pdf" && (
                          <img src="/images/icons/file-text.svg" alt="" />
                        )}
                        {(handleExtension(item) === "mp4" ||
                          handleExtension(item) === "ogg" ||
                          handleExtension(item) === "mov" ||
                          handleExtension(item) === "hevc" ||
                          handleExtension(item) === "h.264") && (
                          <video
                            src={item}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                            }}
                            controls={false}
                          />
                        )}
                        {(handleExtension(item) === "png" ||
                          handleExtension(item) === "jpeg" ||
                          handleExtension(item) === "jpg" ||
                          handleExtension(item) === "heif" ||
                          handleExtension(item) === "heic") && (
                          <img
                            src={item}
                            alt=""
                            style={{ maxWidth: "100%", maxHeight: "100%" }}
                          />
                        )}
                        <img
                          src="/images/icons/clock_gray.svg"
                          alt=""
                          className="position-absolute"
                          style={{
                            top: "4px",
                            right: "4px",
                            width: "16px",
                            height: "16px",
                          }}
                          onClick={() => handleRemove(item)}
                        />
                      </div>
                    ))}
                </div>
              </div>
              <img
                src={
                  chatDetails.message === "" &&
                  chatDetails.document.length === 0
                    ? "/images/icons/PaperPlaneTilt.svg"
                    : "/images/icons/PaperPlaneTiltGreen.svg"
                }
                alt=""
                onClick={() =>
                  (chatDetails.message !== "" ||
                    chatDetails.document.length !== 0) &&
                  sendMessage()
                }
              />
            </div>
          </React.Fragment>
        )}
      </div>
    </section>
  );
};

export default Index;
