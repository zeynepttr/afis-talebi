/**
 * Güvenli ve Çözülebilir Şifreleme Modülü (Reversible Obfuscation / Cipher)
 * Veritabanında açık metin (plaintext) şifre saklanmasını önler.
 * Şifreler "ENC_v1_..." formatında güvenli bir şekilde saklanır ve gerektiğinde çözülebilir.
 */

const CIPHER_KEY = "AfisPortali@2026_SecureCipherKey#99";
const PREFIX = "ENC_v1_";

/**
 * Açık şifreyi çözülebilir şifreli metne dönüştürür.
 */
export function encryptPassword(plain: string): string {
  if (!plain) return '';
  try {
    let xorStr = '';
    for (let i = 0; i < plain.length; i++) {
      const pCode = plain.charCodeAt(i);
      const kCode = CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length);
      xorStr += String.fromCharCode(pCode ^ kCode);
    }
    // UTF-8 güvenli Base64 kodlama
    const b64 = btoa(unescape(encodeURIComponent(xorStr)));
    return `${PREFIX}${b64}`;
  } catch (err) {
    console.warn("Encryption fallback notice:", err);
    return `${PREFIX}${btoa(plain)}`;
  }
}

/**
 * Şifreli metni açık şifreye geri dönüştürür.
 * Eğer metin önceden kalan açık metin bir şifreyse (ENC_v1_ ile başlamıyorsa),
 * geriye dönük uyumluluk için olduğu gibi döndürür.
 */
export function decryptPassword(cipher: string | undefined | null): string {
  if (!cipher) return '';
  if (!cipher.startsWith(PREFIX)) {
    // Eski/açık metin şifreler için geriye dönük tam uyumluluk
    return cipher;
  }
  try {
    const rawB64 = cipher.slice(PREFIX.length);
    const decoded = decodeURIComponent(escape(atob(rawB64)));
    let plain = '';
    for (let i = 0; i < decoded.length; i++) {
      const dCode = decoded.charCodeAt(i);
      const kCode = CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length);
      plain += String.fromCharCode(dCode ^ kCode);
    }
    return plain;
  } catch (err) {
    try {
      // Basit Base64 fallback
      return atob(cipher.slice(PREFIX.length));
    } catch {
      return cipher;
    }
  }
}

/**
 * Kullanıcının girdiği şifre ile veritabanındaki (şifreli ya da eski) şifreyi karşılaştırır.
 */
export function verifyPassword(inputPass: string, storedPass: string | undefined | null): boolean {
  if (!inputPass || !storedPass) return false;
  if (storedPass === inputPass) return true;
  const decrypted = decryptPassword(storedPass);
  return decrypted === inputPass;
}
