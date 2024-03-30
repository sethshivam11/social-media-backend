import React from "react";

interface Chat {
  _id: string;
  users: string[];
  isGroupChat: boolean;
  admin: string[];
  groupName: string;
  groupIcon: string;
  lastMessage: string;
}

interface ChatContext {
  chats: Chat[];
  newChat: Function;
  newGroupChat: Function;
  fetchChats: Function;
  addParticipants: Function;
  removeParticipants: Function;
  updateGroup: Function;
  removeGroupIcon: Function;
  leaveGroup: Function;
  deleteGroup: Function;
  makeAdmin: Function;
  removeAdmin: Function;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  page: number;
}

const initialState = {
  chats: [],
  newChat: (recieverId: string) => {
    recieverId;
  },
  newGroupChat: (group: {
    participants: string[];
    groupName: string;
    groupIcon?: File;
    admin: string;
  }) => {
    group;
  },
  fetchChats: (page: number) => {
    page;
  },
  addParticipants: (participants: string[], chatId: string) => {
    participants;
    chatId;
  },
  removeParticipants: (participants: string[], chatId: string) => {
    participants;
    chatId;
  },
  updateGroup: (
    group: { groupName?: string; groupIcon?: File },
    chatId: string
  ) => {
    group;
    chatId;
  },
  removeGroupIcon: () => {},
  leaveGroup: (chatId: string) => {
    chatId;
  },
  deleteGroup: (chatId: string) => {
    chatId;
  },
  makeAdmin: (chatId: string, userId: string) => {
    chatId;
    userId;
  },
  removeAdmin: (chatId: string, userId: string) => {
    chatId;
    userId;
  },
  setPage: () => {},
  page: 1,
};

const ChatContext = React.createContext<ChatContext>(initialState);

export default function ChatProvider (props: React.PropsWithChildren<{}>)  {
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [page, setPage] = React.useState(1);

  function fetchChats() {
    fetch(`/api/v1/chats/get?page=${page}}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return setChats(response.data);
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function newChat(reciever: string) {
    fetch(`/api/v1/chats/new/${reciever}`, {
      method: "POST",
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchChats();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function newGroupChat(group: {
    participants: string[];
    groupName: string;
    groupIcon?: File;
    admin: string;
  }) {
    const formData = new FormData();
    formData.append("participants", JSON.stringify(group.participants));
    formData.append("groupName", group.groupName);
    if (group.groupIcon) {
      formData.append("groupIcon", group.groupIcon);
    }
    formData.append("admin", group.admin);
    fetch("/api/v1/chats/newGroup", {
      method: "POST",
      body: formData,
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchChats();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function addParticipants(participants: string[], chatId: string) {
    fetch("/api/v1/chats/addParticipants", {
      method: "PATCH",
      body: JSON.stringify({ participants, chatId }),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchChats();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function removeParticipants(participants: string[], chatId: string) {
    fetch("/api/v1/chats/removeParticipants", {
      method: "PATCH",
      body: JSON.stringify({ participants, chatId }),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchChats();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function updateGroup(
    group: { groupName?: string; groupIcon?: File },
    chatId: string
  ) {
    const formData = new FormData();
    if (group.groupIcon) {
      formData.append("groupImage", group.groupIcon);
    }
    if (group.groupName) {
      formData.append("groupName", group.groupName);
    }
    formData.append("chatId", chatId);
    fetch("/api/v1/chats/updateGroup", {
      method: "PUT",
      body: formData,
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchChats();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function removeGroupIcon(chatId: string) {
    fetch(`/api/v1/chats/removeGroupImage/${chatId}`, {
      method: "PATCH",
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchChats();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function leaveGroup(chatId: string) {
    fetch(`/api/v1/chats/leaveGroup/${chatId}`, {
      method: "GET",
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchChats();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function deleteGroup(chatId: string) {
    fetch(`/api/v1/chats/deleteGroup/${chatId}`, {
      method: "DELETE",
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchChats();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function makeAdmin(chatId: string, userId: string) {
    fetch("/api/v1/chats/makeAdmin", {
      method: "PATCH",
      body: JSON.stringify({ chatId, userId }),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchChats();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  function removeAdmin(chatId: string, userId: string) {
    fetch("/api/v1/chats/removeAdmin", {
      method: "PATCH",
      body: JSON.stringify({ chatId, userId }),
    })
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          return fetchChats();
        }
        return response.message;
      })
      .catch((err) => {
        console.log(err);
        return "Something went wrong";
      });
  }

  return (
    <ChatContext.Provider
      value={{
        chats,
        fetchChats,
        newChat,
        newGroupChat,
        addParticipants,
        removeParticipants,
        updateGroup,
        removeGroupIcon,
        leaveGroup,
        deleteGroup,
        makeAdmin,
        removeAdmin,
        setPage,
        page,
      }}
    >
      {props.children}
    </ChatContext.Provider>
  );
};

export const useChats = () => React.useContext(ChatContext);
