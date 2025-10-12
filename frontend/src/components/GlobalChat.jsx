  import React, { useState, useRef, useEffect } from "react";
  import { Link } from "react-router-dom";
  import useAuthStore from "../stores/authStore";
  import { useGlobalChat, useSendMessage, usePrivateChat, useSendPrivateMessage } from "../hooks/useChat";
  import useAuthUser from "../hooks/useAuthUser";
  import { API_BASE } from "../config/api";
  
  // Función para conectar a WebSocket
  const connectWebSocket = (userId, onMessage) => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      console.log('WebSocket conectado');
      // Registrar usuario en el servidor WebSocket
      ws.send(JSON.stringify({
        type: 'register',
        userId: userId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('Error procesando mensaje WebSocket:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket desconectado');
      // Reconectar después de 5 segundos
      setTimeout(() => connectWebSocket(userId, onMessage), 5000);
    };

    ws.onerror = (error) => {
      console.error('Error WebSocket:', error);
    };

    return ws;
  };

function GlobalChat() {
  const { isAuthenticated } = useAuthStore();
  const { authUser } = useAuthUser();
  const [message, setMessage] = useState("");
  const [privateUserId, setPrivateUserId] = useState(null);
  const [privateMessage, setPrivateMessage] = useState("");
  const [isPrivateChat, setIsPrivateChat] = useState(false);
  const [activeRooms, setActiveRooms] = useState(['global']); // Array para mantener las salas activas
  const [notifiedMessages, setNotifiedMessages] = useState(new Set()); // Para trackear mensajes ya notificados
  const [ws, setWs] = useState(null); // WebSocket connection
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // Usuarios conectados al feed
  const [guestUser, setGuestUser] = useState(null); // Usuario invitado (automático para chat público)
  const [guestNameInput, setGuestNameInput] = useState(""); // Input para nombre de invitado
  const [localPrivateMessages, setLocalPrivateMessages] = useState([]); // Estado local para mensajes privados
  const [localGlobalMessages, setLocalGlobalMessages] = useState([]); // Estado local para mensajes globales
  const chatContainerRef = useRef(null); // Referencia al contenedor del chat

  // Función para hacer scroll al final del chat
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const { data: messages, isLoading, error } = useGlobalChat(50, 0);
  const sendMessageMutation = useSendMessage();

  // Usuarios conectados al feed (filtrados según el tipo de usuario actual)
  const feedOnlineUsers = Array.from(onlineUsers).filter(user => {
    const currentUsername = authUser?.username || guestUser?.username;
    // Mostrar todos los usuarios conectados excepto el usuario actual
    return user !== currentUsername;
  });

  const { data: privateMessages, isLoading: privateLoading, error: privateError, refetch: refetchPrivateMessages } = usePrivateChat(privateUserId && isPrivateChat ? privateUserId : null, 50, 0, guestUser);
  const sendPrivateMessageMutation = useSendPrivateMessage(privateUserId && isPrivateChat ? privateUserId : null, guestUser, authUser);


  // Efecto para hacer scroll al final cuando se cargan mensajes
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages]);

  // Efecto para hacer scroll al final cuando se cargan mensajes privados
  useEffect(() => {
    if (privateMessages && privateMessages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [privateMessages]);

  // Efecto adicional para asegurar scroll al final después de renderizar
  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(), 200);
    return () => clearTimeout(timer);
  }, [isPrivateChat, messages, privateMessages]);


  // Función para manejar el envío del nombre de usuario
  const handleGuestNameSubmit = async (e) => {
    e.preventDefault();
    if (!guestNameInput.trim()) return;

    try {
      // Sanitizar el nombre: reemplazar espacios con guiones
      const sanitizedName = guestNameInput.trim().replace(/\s+/g, '-');

      // Configurar el usuario con el nombre elegido (sin guardar en BD)
      console.log('Usuario configurado:', { username: sanitizedName });
      setGuestUser({ username: sanitizedName });
      setGuestNameInput("");

      // Registrar usuario en WebSocket con el nombre elegido
      const websocket = connectWebSocket(sanitizedName, (message) => {
        if (message.type === 'private_message') {
          const privateMessage = message.data;
          console.log('Mensaje privado recibido via WebSocket:', privateMessage);

          // Verificar si ya notificamos este mensaje
          const messageKey = `${privateMessage.sender_username}-${privateMessage.id}`;
          if (!notifiedMessages.has(messageKey)) {
            // Agregar sala privada si no existe
            setActiveRooms(prev => {
              const privateRoom = `private-${privateMessage.sender_username}`;
              if (!prev.includes(privateRoom)) {
                console.log(`Nueva sala privada abierta con ${privateMessage.sender_username}`);
                // Si no estamos en una sala privada, abrir esta nueva
                if (!isPrivateChat) {
                  setPrivateUserId(privateMessage.sender_username);
                  setIsPrivateChat(true);
                }
                return [...prev, privateRoom];
              }
              return prev;
            });

            // Marcar como notificado
            setNotifiedMessages(prev => new Set([...prev, messageKey]));

            // Agregar mensaje recibido a la lista local
            setLocalPrivateMessages(prev => [...prev, privateMessage]);

            scrollToBottom();
          }
        } else if (message.type === 'global_message') {
          // Nuevo mensaje global recibido
          console.log('Mensaje global recibido:', message.data);
          // Agregar mensaje recibido a la lista local
          setLocalGlobalMessages(prev => [...prev, message.data]);
        } else if (message.type === 'user_online') {
          // Actualizar lista de usuarios conectados al feed
          console.log('Usuario conectado:', message.username);
          setOnlineUsers(prev => new Set([...prev, message.username]));
        } else if (message.type === 'user_offline') {
          // Remover usuario de la lista de conectados
          console.log('Usuario desconectado:', message.username);
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(message.username);
            return newSet;
          });
        }
      });
      setWs(websocket);
    } catch (error) {
      console.error('Error registrando usuario:', error);
    }
  };

  // Si no hay usuario configurado, mostrar el prompt dentro del div del chat
  if (!guestUser) {
    return (
      <React.Fragment>
        <div id="salas" style={{ border: '1px solid rgb(221, 221, 221)', overflow: 'auto', paddingBottom: '10px', marginBottom: '10px', marginTop: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold' }}>Salas:</span>
            <button
              style={{
                padding: '4px 8px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Sala Global
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <div id="chat" style={{ minHeight: 400, maxHeight: 800, overflow: 'hidden', border: '1px solid rgb(221, 221, 221)', position: 'relative', zIndex: 1, flex: 1 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              padding: '20px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
                {isAuthenticated ? 'Ingresa tu nombre de usuario para chatear' : 'Ingresa tu nombre para chatear'}
              </h3>
              <form onSubmit={handleGuestNameSubmit} style={{ width: '100%', maxWidth: '400px' }}>
                <input
                  type="text"
                  value={guestNameInput || ""}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  placeholder="Tu nombre..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    fontSize: '16px'
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!guestNameInput.trim()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Entrar al chat
                </button>
              </form>
            </div>
          </div>

          <div id="usuarios-registrados" style={{ border: '1px solid rgb(221, 221, 221)', maxWidth: 300, minWidth: 200, maxHeight: 800, overflow: 'auto', padding: 10 }}>
            <h5>Usuarios en línea:</h5>
            <div>Ninguno</div>
          </div>
        </div>

        <div id="enviar" style={{ border: '1px solid #ddd', marginBottom: '10px', position: 'relative', zIndex: 2 }}>
          <form style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4, position: 'relative', zIndex: 3 }}
              disabled
            />
            <button
              style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', position: 'relative', zIndex: 3 }}
              disabled
            >
              Enviar
            </button>
          </form>
        </div>
      </React.Fragment>
    );
  }


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      // Enviar mensaje global via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'global_message',
          from: guestUser?.username || authUser?.username,
          message: message.trim()
        }));
        setMessage("");

        // Agregar el mensaje a la lista local para mostrarlo inmediatamente
        const newMessage = {
          id: Date.now(),
          username: guestUser?.username || authUser?.username,
          message: message.trim(),
          created_at: new Date().toISOString()
        };

        // Agregar mensaje a la lista local
        setLocalGlobalMessages(prev => [...prev, newMessage]);

        scrollToBottom();
      } else {
        // Fallback a la API REST si WebSocket no está disponible
        const messageData = guestUser ? { message: message.trim(), guestUsername: guestUser.username } : { message: message.trim() };
        await sendMessageMutation.mutateAsync(messageData);
        setMessage("");
        // Hacer scroll al final después de enviar mensaje
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handlePrivateSubmit = async (e) => {
    e.preventDefault();

    if (!privateMessage.trim()) return;

    try {
      // Enviar mensaje privado via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'private_message',
          from: guestUser?.username || authUser?.username,
          to: privateUserId,
          message: privateMessage.trim()
        }));
        setPrivateMessage("");

        // Agregar el mensaje a la lista local para mostrarlo inmediatamente
        const newMessage = {
          id: Date.now(),
          sender_username: guestUser?.username || authUser?.username,
          receiver_username: privateUserId,
          message: privateMessage.trim(),
          created_at: new Date().toISOString()
        };

        // Agregar mensaje a la lista local
        setLocalPrivateMessages(prev => [...prev, newMessage]);

        scrollToBottom();
      } else {
        // Fallback a la API REST si WebSocket no está disponible
        await sendPrivateMessageMutation.mutateAsync(privateMessage.trim());
        setPrivateMessage("");
        // Refrescar mensajes privados después de enviar
        setTimeout(() => {
          if (refetchPrivateMessages) {
            refetchPrivateMessages();
          }
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error('Error sending private message:', error);
    }
  };

  const handleUserClick = (user) => {
    // No permitir chatear consigo mismo
    const currentUsername = authUser?.username || guestUser?.username;
    if (user === currentUsername) {
      return; // No hacer nada si hace clic en sí mismo
    }

    setPrivateUserId(user);
    setIsPrivateChat(true);
    // Agregar la sala privada si no existe
    setActiveRooms(prev => {
      const privateRoom = `private-${user}`;
      if (!prev.includes(privateRoom)) {
        return [...prev, privateRoom];
      }
      return prev;
    });
  };



  const switchToRoom = (roomType, userId = null) => {
    if (roomType === 'global') {
      setIsPrivateChat(false);
      setPrivateMessage("");
    } else if (roomType === 'private' && userId) {
      setPrivateUserId(userId);
      setIsPrivateChat(true);
    }
    // Hacer scroll al final después de cambiar de sala
    setTimeout(() => scrollToBottom(), 100);
  };


  const closePrivateRoom = (userId) => {
    console.log(`Cerrando chat privado con ${userId}`);
    const privateRoom = `private-${userId}`;

    // Si estamos en la sala que vamos a cerrar, volver a global
    if (isPrivateChat && privateUserId === userId) {
      setIsPrivateChat(false);
      setPrivateMessage("");
      setPrivateUserId(null);
    }

    // Remover la sala de las activas, pero mantener al menos 'global'
    setActiveRooms(prev => {
      const filtered = prev.filter(room => room !== privateRoom);
      // Asegurar que siempre haya al menos la sala global
      return filtered.length === 0 ? ['global'] : filtered;
    });
  };




  return (
    <React.Fragment>
  <div id="salas" style={{ border: '1px solid rgb(221, 221, 221)', overflow: 'auto', paddingBottom: '10px', marginBottom: '10px', marginTop: '10px' }}>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 'bold' }}>Salas:</span>
      {activeRooms.map(room => {
        if (room === 'global') {
          return (
            <button
              key={room}
              onClick={() => switchToRoom('global')}
              style={{
                padding: '4px 8px',
                background: !isPrivateChat ? '#007bff' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Sala Global
            </button>
          );
        } else if (room.startsWith('private-')) {
          const userId = room.replace('private-', '');
          return (
            <div key={room} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => switchToRoom('private', userId)}
                style={{
                  padding: '4px 8px',
                  background: isPrivateChat && privateUserId === userId ? '#28a745' : '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Chat Privado con {userId}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closePrivateRoom(userId);
                }}
                style={{
                  padding: '2px 6px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '12px',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Cerrar chat privado"
              >
                ×
              </button>
            </div>
          );
        }
        return null;
      })}
    </div>
  </div>

  <div style={{ display: 'flex', marginBottom: '10px' }}>
    <div id="chat" style={{ minHeight: 400, maxHeight: 800, overflow: 'hidden', border: '1px solid rgb(221, 221, 221)', position: 'relative', zIndex: 1 }}>
       <div ref={chatContainerRef} style={{ overflowY: 'auto', height: '100%', minWidth: 800, position: 'relative' }}>
          {isPrivateChat ? (
            <>
              {privateLoading && <div>Cargando mensajes privados...</div>}
              {privateError && <div>Error al cargar mensajes privados</div>}

              {privateMessages && privateMessages.length === 0 && (
                <div>
                  No hay mensajes privados aún. ¡Inicia la conversación!
                </div>
              )}

              {[...(privateMessages || []), ...localPrivateMessages].map((msg) => {
                return (
                  <div key={msg.id} id={msg.id}>
                    <div>
                      <strong>{msg.sender_username || msg.sender_id}</strong> → <strong>{msg.receiver_username || msg.receiver_id}</strong>
                    </div>
                    <div style={{ wordWrap: 'break-word', maxWidth: '100%' }}>{msg.message}</div>
                    <div>
                      {new Date(msg.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {isLoading && <div>Cargando mensajes...</div>}
              {error && <div>Error al cargar mensajes</div>}

              {messages && messages.length === 0 && (
                <div>
                  No hay mensajes aún. ¡Sé el primero en escribir!
                </div>
              )}

              {[...(messages || []), ...localGlobalMessages].map((msg) => (
                <div key={msg.id} id={msg.id}>
                  <div>
                    <strong>{msg.username || msg.display_name || guestUser?.username}</strong>
                  </div>
                  <div style={{ wordWrap: 'break-word', maxWidth: '100%' }}>{msg.message}</div>
                  <div>
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {isPrivateChat ? (
          sendPrivateMessageMutation.isError && (
            <div>
              Error al enviar mensaje privado: {sendPrivateMessageMutation.error?.message}
            </div>
          )
        ) : (
          sendMessageMutation.isError && (
            <div>
              Error al enviar mensaje: {sendMessageMutation.error?.message}
            </div>
          )
        )}
      </div>

        <div id="usuarios-registrados" style={{ border: '1px solid rgb(221, 221, 221)', maxWidth: 300, minWidth: 200, maxHeight: 800, overflow: 'auto', padding: 10 }}>
          <h5>Usuarios en línea:</h5>
          {feedOnlineUsers.length === 0 ? (
            <div>Ninguno</div>
          ) : (
            feedOnlineUsers.map(user => {
              // Para usuarios registrados, mostrar display_name si existe, sino username
              const displayName = authUser && user === authUser.username ? (authUser.display_name || authUser.username) : user;
              return (
                <div key={user} onClick={() => handleUserClick(user)} style={{ cursor: 'pointer' }}>
                  {displayName}
                </div>
              );
            })
          )}
        </div>
  </div>

      <div id="enviar" style={{ border: '1px solid #ddd', marginBottom: '10px', position: 'relative', zIndex: 2 }}>
        {isPrivateChat ? (
          <form onSubmit={handlePrivateSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={privateMessage}
              onChange={(e) => setPrivateMessage(e.target.value)}
              placeholder={`Mensaje privado a ${privateUserId}...`}
              style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4, position: 'relative', zIndex: 3 }}
            />
            <button
              type="submit"
              disabled={sendPrivateMessageMutation.isPending || !privateMessage.trim()}
              style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', position: 'relative', zIndex: 3 }}
            >
              {sendPrivateMessageMutation.isPending ? "Enviando..." : "Enviar Privado"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4, position: 'relative', zIndex: 3 }}
            />
            <button
              type="submit"
              disabled={sendMessageMutation.isPending || !message.trim()}
              style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', position: 'relative', zIndex: 3 }}
            >
              {sendMessageMutation.isPending ? "Enviando..." : "Enviar"}
            </button>
          </form>
        )}
      </div>

  </React.Fragment>
  );
}

export default GlobalChat;