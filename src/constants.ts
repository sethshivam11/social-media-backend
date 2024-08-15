export const ChatEventEnum = Object.freeze({
  CONNECTED_EVENT: "connected",
  DISCONNECT_EVENT: "disconnect",
  TYPING_EVENT: "typing",
  STOP_TYPING_EVENT: "stopTyping",
  NEW_GROUP_CHAT_EVENT: "newGroup",
  NEW_CHAT_EVENT: "newChat",
  SOCKET_ERROR_EVENT: "socketError",
  MESSAGE_RECIEVED_EVENT: "messageRecieved",
  MESSAGE_DELETE_EVENT: "messageDeleted",
  GROUP_NAME_UPDATE_EVENT: "updateGroupName",
  GROUP_DELETE_EVENT: "deleteGroup",
  NEW_REACT_EVENT: "someoneReacted",
  NEW_UNREACT_EVENT: "someoneUnreacted",
  NEW_EDIT_EVENT: "someoneEditedHisMessage",
  NEW_PARTICIPANT_ADDED_EVENT: "newParticipantAdded",
  PARTICIPANT_REMOVED_EVENT: "participantRemoved",
  GROUP_DETAILS_UPDATED: "groupDetailsUpdated",
  DELETE_GROUP_EVENT: "groupDeleted",
  GROUP_LEAVE_EVENT: "someoneLeftGroup",
  NEW_ADMIN_EVENT: "someoneBecameAdmin",
  ADMIN_REMOVE_EVENT: "someoneRemovedFromAdmin",
  NEW_CALL_EVENT: "newCall",
  CALL_ACCEPTED_EVENT: "callAccepted",
  CALL_DISCONNECTED_EVENT: "callDisconnected",
});

export const DB_NAME = "sociial";

export const DEFAULT_USER_AVATAR =
  "https://res.cloudinary.com/dv3qbj0bn/image/upload/v1723483837/sociial/settings/r5pvoicvcxtyhjkgqk8y.png";

export const DEFAULT_GROUP_ICON =
  "https://res.cloudinary.com/dv3qbj0bn/image/upload/v1723483856/sociial/settings/feahtus4algwiixi0zmi.png";
