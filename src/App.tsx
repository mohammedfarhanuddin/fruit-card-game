import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { io, Socket } from 'socket.io-client';
import Game from './components/Game';

// Update this URL with your ngrok URL when you start the tunnel
const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'https://show-5oru.onrender.com' 
  : 'http://localhost:3001';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f0f0;
  padding: 20px;
  box-sizing: border-box;
`;

const Button = styled.button`
  padding: 15px 30px;
  margin: 10px;
  font-size: clamp(14px, 3vw, 18px);
  border-radius: 8px;
  border: none;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
  max-width: 300px;

  &:hover {
    background-color: #45a049;
  }

  @media (max-width: 480px) {
    padding: 12px 24px;
    margin: 8px;
  }
`;

const RoomInput = styled.input`
  padding: 10px;
  margin: 10px;
  font-size: clamp(14px, 3vw, 16px);
  border-radius: 4px;
  border: 1px solid #ccc;
  width: 100%;
  max-width: 300px;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding: 8px;
    margin: 8px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 300px;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 300px;
`;

const RoomIdDisplay = styled.div`
  margin: 20px;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  font-size: clamp(14px, 3vw, 16px);
  text-align: center;
`;

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState('');
  const [gameState, setGameState] = useState<'lobby' | 'game'>('lobby');
  const [playerId, setPlayerId] = useState('');
  const [displayRoomId, setDisplayRoomId] = useState('');

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('connect_timeout', (timeout) => {
      console.error('Socket connection timeout:', timeout);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });

    socket.on('roomCreated', (newRoomId: string) => {
      setDisplayRoomId(newRoomId);
      setRoomId(newRoomId);
    });

    socket.on('joinedRoom', (joinedRoomId: string) => {
      setDisplayRoomId(joinedRoomId);
      setRoomId(joinedRoomId);
    });

    socket.on('gameStarted', () => {
      setGameState('game');
    });

    socket.on('error', (error: string) => {
      alert(error);
    });

    setSocket(socket);
    setPlayerId(Math.random().toString(36).substr(2, 9));

    return () => {
      socket.disconnect();
      socket.off('roomCreated');
      socket.off('joinedRoom');
      socket.off('gameStarted');
      socket.off('error');
    };
  }, []);

  const createRoom = () => {
    if (socket) {
      socket.emit('createRoom');
    }
  };

  const joinRoom = () => {
    if (socket && roomId) {
      socket.emit('joinRoom', roomId);
    }
  };

  const joinRandom = () => {
    if (socket) {
      socket.emit('joinRandom');
    }
  };

  const startGame = () => {
    if (socket) {
      socket.emit('startGame');
    }
  };

  return (
    <AppContainer>
      {gameState === 'lobby' ? (
        <>
          <ButtonContainer>
            <Button onClick={createRoom}>Create Room</Button>
            <InputContainer>
              <RoomInput
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
              <Button onClick={joinRoom}>Join Room</Button>
            </InputContainer>
            <Button onClick={joinRandom}>Join Random</Button>
            {displayRoomId && (
              <>
                <RoomIdDisplay>
                  Room ID: {displayRoomId}
                </RoomIdDisplay>
                <Button onClick={startGame}>Start Game</Button>
              </>
            )}
          </ButtonContainer>
        </>
      ) : (
        socket && playerId && <Game socket={socket} playerId={playerId} />
      )}
    </AppContainer>
  );
};

export default App; 
