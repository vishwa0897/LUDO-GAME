import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import LudoGame from './LudoLogic';
import './App.css';

const socket = io('http://localhost:3001');
const game = new LudoGame();

const turnOrder = ['red', 'green', 'yellow', 'blue'];

// Board par chalne ke coordinates
const pathCoordinates = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], 
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], 
  [0, 7], [0, 8], 
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], 
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], 
  [7, 14], [8, 14], 
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], 
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], 
  [14, 7], [14, 6], 
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], 
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], 
  [7, 0], [6, 0] 
];

// Home (Ghar ke andar) jane ke raste
const homePaths = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]
};

// Base (Shuruati Ghar) ke positions
const basePositions = {
  red: [[2, 2], [2, 3], [3, 2], [3, 3]],
  green: [[2, 11], [2, 12], [3, 11], [3, 12]],
  yellow: [[11, 11], [11, 12], [12, 11], [12, 12]],
  blue: [[11, 2], [11, 3], [12, 2], [12, 3]]
};

function App() {
  const [dice, setDice] = useState(1);
  const [message, setMessage] = useState("Game Shuru! Pehle Dice Roll karein.");
  const [playersData, setPlayersData] = useState(game.playerSteps);
  const [currentTurn, setCurrentTurn] = useState('red');
  const [hasRolled, setHasRolled] = useState(false);

  useEffect(() => {
    socket.on('diceRolled', (data) => {
      setDice(data.value);
      setMessage(`Opponent ne ${data.value} roll kiya. Move ka wait karein...`);
    });

    socket.on('tokenMoved', (data) => {
      // Opponent ne jo move kiya, woh apne board par bhi update karein
      game.moveToken(data.color, data.tokenIndex, data.diceValue);
      setPlayersData({ ...game.playerSteps });
      setCurrentTurn(data.nextTurn);
      setHasRolled(false);
      
      // Opponent ki extra turn ya capture ko check karein
      if (data.gotiKati) {
        setMessage(`💥 Opponent ne goti kaat di! Unki ek aur baari hai.`);
      } else if (data.diceValue === 6) {
        setMessage(`Opponent ko 6 mila, unki ek aur baari hai!`);
      } else {
        setMessage(`Opponent ne move kiya. Ab ${data.nextTurn.toUpperCase()} ki baari hai!`);
      }
    });

    return () => {
      socket.off('diceRolled');
      socket.off('tokenMoved');
    };
  }, []);

  const getNextTurn = (currentColor) => {
    const currentIndex = turnOrder.indexOf(currentColor);
    return turnOrder[(currentIndex + 1) % 4];
  };

  const hasValidMoves = (color, rollValue) => {
    const tokens = game.playerSteps[color];
    if (rollValue === 6) return true; // 6 aane par hamesha move hoti hai
    // Agar 6 nahi aaya, toh check karo ki koi goti bahar hai ya nahi
    const anyTokenOutside = tokens.some(steps => steps >= 0 && steps < 57);
    return anyTokenOutside;
  };

  const handleRollDice = () => {
    if (hasRolled) return;
    
    const number = game.rollDice();
    setDice(number);
    setHasRolled(true);

    if (!hasValidMoves(currentTurn, number)) {
      const nextPlayer = getNextTurn(currentTurn);
      setMessage(`Aapne ${number} roll kiya. Koyi valid move nahi hai! 1.5s mein turn pass ho rahi hai...`);
      
      // Agar chalne ke liye goti nahi hai, toh automatic pass ho jayega
      setTimeout(() => {
        setCurrentTurn(nextPlayer);
        setHasRolled(false);
        setMessage(`No moves! Ab ${nextPlayer.toUpperCase()} ki baari hai!`);
        socket.emit('moveToken', { color: currentTurn, tokenIndex: -1, diceValue: number, nextTurn: nextPlayer, gotiKati: false });
      }, 1500);

    } else {
      setMessage(`Aapne ${number} roll kiya! Apni goti par click karein.`);
      socket.emit('rollDice', { color: currentTurn, value: number });
    }
  };

  const handleTokenClick = (color, tokenIndex) => {
    if (color !== currentTurn || !hasRolled) return;
    
    const currentSteps = game.playerSteps[color][tokenIndex];

    if (currentSteps === -1 && dice !== 6) {
      setMessage("Yeh goti kholne ke liye 6 chahiye! Kisi aur goti ko chunein.");
      return;
    }

    const result = game.moveToken(color, tokenIndex, dice);
    setPlayersData({ ...game.playerSteps });

    // Check karein kya message mein "BOOM!" aaya, matlab goti kati hai
    const gotiKati = result.includes("💥");
    
    // Agar dice 6 aaya hai, YA FIR goti kati hai, toh baari same player ki rahegi
    const nextPlayer = (dice === 6 || gotiKati) ? color : getNextTurn(color);
    
    setCurrentTurn(nextPlayer);
    setHasRolled(false);
    
    // UI par message show karein
    if (gotiKati) {
      setMessage(`🎉 Kamaal kar diya! Aapne opponent ki goti kaat di! Ek aur baari.`);
    } else if (dice === 6) {
      setMessage(`${result} | 🎉 Aapko 6 mila! Ek aur baari! Dobara Roll karein.`);
    } else {
      setMessage(`${result} | Ab ${nextPlayer.toUpperCase()} ki baari hai!`);
    }

    // Socket ko saari information bhej dein
    socket.emit('moveToken', { color, tokenIndex, diceValue: dice, nextTurn: nextPlayer, gotiKati });
  };

  const getCellClass = (r, c) => {
    if (r < 6 && c < 6) return 'base-zone red-base';
    if (r < 6 && c > 8) return 'base-zone green-base';
    if (r > 8 && c > 8) return 'base-zone yellow-base';
    if (r > 8 && c < 6) return 'base-zone blue-base';
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return 'center-home';

    if (r === 6 && c === 1) return 'safe-zone bg-red';
    if (r === 1 && c === 8) return 'safe-zone bg-green';
    if (r === 8 && c === 13) return 'safe-zone bg-yellow';
    if (r === 13 && c === 6) return 'safe-zone bg-blue';
    
    // Stars ⭐️ wale Safe Zones
    if ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2)) return 'safe-zone safe-star';

    if (r === 7 && c >= 1 && c <= 5) return 'path bg-red';
    if (c === 7 && r >= 1 && r <= 5) return 'path bg-green';
    if (r === 7 && c >= 9 && c <= 13) return 'path bg-yellow';
    if (c === 7 && r >= 9 && r <= 13) return 'path bg-blue';

    return 'path';
  };

  const renderBoard = () => {
    let board = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        let tokensInCell = [];

        ['red', 'green', 'yellow', 'blue'].forEach(color => {
          playersData[color].forEach((steps, index) => {
            let pos = null;
            if (steps === -1) pos = basePositions[color][index];
            else if (steps >= 0 && steps <= 50) pos = pathCoordinates[(game.startPositions[color] + steps) % 52];
            else if (steps > 50 && steps < 57) pos = homePaths[color][steps - 51];
            else if (steps === 57) pos = [7, 7]; 

            const isClickable = color === currentTurn && hasRolled && !(steps === -1 && dice !== 6);

            if (pos && pos[0] === r && pos[1] === c) {
              tokensInCell.push(
                <div 
                  key={`${color}-${index}`} 
                  className={`token ${color}-token ${isClickable ? 'my-turn-token' : ''}`}
                  onClick={() => handleTokenClick(color, index)}
                ></div>
              );
            }
          });
        });

        board.push(
          <div key={`${r}-${c}`} className={`grid-cell ${getCellClass(r, c)}`}>
            {tokensInCell}
          </div>
        );
      }
    }
    return board;
  };

  return (
    <div className="ludo-container">
      <div className="controls-panel">
        <h2>Multiplayer Ludo 🎲</h2>
        
        <div className={`turn-indicator ${currentTurn}-turn`}>
          Abhi <strong>{currentTurn.toUpperCase()}</strong> ki baari hai!
        </div>

        <div className="dice-show">Roll: {dice}</div>
        <p className="status-msg">{message}</p>
        
        <div className="button-group">
          <button 
            onClick={handleRollDice} 
            className={`btn roll-btn ${currentTurn}-btn`}
            disabled={hasRolled}
          >
            {hasRolled ? 'Goti Par Click Karein' : '🎲 Roll Dice'}
          </button>
        </div>
      </div>
      
      <div className="ludo-board">
        {renderBoard()}
      </div>
    </div>
  );
}

export default App;