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
  const chatContainerRef = useRef(null); // Referencia al contenedor del chat

  const { data: messages, isLoading, error } = useGlobalChat(50, 0);
  const sendMessageMutation = useSendMessage();

  // Usuarios conectados al feed (solo usuarios registrados, excluyendo al usuario actual)
  const feedOnlineUsers = Array.from(onlineUsers).filter(user => {
    const currentUsername = authUser?.username || guestUser?.username;
    return user !== currentUsername;
  });

  const { data: privateMessages, isLoading: privateLoading, error: privateError } = usePrivateChat(privateUserId && isPrivateChat ? privateUserId : null, 50, 0);
  const sendPrivateMessageMutation = useSendPrivateMessage(privateUserId && isPrivateChat ? privateUserId : null);

  // Efecto para conectar WebSocket cuando el usuario está autenticado
  useEffect(() => {
    if (authUser && !ws) {
      const userId = authUser.id;
      const websocket = connectWebSocket(userId, (message) => {
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

            // Hacer scroll al final cuando llega un nuevo mensaje
            setTimeout(() => scrollToBottom(), 100);
          }
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

      return () => {
        if (websocket) {
          websocket.close();
        }
      };
    }
  }, [authUser, ws, isPrivateChat, notifiedMessages]);

  // Efecto para hacer scroll al final cuando se cargan mensajes
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
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

  // Chat público - asignar usuario invitado automáticamente si no está autenticado
  useEffect(() => {
    if (!isAuthenticated && !guestUser) {
      const guestId = `Invitado-${crypto.randomUUID().slice(0, 8)}`;
      setGuestUser({ username: guestId, id: guestId });
      // Registrar usuario invitado en WebSocket
      const websocket = connectWebSocket(guestId, (message) => {
        if (message.type === 'private_message') {
          const privateMessage = message.data;
          console.log('Mensaje privado recibido via WebSocket (invitado):', privateMessage);

          // Verificar si ya notificamos este mensaje
          const messageKey = `${privateMessage.sender_username}-${privateMessage.id}`;
          if (!notifiedMessages.has(messageKey)) {
            // Agregar sala privada si no existe
            setActiveRooms(prev => {
              const privateRoom = `private-${privateMessage.sender_username}`;
              if (!prev.includes(privateRoom)) {
                console.log(`Nueva sala privada abierta con ${privateMessage.sender_username} (invitado)`);
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

            // Hacer scroll al final cuando llega un nuevo mensaje
            setTimeout(() => scrollToBottom(), 100);
          }
        } else if (message.type === 'user_online') {
          // Actualizar lista de usuarios conectados al feed
          console.log('Usuario conectado (invitado):', message.username);
          setOnlineUsers(prev => new Set([...prev, message.username]));
        } else if (message.type === 'user_offline') {
          // Remover usuario de la lista de conectados
          console.log('Usuario desconectado (invitado):', message.username);
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(message.username);
            return newSet;
          });
        }
      });
      setWs(websocket);
    }
  }, [isAuthenticated, guestUser]);

  // Efecto de respaldo para verificar mensajes privados no leídos periódicamente (por si WebSocket falla)
  useEffect(() => {
    const checkUnreadPrivateMessages = async () => {
      if (!authUser && !guestUser) return;

      try {
        // Verificar cada usuario en línea si hay mensajes privados no leídos
        for (const user of onlineUsers) {
          if (user !== authUser?.username && user !== guestUser?.username) {
            const response = await fetch(`${API_BASE}/private/${user}?limit=1&offset=0`, {
              credentials: 'include',
            });

            if (response.ok) {
              const messages = await response.json();
              if (messages && messages.length > 0) {
                // Verificar si el último mensaje es para el usuario actual
                const lastMessage = messages[0];
                if (lastMessage.receiver_username === authUser?.username || lastMessage.receiver_username === guestUser?.username) {
                  // Verificar si ya notificamos este mensaje
                  const messageKey = `${lastMessage.sender_username}-${lastMessage.id}`;
                  if (!notifiedMessages.has(messageKey)) {
                    // Agregar sala privada si no existe
                    setActiveRooms(prev => {
                      const privateRoom = `private-${lastMessage.sender_username}`;
                      if (!prev.includes(privateRoom)) {
                        console.log(`Nuevo mensaje privado de ${lastMessage.sender_username} (fallback)`);
                        // Si no estamos en una sala privada, abrir esta nueva
                        if (!isPrivateChat) {
                          setPrivateUserId(lastMessage.sender_username);
                          setIsPrivateChat(true);
                        }
                        return [...prev, privateRoom];
                      }
                      return prev;
                    });

                    // Marcar como notificado
                    setNotifiedMessages(prev => new Set([...prev, messageKey]));
                  }
                }
              }
            } else if (response.status === 401) {
              // Si no está autenticado, no intentar verificar mensajes privados
              console.log('Usuario no autenticado para verificar mensajes privados');
            }
          }
        }
      } catch (error) {
        console.error('Error checking unread messages (fallback):', error);
      }
    };

    // Verificar cada 30 segundos como respaldo (menos frecuente que antes)
    const interval = setInterval(checkUnreadPrivateMessages, 30000);
    return () => clearInterval(interval);
  }, [authUser, guestUser, onlineUsers, isPrivateChat, notifiedMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      const messageData = guestUser ? { message: message.trim(), guestUsername: guestUser.username } : { message: message.trim() };
      await sendMessageMutation.mutateAsync(messageData);
      setMessage("");
      // Hacer scroll al final después de enviar mensaje
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handlePrivateSubmit = async (e) => {
    e.preventDefault();

    if (!privateMessage.trim()) return;

    try {
      await sendPrivateMessageMutation.mutateAsync(privateMessage.trim());
      setPrivateMessage("");
      // Hacer scroll al final después de enviar mensaje privado
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending private message:', error);
    }
  };

  const handleUserClick = (user) => {
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

  // Funciones de invitado ya no necesarias para chat público

  const handleBackToGlobal = () => {
    setIsPrivateChat(false);
    setPrivateMessage("");
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

  // Función para hacer scroll al final del chat
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      console.log('Scroll to bottom executed, scrollTop:', chatContainerRef.current.scrollTop, 'scrollHeight:', chatContainerRef.current.scrollHeight);
    }
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

  // Chat público - no requiere autenticación

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
    <div id="chat" style={{ minHeight: 400, overflow: 'hidden', border: '1px solid rgb(221, 221, 221)', position: 'relative', zIndex: 1 }}>
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

              {privateMessages && privateMessages.map((msg) => (
                <div key={msg.id} id={msg.id}>
                  <div>
                    <strong>{msg.sender_username}</strong> → <strong>{msg.receiver_username}</strong>
                  </div>
                  <div style={{ wordWrap: 'break-word', maxWidth: '100%' }}>{msg.message}</div>
                  <div>
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
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

              {messages && messages.slice().reverse().map((msg) => (
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

        <div id="usuarios-registrados" style={{ border: '1px solid rgb(221, 221, 221)', maxWidth: 300, maxHeight: 800, overflow: 'auto', padding: 10 }}>
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