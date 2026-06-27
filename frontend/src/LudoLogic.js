class LudoGame {
  constructor() {
    this.playerSteps = {
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1]
    };

    // Har color ka starting point (Global Board Index)
    this.startPositions = { red: 0, green: 13, yellow: 26, blue: 39 };
    
    // SAFE ZONE INDEXES (Global positions 0 se 51 ke mutabik)
    // Isme 4 start positions aur 4 stars shaamil hain
    this.safeGlobalPositions = [0, 8, 13, 21, 26, 34, 39, 47];
  }

  rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }

  moveToken(color, tokenIndex, diceValue) {
    // Agar auto-pass turn hai (-1 index), toh bina chalein aage badho
    if (tokenIndex === -1) return "No Move";

    let currentSteps = this.playerSteps[color][tokenIndex];

    // 1. Base se bahar nikalne ka logic
    if (currentSteps === -1 && diceValue === 6) {
      this.playerSteps[color][tokenIndex] = 0; 
      this.checkCapture(color, 0); // Check karo kya nikalte hi kisi ko kaata?
      return `${color} ki goti board par aa gayi!`;
    }

    // 2. Track par chalne ka logic
    if (currentSteps !== -1 && currentSteps !== 57) {
      let newSteps = currentSteps + diceValue;

      // Agar Home (57) se aage nikal rahi hai, toh move cancel
      if (newSteps > 57) {
        return `Move cancel! Home jaane ke liye exact ${57 - currentSteps} chahiye.`;
      }

      // Nayi position set karo
      this.playerSteps[color][tokenIndex] = newSteps;

      // Agar goti Home pahunch gayi
      if (newSteps === 57) {
        return `Badhai ho! ${color} ki ek goti HOME pahunch gayi! 🏆`;
      }

      // Agar goti main track par hai (0 se 50), toh Capture (Kaatna) check karo
      if (newSteps <= 50) {
        let wasCaptured = this.checkCapture(color, newSteps);
        if (wasCaptured) {
          // Yahan 💥 laga zaroori hai taaki App.jsx isko padh kar extra turn de sake
          return "💥 BOOM! Zabardast, Goti Kaat Di!";
        }
      }

      return `${color} ki goti aage badhi.`;
    }

    return "Goti chalne ke liye 6 chahiye!";
  }

  // Goti Kaatne ka main logic
  checkCapture(movingColor, movingSteps) {
    let movingGlobalIndex = (this.startPositions[movingColor] + movingSteps) % 52;

    // Agar yeh Safe Zone hai, toh koi kisi ko nahi kaat sakta
    if (this.safeGlobalPositions.includes(movingGlobalIndex)) {
      return false; 
    }

    let captured = false;

    Object.keys(this.playerSteps).forEach(otherColor => {
      if (otherColor !== movingColor) {
        this.playerSteps[otherColor].forEach((otherSteps, i) => {
          if (otherSteps >= 0 && otherSteps <= 50) {
            let otherGlobalIndex = (this.startPositions[otherColor] + otherSteps) % 52;
            
            // Agar ek hi dabbe par do gotiyan aa gayi
            if (movingGlobalIndex === otherGlobalIndex) {
              this.playerSteps[otherColor][i] = -1; // Opponent ki goti Base mein wapas
              captured = true;
            }
          }
        });
      }
    });

    return captured; // Return true agar kisi ko kaata
  }
}

export default LudoGame;