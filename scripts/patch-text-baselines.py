"""Adjust specific text placements for Ruffle canvas; preserve all other bits.
Usage: python scripts/patch-text-baselines.py ORIGINAL.swf OUTPUT.swf
"""
import pathlib, struct, sys, zlib
src, dst = map(pathlib.Path, sys.argv[1:])
assert src.resolve() != dst.resolve()
raw = src.read_bytes()
assert raw[:3] == b'CWS'
data = bytearray(zlib.decompress(raw[8:]))
before = bytes(data)
changed_bits = set()
seen = []
def read(bit, n):
    v = 0
    for i in range(bit, bit+n): v = (v << 1) | ((data[i//8] >> (7-i%8)) & 1)
    return v
def write(bit, n, value):
    assert -(1 << (n-1)) <= value < (1 << (n-1))
    value &= (1 << n)-1
    for j in range(n):
        i = bit+j; mask = 1 << (7-i%8)
        data[i//8] = (data[i//8] & ~mask) | (((value >> (n-1-j)) & 1) * mask)
        changed_bits.add(i)
def walk(start, end):
    pos = start
    while pos < end:
        h = struct.unpack_from('<H', data, pos)[0]; pos += 2
        code, size = h >> 6, h & 63
        if size == 63: size = struct.unpack_from('<I', data, pos)[0]; pos += 4
        if code == 37 and struct.unpack_from('<H', data, pos)[0] == 436:
            rect = pos+2
            p = rect + (5+4*(data[rect]>>3)+7)//8 + 4
            assert struct.unpack_from('<H', data, p)[0] == 320
            struct.pack_into('<H', data, p, 280)  # URL only: 16px -> 14px
            changed_bits.update(range(p*8,(p+2)*8))
        if code == 39: walk(pos+4, pos+size)
        if code == 26:
            flags = data[pos]
            if flags & 2 and flags & 4 and flags & 32:
                char = struct.unpack_from('<H', data, pos+3)[0]
                bit = (pos+5)*8
                for _ in range(2):
                    flag = read(bit,1); bit += 1
                    if flag:
                        n = read(bit,5); bit += 5 + 2*n
                n = read(bit,5); bit += 5
                ybit = bit+n; v = read(ybit,n)
                y = v-(1<<n) if n and v & (1<<(n-1)) else v
                # Canvas baseline compensation in twips (20 = 1 SWF pixel).
                delta = {384:120,394:120,399:40,400:40,401:40,412:20,420:40,431:40,434:60,436:60}.get(char)
                if delta is not None:
                    write(ybit,n,y+delta); seen.append(char)
        pos += size
walk((5+4*(data[0]>>3)+7)//8+4, len(data))
assert sorted(seen) == [384,394,399,400,401,412,420,431,434,436], seen
for i, (a,b) in enumerate(zip(before,data)):
    for k in range(8):
        if (a^b) & (1<<(7-k)): assert i*8+k in changed_bits
dst.write_bytes(raw[:8]+zlib.compress(data))
print('Verified text placement and URL font adjustments applied:',seen)
