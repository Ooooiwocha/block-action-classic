"""Patch only the comment text metrics in the original Action.swf for Ruffle.
Usage: python scripts/patch-comment-text.py ORIGINAL.swf OUTPUT.swf
The original source file is never overwritten.
"""
import pathlib, struct, sys, zlib

src, dst = map(pathlib.Path, sys.argv[1:])
assert src.resolve() != dst.resolve()
raw = src.read_bytes()
assert raw[:3] == b'CWS'
data = bytearray(zlib.decompress(raw[8:]))
def rect_end(pos):
    return pos + (5 + 4 * (data[pos] >> 3) + 7) // 8
pos = rect_end(0) + 4
changes = []
while pos < len(data):
    header = struct.unpack_from('<H', data, pos)[0]
    pos += 2
    code, length = header >> 6, header & 63
    if length == 63:
        length = struct.unpack_from('<I', data, pos)[0]
        pos += 4
    if code == 37 and struct.unpack_from('<H', data, pos)[0] == 363:
        p = rect_end(pos + 2)
        first, second = data[p:p+2]
        assert first & 1 and second & 32  # HasFont, HasLayout
        assert not second & 128          # no font class string
        p += 4  # flags and font ID
        assert struct.unpack_from('<H', data, p)[0] == 320
        changes.append((p, 240))  # 16px -> 12px
        p += 2
        if first & 4: p += 4  # RGBA
        if first & 2: p += 2  # max length
        p += 7  # alignment, left/right margins, indent
        assert struct.unpack_from('<h', data, p)[0] == 40
        changes.append((p, 0))  # 2px leading -> 0px
    pos += length
assert len(changes) == 2
before = bytes(data)
for offset, value in changes:
    struct.pack_into('<H', data, offset, value)
assert all(a == b or any(o <= i < o + 2 for o, _ in changes)
           for i, (a, b) in enumerate(zip(before, data)))
dst.write_bytes(raw[:8] + zlib.compress(data))
print('Verified: only comment font height and leading changed; all other SWF bytes preserved.')
