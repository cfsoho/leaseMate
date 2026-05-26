const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const NUMBERS = "23456789";
const SYMBOLS = "!@#$%^&*";
const ALL = `${UPPERCASE}${LOWERCASE}${NUMBERS}${SYMBOLS}`;

export function generateStrongPassword(length = 16) {
  const requiredCharacters = [
    pickCharacter(UPPERCASE),
    pickCharacter(LOWERCASE),
    pickCharacter(NUMBERS),
    pickCharacter(SYMBOLS),
  ];

  while (requiredCharacters.length < length) {
    requiredCharacters.push(pickCharacter(ALL));
  }

  return shuffle(requiredCharacters).join("");
}

function pickCharacter(characters: string) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return characters[values[0] % characters.length];
}

function shuffle(characters: string[]) {
  const shuffled = [...characters];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const swapIndex = values[0] % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}
