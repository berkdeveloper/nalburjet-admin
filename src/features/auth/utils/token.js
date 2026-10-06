function decodeBase64Url(value) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  
    return new TextDecoder().decode(bytes);
  }
  
  export function decodeAccessToken(accessToken) {
    if (!accessToken) {
      return null;
    }
  
    try {
      const parts = accessToken.split(".");
  
      if (parts.length !== 3) {
        return null;
      }
  
      return JSON.parse(decodeBase64Url(parts[1]));
    } catch {
      return null;
    }
  }
  
  export function getUserFromAccessToken(accessToken) {
    const payload = decodeAccessToken(accessToken);
  
    if (!payload) {
      return null;
    }
  
    return {
      userId: payload.sub ?? null,
      email: payload.name ?? null,
      firstName: payload.given_name ?? null,
      lastName: payload.family_name ?? null,
      role: payload.role ?? null,
    };
  }
  
  export function isTokenExpired(accessToken) {
    const payload = decodeAccessToken(accessToken);
  
    if (!payload?.exp) {
      return true;
    }
  
    return payload.exp * 1000 <= Date.now();
  }