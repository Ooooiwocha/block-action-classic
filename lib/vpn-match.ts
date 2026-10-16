import snapshot from './vpn-ranges.json';
import {parseIP} from './comment-identity';
const ranges = {4:snapshot.v4.map(([a,b])=>[BigInt('0x'+a),BigInt('0x'+b)]),6:snapshot.v6.map(([a,b])=>[BigInt('0x'+a),BigInt('0x'+b)])};
export function isListedVPN(ip:ReturnType<typeof parseIP>) {
  if (!ip) return false;
  const list=ranges[ip.version]; let lo=0,hi=list.length-1;
  while(lo<=hi){const mid=(lo+hi)>>1;const [a,b]=list[mid];if(ip.value<a)hi=mid-1;else if(ip.value>b)lo=mid+1;else return true;}
  return false;
}
