import * as crypto from 'crypto';

function cekOperasiDatabase(str: string): boolean {
  const kataKunci = ["insert", "update", "delete"];
  return kataKunci.some((kata) => str.includes(kata));
}

function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*-_=+|;:?';

  const randomString = Array.from({ length }, () => {
    const randomIndex = crypto.randomInt(characters.length);
    return characters.charAt(randomIndex);
  }).join('');

  return randomString;
}

const currentDate = new Date();
let formatterDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;

export {
  cekOperasiDatabase,
  generateRandomString,
  formatterDate
}

