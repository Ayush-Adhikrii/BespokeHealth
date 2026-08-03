import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, isToday, isYesterday } from "date-fns";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import MessageService from "../../services/MessageService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

const InboxPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messageEndRef = useRef(null);

  
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const data = await MessageService.getConversations();
        setConversations(data.conversations);
        
        
        if (conversationId && data.conversations.length > 0) {
          const selected = data.conversations.find(conv => conv.id === parseInt(conversationId));
          if (selected) {
            setCurrentConversation(selected);
          } else {
            
            navigate(`/dashboard/inbox/${data.conversations[0].id}`);
          }
        } else if (data.conversations.length > 0 && !conversationId) {
          
          navigate(`/dashboard/inbox/${data.conversations[0].id}`);
        }
      } catch {
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [conversationId, navigate]);

  
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentConversation) return;
      
      try {
        const data = await MessageService.getMessages(currentConversation.id);
        setMessages(data.messages);
        
        
        if (currentConversation.unread_count > 0) {
          await MessageService.markAsRead(currentConversation.id);
          
          setConversations(prevConversations => 
            prevConversations.map(conv => 
              conv.id === currentConversation.id 
                ? { ...conv, unread_count: 0 } 
                : conv
            )
          );
        }
      } catch {
        toast.error("Failed to load messages");
      }
    };

    fetchMessages();
  }, [currentConversation]);

  
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation) return;
    
    try {
      setSendingMessage(true);
      const data = await MessageService.sendMessage(currentConversation.id, newMessage);
      
      
      setMessages(prevMessages => [...prevMessages, data.message]);
      
      
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === currentConversation.id 
            ? { 
                ...conv, 
                last_message: {
                  content: newMessage,
                  created_at: new Date().toISOString()
                }
              } 
            : conv
        )
      );
      
      
      setNewMessage("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isToday(date)) {
        return format(date, "h:mm a");
      } else if (isYesterday(date)) {
        return "Yesterday";
      } else if (date.getFullYear() === new Date().getFullYear()) {
        return format(date, "MMM d");
      } else {
        return format(date, "MM/dd/yyyy");
      }
    } catch {
      return "Unknown time";
    }
  };

  
  const formatMessageTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isToday(date)) {
        return format(date, "h:mm a");
      } else if (isYesterday(date)) {
        return `Yesterday at ${format(date, "h:mm a")}`;
      } else {
        return format(date, "MMM d, yyyy 'at' h:mm a");
      }
    } catch {
      return "Unknown time";
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-8rem)]">
        <div className="flex h-full">
          
          <div className="w-full max-w-xs border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
            </div>
            
            
            <div className="flex-1 overflow-y-auto">
              {loading && conversations.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                  </svg>
                  <p className="text-gray-500">No conversations yet</p>
                  {user.role === "Patient" && (
                    <button 
                      onClick={() => navigate("/doctors")}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Find a doctor to message
                    </button>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {conversations.map(conversation => {
                    
                    const otherPerson = user.role === "Doctor" 
                      ? conversation.patient
                      : conversation.doctor;
                      
                    return (
                      <li 
                        key={conversation.id} 
                        className={`hover:bg-gray-50 cursor-pointer 
                          ${currentConversation?.id === conversation.id ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          navigate(`/dashboard/inbox/${conversation.id}`);
                          setCurrentConversation(conversation);
                        }}
                      >
                        <div className="relative px-4 py-4">
                          <div className="flex items-start">
                            
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                              {otherPerson?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            
                            
                            <div className="ml-3 flex-1 overflow-hidden">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {user.role === "Doctor" ? "Patient " : "Dr. "}
                                  {otherPerson?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatTimestamp(conversation.last_message?.created_at)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.last_message?.content || "No messages yet"}
                              </p>
                            </div>
                          </div>
                          
                          
                          {conversation.unread_count > 0 && (
                            <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          
          
          <div className="flex-1 flex flex-col">
            {currentConversation ? (
              <>
                
                <div className="p-4 border-b border-gray-200 flex items-center">
                  {user.role === "Doctor" ? (
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                        {currentConversation.patient?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">Patient {currentConversation.patient?.name}</p>
                        <p className="text-xs text-gray-500">{currentConversation.patient?.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                        {currentConversation.doctor?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">Dr. {currentConversation.doctor?.name}</p>
                        <p className="text-xs text-gray-500">{currentConversation.doctor?.speciality}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">No messages yet. Send a message to start the conversation.</p>
                      </div>
                    ) : (
                      messages.map(message => {
                        const isCurrentUser = 
                          (user.role === "Doctor" && message.sender_type === "doctor") || 
                          (user.role === "Patient" && message.sender_type === "patient");
                          
                        return (
                          <div 
                            key={message.id} 
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isCurrentUser 
                                  ? 'bg-blue-600 text-white rounded-br-none' 
                                  : 'bg-white text-gray-800 rounded-bl-none shadow'
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className={`text-xs mt-1 text-right ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
                                {formatMessageTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messageEndRef} />
                  </div>
                </div>
                
                
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-300 rounded-l-md py-2 px-4 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-blue-600 text-white py-2 px-4 rounded-r-md hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {sendingMessage ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                  </svg>
                  <h3 className="text-xl font-medium text-gray-900">Your Messages</h3>
                  <p className="text-gray-500 mt-2">Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InboxPage;