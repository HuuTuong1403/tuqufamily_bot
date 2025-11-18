const { axiosInstance } = require("./axios");

function sendMessage(messageObj, messageText) {
  return axiosInstance.post("sendMessage", {
    chat_id: messageObj.chat.id,
    text: messageText,
  });
}

function handleMessage(messageObj) {
  const messageText = messageObj.text || "";

  if (messageText.charAt(0) === "/") {
    const command = messageText.substr(1);

    switch (command) {
      case "start":
        return sendMessage(messageObj, "Hello, how are you?");

      default:
        return sendMessage(messageObj, "Command not found");
    }
  } else {
    return sendMessage(messageObj, messageText);
  }
}

module.exports = { handleMessage };