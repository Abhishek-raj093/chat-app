import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export  const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([])
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [unseenMessages, setUnseenMessages] = useState({})

    const {socket, axios} = useContext(AuthContext)

    // Function to get all users for Sidebar
    const getUsers = async ()=> {
        try {
            const {data} = await axios.get("/api/messages/users");
            if (data.status) {
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // function to get messages for selected user
    const getMessages = async (userId) =>{
        try {
            const {data} = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Function to send message to selected user
    const sendMessages = async (messageData)=>{
        try {
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.status) {
                setMessages((prevMessages)=> [...prevMessages, data.newMessage])
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // funtion to subscribe for selescted user
    const subscribeToMessages = async()=>{
        if (!socket) return;

        socket.on("getMessage", (newMessage)=>{
            if(selectedUser && newMessage.senderId === selectedUser._id){
                newMessage.seen = true;
                setMessages((prevMessages)=> [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }else{
                setUnseenMessages((prevUnseenMessagges)=>({
                    ...prevUnseenMessagges, [newMessage.senderId] :
                    prevUnseenMessagges[newMessage.senderId] ? prevUnseenMessagges [newMessage.senderId] + 1 : 1
                }))
            }
        })
    }

    // Function to Unsubscribe from messages
    const unsubscribeFromMessages = ()=>{
        if(socket) socket.off("newMessage");
    }

    useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
    }, [socket, selectedUser]);


    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessages,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages
    }

    return (
        <ChatContext.Provider value={value}>
            { children }
        </ChatContext.Provider>
    )
}