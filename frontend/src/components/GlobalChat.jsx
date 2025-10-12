import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import { useGlobalChat, useSendMessage } from "../hooks/useChat";

function GlobalChat() {
  const { isAuthenticated } = useAuthStore();
  const [message, setMessage] = useState("");
  const [privateUserId, setPrivateUserId] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: messages, isLoading, error } = useGlobalChat();
  const sendMessageMutation = useSendMessage();

  const onlineUsers = [...new Set(messages?.map(msg => msg.username) || [])];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      await sendMessageMutation.mutateAsync(message.trim());
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div id="chat" style={{ width: 800, height: 600 }}>
        <div>
          <h4>Chat Global</h4>
          <div>
            Debes <Link to="/login">iniciar sesión</Link> para participar en el chat.
          </div>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
  <div id="salas" style={{ border: '1px solid rgb(221, 221, 221)', overflow: 'auto', paddingBottom: '10px' }}>
    <div>Salas : Sala Global</div>
  </div>

  <div style={{ display: 'flex' }}>
    <div id="chat" style={{ maxWidth: 800, maxHeight: 400, overflow: 'auto', border: '1px solid rgb(221, 221, 221)' }}>
        <div style={{ overflowY: 'auto' }}>
          {isLoading && <div>Cargando mensajes...</div>}
          {error && <div>Error al cargar mensajes</div>}

          {messages && messages.length === 0 && (
            <div>
              No hay mensajes aún. ¡Sé el primero en escribir!
            </div>
          )}

          {messages && messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((msg) => (
            <div key={msg.id}>
              <div>
                {msg.username}
              </div>
              <div style={{ wordWrap: 'break-word', maxWidth: '100%' }}>{msg.message}</div>
              <div>
                {new Date(msg.created_at).toLocaleString()}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {sendMessageMutation.isError && (
          <div>
            Error al enviar mensaje: {sendMessageMutation.error?.message}
          </div>
        )}
      </div>

        <div id="usuarios-registrados" style={{ border: '1px solid rgb(221, 221, 221)', maxWidth: 300, maxHeight: 800, overflow: 'auto', padding: 10 }}>
          <h5>Usuarios en línea:</h5>
          {onlineUsers.length === 0 ? (
            <div>Ninguno</div>
          ) : (
            onlineUsers.map(user => <div key={user} onClick={() => setPrivateUserId(user)} style={{ cursor: 'pointer' }}>{user}</div>)
          )}
        </div>
  </div>

      <div id="enviar" style={{ border: '1px solid #ddd' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
          />
          <button
            type="submit"
            disabled={sendMessageMutation.isPending || !message.trim()}
            style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            {sendMessageMutation.isPending ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>
  </React.Fragment>
  );
}

export default GlobalChat;