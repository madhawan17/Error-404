// import React, { useState, useEffect, useRef } from "react";
// // @ts-ignore
// const SpeechRecognition =
//   window.SpeechRecognition || window.webkitSpeechRecognition;
// import { Send, Bot, User } from "lucide-react";
// import { v4 as uuidv4 } from "uuid";

// type Message = {
//   role: "user" | "assistant";
//   content: string;
// };

// const TherapistChatPage = () => {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [micError, setMicError] = useState<string | null>(null);
//   const recognitionRef = useRef<any>(null);
//   const session_id = useRef<string>(`session_${uuidv4()}`);
//   const chatEndRef = useRef<HTMLDivElement>(null);
//   // Microphone logic
//   const handleMicClick = () => {
//     setMicError(null);
//     if (!SpeechRecognition) {
//       setMicError("Speech recognition not supported in this browser.");
//       return;
//     }
//     if (isRecording) {
//       recognitionRef.current?.stop();
//       setIsRecording(false);
//       return;
//     }
//     const recognition = new SpeechRecognition();
//     recognition.lang = "en-US";
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;
//     recognition.continuous = false;
//     recognition.onstart = () => setIsRecording(true);
//     recognition.onerror = (event: any) => {
//       setMicError(event.error || "Mic error");
//       setIsRecording(false);
//     };
//     recognition.onend = () => setIsRecording(false);
//     recognition.onresult = (event: any) => {
//       if (event.results && event.results[0] && event.results[0][0]) {
//         setInput((prev) => prev + event.results[0][0].transcript);
//       }
//     };
//     recognitionRef.current = recognition;
//     recognition.start();
//   };

//   useEffect(() => {
//     setMessages([
//       {
//         role: "assistant",
//         content: "Hello! I'm Medibot. How can I help you today?",
//       },
//     ]);
//   }, []);

//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isLoading]);

//   const handleSendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (input.trim() === "" || isLoading) return;

//     const userMessage: Message = { role: "user", content: input };
//     setMessages((prevMessages) => [
//       ...prevMessages,
//       userMessage,
//       { role: "assistant", content: "" },
//     ]);

//     setInput("");
//     setIsLoading(true);

//     try {
//       const response = await fetch("http://127.0.0.1:8000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           prompt: input,
//           session_id: session_id.current,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Network response was not ok");
//       }

//       const reader = response.body?.getReader();
//       if (!reader) {
//         throw new Error("Failed to get response reader");
//       }

//       const decoder = new TextDecoder();
//       let fullResponse = ""; // Keep track of the full response
//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) {
//           break;
//         }

//         // --- THE GUARANTEED FIX IS HERE ---
//         // We decode the incoming chunk and append it to our full response string
//         fullResponse += decoder.decode(value, { stream: true });

