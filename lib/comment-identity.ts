// Server-side only. Never persist raw IPs or the cookie's random identifier.
export function parseIP(input: string): {version: 4 | 6; value: bigint; canonical: string} | null {
  if (!input || input.includes('%') || input !== input.trim()) return null;
  if (!input.includes(':')) {
    const parts = input.split('.');
    if (parts.length !== 4 || parts.some(p => !/^(0|[1-9]\d{0,2})$/.test(p) || Number(p) > 255)) return null;
    const value = parts.reduce((n,p) => (n << 8n) + BigInt(p), 0n);
    return {version:4, value, canonical:parts.join('.')};
  }
  let ip = input.toLowerCase();
  if (ip.includes('.')) {
    const end = ip.lastIndexOf(':'); const v4 = parseIP(ip.slice(end+1));
    if (!v4 || v4.version !== 4) return null;
    ip = ip.slice(0,end+1) + (v4.value >> 16n).toString(16) + ':' + (v4.value & 65535n).toString(16);
  }
  const halves = ip.split('::'); if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const count = left.length + right.length;
  if ((halves.length === 1 && count !== 8) || (halves.length === 2 && count >= 8)) return null;
  const parts = [...left, ...Array(8-count).fill('0'), ...right];
  if (parts.some(p => !/^[0-9a-f]{1,4}$/.test(p))) return null;
  const value = parts.reduce((n,p) => (n << 16n) + BigInt('0x'+p),0n);
  if ((value >> 32n) === 65535n) {
    const v = value & 0xffffffffn;
    return parseIP([24n,16n,8n,0n].map(n => String((v>>n)&255n)).join('.'));
  }
  return {version:6,value,canonical:parts.map(p=>parseInt(p,16).toString(16)).join(':')};
}

export async function sign(secret: string, value: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(value))), b=>b.toString(16).padStart(2,'0')).join('');
}
export async function shortID(secret:string,kind:string,stage:number,value:string) {
  const hash = await sign(secret,JSON.stringify(['comment-id-v1',kind,stage,value]));
  return (BigInt('0x'+hash.slice(0,12)) % 1679616n).toString(36).padStart(4,'0');
}
const COOKIE = '__Host-ba-browser';
export async function browserIdentity(request:Request,secret:string) {
  const raw = request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1) || '';
  const [id,signature] = raw.split('.');
  if (/^[0-9a-f]{32}$/.test(id||'') && /^[0-9a-f]{64}$/.test(signature||'') && signature === await sign(secret,'browser-cookie-v1:'+id)) return {id,cookie:null};
  const fresh = crypto.randomUUID().replaceAll('-','');
  return {id:fresh,cookie:`${COOKIE}=${fresh}.${await sign(secret,'browser-cookie-v1:'+fresh)}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`};
}
export function visitorIP(request:Request) {
  // Trust Cloudflare's client-IP header, never user-supplied X-Forwarded-For.
  // Cloudflare's cross-zone Worker sentinel is not a visitor address.
  let ip = parseIP(request.headers.get('CF-Connecting-IP') || '');
  // Only consult the IPv6 companion when Cloudflare has supplied a Class-E
  // Pseudo IPv4 address. Do not accept an arbitrary client IPv6 header.
  if (ip?.version === 4 && ip.value >= 0xf0000000n) ip = parseIP(request.headers.get('CF-Connecting-IPv6') || '');
  if (!ip || ip.canonical === '2a06:98c0:3600:0:0:0:0:103') return null;
  return ip;
}
