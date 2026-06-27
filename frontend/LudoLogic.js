class LudoGame {
  constructor() {
    this.players = {
      red: [-1, -1, -1, -1],   // -1 matlab goti ghar ke andar hai
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1]
    };
    
    // Har color ka starting point (0 se 51 ke circular track par)
    this.startPositions = {
      red: 0,
      green: 13,
      yellow: 26,
      blue: 39
    };

    // Board ke 8 Safe Zones (Stars + Starting points)
    // In positions par goti nahi kat sakti
    this.safeZones = [0, 8, 13, 21, 26, 34, 39, 47]; 
  }

  rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }

  // Goti chalne ka main function
  moveToken(color, tokenIndex, diceValue) {
    let currentPos = this.players[color][tokenIndex];

    // RULE 1: Agar goti ghar mein hai aur 6 aaya hai (Bahar Nikalo)
    if (currentPos === -1 && diceValue === 6) {
      this.players[color][tokenIndex] = this.startPositions[color];
      return `${color} ki goti board par aa gayi!`;
    }

    // RULE 2: Agar goti board par hai (Aage Badhao)
    if (currentPos !== -1) {
      let newPos = currentPos + diceValue;
      
      // Board 51 ke baad ghoom kar wapas 0 par aata hai (Circular Track)
      if (newPos > 51) {
        newPos = newPos % 52;
      }

      this.players[color][tokenIndex] = newPos;
      
      // RULE 3: Goti Katne ka Check karo
      let killMessage = this.checkKill(color, newPos);

      return `${color} ki goti position ${newPos} par pahunchi. ` + killMessage;
    }

    return "Goti bahar nikalne ke liye 6 chahiye!";
  }

  // Goti Katne (Killing) ka function
  checkKill(movingColor, targetPos) {
    // Agar nayi position kisi Safe Zone mein hai, toh checking rok do
    if (this.safeZones.includes(targetPos)) {
      return "Yeh ek safe zone hai, aapki goti surakshit hai!";
    }

    // Agar safe zone nahi hai, toh check karo kya wahan dusre rang ki goti hai?
    for (let otherColor in this.players) {
      if (otherColor !== movingColor) { // Apni hi goti mat kaat dena!
        for (let i = 0; i < 4; i++) {
          if (this.players[otherColor][i] === targetPos) {
            // Dusre ki goti ko wapas ghar (-1) bhej do
            this.players[otherColor][i] = -1;
            return `Zabardast! ${movingColor} ne ${otherColor} ki goti kaat di!`;
          }
        }
      }
    }
    return ""; // Agar koi nahi kata toh khali text wapas bhejo
  }
}

export default LudoGame;