import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Socket } from 'socket.io-client';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const Table = styled.div`
  position: relative;
  width: 600px;
  height: 600px;
  background-color: #2e7d32;
  border-radius: 20px;
  margin: 20px;
`;

const Card = styled.div<{ isSelected?: boolean }>`
  position: absolute;
  width: 80px;
  height: 120px;
  background-color: ${props => props.isSelected ? '#ffeb3b' : '#fff'};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);

  &:hover {
    transform: translateY(-5px);
  }
`;

const PlayerArea = styled.div<{ position: 'top' | 'right' | 'bottom' | 'left' }>`
  position: absolute;
  display: flex;
  ${props => {
    switch (props.position) {
      case 'top':
        return 'top: 0; left: 50%; transform: translateX(-50%);';
      case 'right':
        return 'right: 0; top: 50%; transform: translateY(-50%);';
      case 'bottom':
        return 'bottom: 0; left: 50%; transform: translateX(-50%);';
      case 'left':
        return 'left: 0; top: 50%; transform: translateY(-50%);';
    }
  }}
`;

const ShowButton = styled.button`
  padding: 10px 20px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;

  &:hover {
    background-color: #d32f2f;
  }
`;

interface GameProps {
  socket: Socket;
  playerId: string;
}

interface Card {
  id: string;
  fruit: string;
  isSelected: boolean;
}

const Game: React.FC<GameProps> = ({ socket, playerId }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [showButtonVisible, setShowButtonVisible] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    socket.on('gameState', (gameState) => {
      setCards(gameState.cards);
      setPlayerCards(gameState.playerCards);
      setGameStarted(gameState.started);
    });

    socket.on('showButton', () => {
      setShowButtonVisible(true);
    });

    return () => {
      socket.off('gameState');
      socket.off('showButton');
    };
  }, [socket]);

  const handleCardClick = (cardId: string) => {
    if (selectedCards.length < 4 && !selectedCards.includes(cardId)) {
      setSelectedCards([...selectedCards, cardId]);
      socket.emit('selectCard', cardId);
    }
  };

  const handleShowClick = () => {
    socket.emit('showCards');
    setShowButtonVisible(false);
  };

  return (
    <GameContainer>
      <Table>
        {cards.map((card) => (
          <Card
            key={card.id}
            isSelected={selectedCards.includes(card.id)}
            onClick={() => handleCardClick(card.id)}
            style={{
              left: `${Math.random() * 500}px`,
              top: `${Math.random() * 500}px`,
            }}
          >
            {card.isSelected ? card.fruit : '?'}
          </Card>
        ))}
        <PlayerArea position="top">
          {playerCards.map((card) => (
            <Card key={card.id}>
              {card.fruit}
            </Card>
          ))}
        </PlayerArea>
      </Table>
      {showButtonVisible && (
        <ShowButton onClick={handleShowClick}>Show</ShowButton>
      )}
    </GameContainer>
  );
};

export default Game; 