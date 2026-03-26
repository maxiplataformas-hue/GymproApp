from PIL import Image

path = r"c:\Users\max.contreras\Documents\Desarrollos\EntrenamientoApp\gympro\public\logo.png"

try:
    img = Image.open(path)
    img = img.convert("RGBA")
    w, h = img.size
    pixels = img.load()
    
    # Get top-left pixel background color
    bg_color = pixels[0, 0]
    
    # Erase everything below 70% height with background color
    start_y = int(h * 0.70)
    
    for y in range(start_y, h):
        for x in range(w):
            pixels[x, y] = bg_color
            
    img.save(path)
    print(f"Logo updated successfully: Painted from {start_y} to {h} with color {bg_color}")
except Exception as e:
    print(f"Error: {e}")
