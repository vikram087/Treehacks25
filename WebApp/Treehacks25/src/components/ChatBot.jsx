import { MessageCircle, X, Send } from "lucide-react";
import { useState } from "react";

function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        setMessages([...messages, { text: inputMessage, sender: "user" }]);
        setInputMessage("");

        setTimeout(() => {
            setMessages(prev => [...prev, {
                text: "This is a simulated response. Connect to the backend API to get real responses.",
                sender: "bot"
            }]);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${
                    isOpen ? 'hidden' : 'flex'
                } items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
            >
                <MessageCircle size={28} />
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-0 right-0 w-[450px] h-[600px] bg-gray-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all duration-200 ease-in-out">
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <h3 className="text-lg font-semibold text-gray-800">AI Assistant</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all duration-200"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-4">
                                <p className="text-sm">How can I help you today?</p>
                            </div>
                        )}
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${
                                    message.sender === "user" ? "justify-end" : "justify-start"
                                } items-end space-x-2`}
                            >
                                {message.sender === "bot" && (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <MessageCircle size={16} className="text-blue-600" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl ${
                                        message.sender === "user"
                                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none"
                                            : "bg-white shadow-sm text-gray-800 rounded-bl-none"
                                    } transform transition-all duration-200`}
                                >
                                    <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
                                </div>
                                {message.sender === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm">You</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 bg-white border-t">
                        <form onSubmit={handleSend} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 p-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
                            />
                            <button
                                type="submit"
                                className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatBot;