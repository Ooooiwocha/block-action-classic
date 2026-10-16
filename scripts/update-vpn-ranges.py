"""Build an offline, provider-scoped snapshot. Does not send visitor IPs anywhere.
Run explicitly when updating the site; no scheduled network calls at runtime.
"""
import csv,datetime,hashlib,io,ipaddress,json,pathlib,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
def fetch(url):
    with urllib.request.urlopen(url,timeout=60) as r: return r.read()
sources=[]; networks=[]
for name in ['google','icloud']:
    if name=='google': url='https://www.gstatic.com/vpn/geofeed'
    elif name=='icloud': url='https://mask-api.icloud.com/egress-ip-ranges.csv'
    data=fetch(url)
    entries=[line.split(',')[0].strip() for line in data.decode().splitlines() if line.strip() and not line.startswith('#')]
    parsed=[ipaddress.ip_network(x,strict=False) for x in entries]
    if not parsed: raise ValueError('Empty source: '+name)
    networks.extend(parsed)
    sources.append(dict(provider=name,url=url,sha256=hashlib.sha256(data).hexdigest(),entries=len(parsed),basis='official VPN/relay geofeed'))
    print(name,len(parsed))
result={'updatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':sources,'unsupported':['nordvpn','protonvpn','surfshark','mullvad','opera'],'v4':[],'v6':[]}
for version in [4,6]:
    for n in ipaddress.collapse_addresses(n for n in networks if n.version==version):
        result['v'+str(version)].append([format(int(n.network_address),'x'),format(int(n.broadcast_address),'x')])
out=ROOT/'lib/vpn-ranges.json';out.write_text(json.dumps(result,separators=(',',':')),encoding='utf-8')
print('Merged ranges',len(result['v4']),len(result['v6']))
