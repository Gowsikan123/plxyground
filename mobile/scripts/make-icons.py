from PIL import Image, ImageDraw, ImageFilter
import math, sys
ORANGE=(255,90,31); BG=(10,10,10)
def play_mark(size, scale=0.56, bg=None, seams=True):
    S=size*4
    img=Image.new('RGBA',(S,S),bg+(255,) if bg else (0,0,0,0))
    if bg:
        # soft radial glow behind the mark
        glow=Image.new('RGBA',(S,S),(0,0,0,0)); g=ImageDraw.Draw(glow)
        r=S*0.42; c=S/2
        g.ellipse([c-r,c-r,c+r,c+r],fill=ORANGE+(70,))
        glow=glow.filter(ImageFilter.GaussianBlur(S*0.09))
        img.alpha_composite(glow)
    # rounded play triangle, optically centred (shifted right)
    h=S*scale; w=h*0.92; cx=S/2+w*0.06; cy=S/2
    pts=[(cx-w/2,cy-h/2),(cx+w/2,cy),(cx-w/2,cy+h/2)]
    mask=Image.new('L',(S,S),0); m=ImageDraw.Draw(mask)
    rad=S*0.05
    m.polygon(pts,fill=255)
    # round corners: erode then dilate via blur threshold
    mask=mask.filter(ImageFilter.GaussianBlur(rad*0.6)).point(lambda v:255 if v>140 else 0)
    tri=Image.new('RGBA',(S,S),ORANGE+(255,))
    layer=Image.new('RGBA',(S,S),(0,0,0,0)); layer.paste(tri,(0,0),mask)
    if seams:
        d=ImageDraw.Draw(layer); lw=int(S*0.022)
        # ball seams: a vertical curve and a horizontal line, clipped to the triangle
        seam=Image.new('L',(S,S),0); sd=ImageDraw.Draw(seam)
        R=h*0.62
        sd.arc([cx-w/2-R*1.25, cy-R, cx-w/2+R*0.75, cy+R], -50, 50, fill=255, width=lw)
        sd.line([(cx-w/2, cy),(cx+w/2,cy)], fill=255, width=lw)
        seam=Image.composite(seam, Image.new('L',(S,S),0), mask)
        layer.paste(Image.new('RGBA',(S,S),BG+(255,)),(0,0),seam)
    img.alpha_composite(layer)
    return img.resize((size,size),Image.LANCZOS)
out=sys.argv[1]
play_mark(1024,0.54,BG).convert('RGB').save(f'{out}/icon.png')
play_mark(1024,0.62,None).save(f'{out}/splash-icon.png')
play_mark(196,0.62,BG).convert('RGB').save(f'{out}/favicon.png')