//         // Then, we update the UI by REPLACING the last message's content
//         // with the latest version of the full response.
//         setMessages((prevMessages) => {
//           const newMessages = [...prevMessages];
//           newMessages[newMessages.length - 1].content = fullResponse;
//           return newMessages;
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setMessages((prevMessages) => {
//         const newMessages = [...prevMessages];
//         newMessages[newMessages.length - 1].content =
//           "Sorry, something went wrong. Please try again.";
//         return newMessages;
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col h-screen bg-gray-50 font-sans">
//       <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
//         <h1 className="text-xl font-bold text-center text-gray-800">
//           Chat with Medibot
//         </h1>
//       </header>
//       <div className="flex-grow overflow-y-auto p-6 space-y-6">
//         {messages.map(
//           (msg, index) =>
//             msg.content && (
//               <div
//                 key={index}
//                 className={`flex items-start gap-3 ${
//                   msg.role === "user" ? "justify-end" : "justify-start"
//                 }`}
//               >
//                 {msg.role === "assistant" && (
//                   <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
//                     <Bot size={20} />
//                   </div>
//                 )}
//                 <div
//                   className={`p-4 rounded-2xl max-w-lg shadow-sm ${
//                     msg.role === "user"
//                       ? "bg-blue-500 text-white rounded-br-none"
//                       : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
//                   }`}
//                 >
//                   <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>
//                     {msg.content}
//                   </p>
//                 </div>
//                 {msg.role === "user" && (
//                   <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white flex-shrink-0">
//                     <User size={20} />
//                   </div>
//                 )}
//               </div>
//             )
//         )}
//         <div ref={chatEndRef} />
//       </div>
//       <div className="p-4 bg-white border-t border-gray-200 shadow-inner">
//         <form
//           onSubmit={handleSendMessage}
//           className="flex items-center space-x-3"
//         >
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Type your message..."
//             className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
//             disabled={isLoading}
//             autoComplete="off"
//           />
//           <button
//             type="button"
//             className={`p-3 rounded-full border ${
//               isRecording
//                 ? "bg-red-500 text-white"
//                 : "bg-gray-200 text-gray-700"
//             } hover:bg-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400`}
//             onClick={handleMicClick}
//             disabled={isLoading}
//             aria-label={isRecording ? "Stop recording" : "Start recording"}
//           >
//             {isRecording ? (
//               <svg
//                 width="20"
//                 height="20"
//                 fill="currentColor"
//                 viewBox="0 0 20 20"
//               >
//                 <circle cx="10" cy="10" r="8" />
//               </svg>
//             ) : (
//               <svg
//                 width="20"
//                 height="20"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 viewBox="0 0 24 24"
//               >
//                 <path d="M12 18v2m0-2a6 6 0 0 0 6-6V9a6 6 0 0 0-12 0v3a6 6 0 0 0 6 6zm0 0v2" />
//               </svg>
//             )}
//           </button>
//           <button
//             type="submit"
//             className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
//             disabled={isLoading || input.trim() === ""}
//           >
//             <Send size={20} />
//           </button>
//         </form>
//         {micError && (
//           <div className="text-red-500 text-xs mt-2">{micError}</div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TherapistChatPage;


import React, { useState, useEffect, useRef } from "react";
// @ts-ignore
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
import { Send, Bot, User, Mic, MicOff } from "lucide-react"; // Using Mic and MicOff for better UI
import { v4 as uuidv4 } from "uuid";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const TherapistChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const session_id = useRef<string>(`session_${uuidv4()}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- IMPROVED MICROPHONE LOGIC ---
  const handleMicClick = () => {
    setMicError(null);
    if (!SpeechRecognition) {
      setMicError("Speech recognition not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false; // We only want the final result
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setInput(""); // Clear the input when recording starts
    };

    recognition.onerror = (event: any) => {
      setMicError(event.error || "Microphone error. Please try again.");
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      // The `onresult` event will handle sending the message.
    };

    recognition.onresult = (event: any) => {
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        // Automatically send the message once speech is recognized
        if (transcript) {
          handleSendMessage(transcript);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: "Hello! I'm Medibot. How can I help you today?",
      },
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // --- MODIFIED TO ACCEPT A MESSAGE ARGUMENT ---
  const handleSendMessage = async (messageToSend: string | null = null) => {
    const textToSend = messageToSend || input;
    if (textToSend.trim() === "" || isLoading) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prevMessages) => [
      ...prevMessages,
      userMessage,
      { role: "assistant", content: "" }, // Placeholder for assistant's response
    ]);

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          session_id: session_id.current,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      const decoder = new TextDecoder();
      let fullResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        fullResponse += decoder.decode(value, { stream: true });
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1].content = fullResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1].content =
          "Sorry, something went wrong. Please try again.";
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Form handler for text input
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h1 className="text-xl font-bold text-center text-gray-800">
          Chat with Medibot
        </h1>
      </header>
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {messages.map(
          (msg, index) =>
            msg.content && (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                    <Bot size={20} />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl max-w-lg shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white flex-shrink-0">
                    <User size={20} />
                  </div>
                )}
              </div>
            )
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 bg-white border-t border-gray-200 shadow-inner">
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message or use the microphone..."
            className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="button"
            className={`p-3 rounded-full border ${
              isRecording
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700"
            } hover:bg-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400`}
            onClick={handleMicClick}
            disabled={isLoading}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isLoading || input.trim() === ""}
          >
            <Send size={20} />
          </button>
        </form>
        {micError && (
          <div className="text-red-500 text-xs mt-2">{micError}</div>
        )}
      </div>
    </div>
  );
};

export default TherapistChatPage;