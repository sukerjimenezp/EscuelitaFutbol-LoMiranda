import sys
from PIL import Image, ImageDraw

def process(img_in, img_out):
    img = Image.open(img_in).convert("RGBA")
    
    transparent = (255, 255, 255, 0)
    w, h = img.size
    
    ImageDraw.floodfill(img, (0, 0), transparent, thresh=50)
    ImageDraw.floodfill(img, (w-1, 0), transparent, thresh=50)
    ImageDraw.floodfill(img, (0, h-1), transparent, thresh=50)
    ImageDraw.floodfill(img, (w-1, h-1), transparent, thresh=50)
    
    # Just in case there is a gap between legs that didn't get filled:
    # Try flood filling at coordinates (w/2, h-1) as long as it's close to white
    target_pixel = img.getpixel((int(w/2), h-1))
    if target_pixel[0] > 200 and target_pixel[1] > 200 and target_pixel[2] > 200:
        ImageDraw.floodfill(img, (int(w/2), h-1), transparent, thresh=50)

    img.save(img_out, "PNG")

if __name__ == "__main__":
    process("src/images/camiseta.png", "src/images/camiseta-transparente.png")
