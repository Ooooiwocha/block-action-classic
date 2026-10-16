"""Enable read-only selection in title and stage description. Comment list remains nonselectable.
Usage: python scripts/patch-selectable-text.py INPUT.swf OUTPUT.swf
Only four NoSelect flag bits may change; original file is preserved.
"""
import pathlib,struct,sys,zlib
src,dst=map(pathlib.Path,sys.argv[1:])
assert src.resolve()!=dst.resolve()
raw=src.read_bytes();assert raw[:3]==b'CWS'
data=bytearray(zlib.decompress(raw[8:]));before=bytes(data)
def rect_end(p):return p+(5+4*(data[p]>>3)+7)//8
changes={}
def walk(start,end):
 p=start
 while p<end:
  h=struct.unpack_from('<H',data,p)[0];p+=2
  code,size=h>>6,h&63
  if size==63:size=struct.unpack_from('<I',data,p)[0];p+=4
  if code==39:walk(p+4,p+size)
  if code==37:
   cid=struct.unpack_from('<H',data,p)[0]
   if cid in (385,387,395,397):
    flags=rect_end(p+2)
    assert data[flags]&8,'Must remain read-only'
    assert data[flags+1]&16,'Expected NoSelect'
    data[flags+1]&=~16
    changes[flags+1]=cid
  p+=size
walk(rect_end(0)+4,len(data))
assert set(changes.values())=={385,387,395,397}
assert all(a==b or (i in changes and a^b==16) for i,(a,b) in enumerate(zip(before,data)))
dst.write_bytes(raw[:8]+zlib.compress(data))
print('Verified: only four NoSelect bits changed; read-only flags preserved.')
