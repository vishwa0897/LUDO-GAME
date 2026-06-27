import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import LudoGame from './LudoLogic';

// Backend server se connection banayein
const socket = io('http://localhost:3001');
const game = new LudoGame();

function App() {
  const [dice, setDice] = useState(1);
  const [message, setMessage] = useState("Game shuru karein!");
  const [playersData, setPlayersData] = useState(game.playerSteps);

  // Yeh tab chalega jab dusra player koi move karega
  useEffect(() => {
    // Dusre player ka dice roll sunna
    socket.on('diceRolled', (data) => {
      setDice(data.value);
      setMessage(`Dusre player ne ${data.value} laya!`);
    });

    // Dusre player ki goti chalna sunna
    socket.on('tokenMoved', (data) => {
      const result = game.moveToken(data.color, data.tokenIndex, data.diceValue);
      setMessage(`Opponent move: ${result}`);
      setPlayersData({ ...game.playerSteps }); // Screen update karo
    });

    // Cleanup: Jab component unmount ho toh listeners hata dein
    return () => {
      socket.off('diceRolled');
      socket.off('tokenMoved');
    };
  }, []);

  // Jab aap khud button dabate hain
  const handleMyTurn = (color, tokenIndex) => {
    // 1. Apna move locally karo
    const number = game.rollDice();
    setDice(number);
    const result = game.moveToken(color, tokenIndex, number);
    setMessage(result);
    setPlayersData({ ...game.playerSteps });

    // 2. Server ko batao taaki woh dusro ko bata sake
    socket.emit('rollDice', { color: color, value: number });
    socket.emit('moveToken', { color: color, tokenIndex: tokenIndex, diceValue: number });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Multiplayer Ludo Test 🌐</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid black' }}>
        <h2>Dice: {dice}</h2>
        <p><strong>Status:</strong> {message}</p>
        
        {/* Test karne ke liye Button */}
        <button 
          onClick={() => handleMyTurn('red', 0)} 
          style={{ padding: '10px', background: 'red', color: 'white', cursor: 'pointer' }}
        >
          Red Turn (Meri Baari)
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ padding: '10px', border: '2px solid red' }}>
          <h3>Red Player Data</h3>
          <p>Goti 1 Steps: {playersData.red[0]}</p>
        </div>
      </div>
    </div>
  );
}

export default App;