from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import openslide
from PIL import Image
import io
import math

app = FastAPI()

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to your NDPI file
SLIDE_PATH = r"C:\Users\chira\OneDrive\Desktop\Vyuhaa\newwebsite\Integrating\openslide-api\static\tiles\Doctors\Maharshi\myslide\myslide.ndpi"

TILE_SIZE = 256

# Open slide once when server starts
try:
    slide = openslide.OpenSlide(SLIDE_PATH)
    print(f"✅ Slide opened successfully")
    print(f"   Dimensions: {slide.dimensions}")
    print(f"   Levels: {slide.level_count}")
    print(f"   Level dims: {slide.level_dimensions}")
except Exception as e:
    print(f"❌ Error opening slide: {e}")
    slide = None


# ─── SLIDE INFO ───────────────────────────────────────────────────────────────
@app.get("/slide-info")
async def get_slide_info():
    if not slide:
        raise HTTPException(status_code=500, detail="Slide not loaded")

    width, height = slide.dimensions

    return {
        "width": width,
        "height": height,
        "levels": slide.level_count,
        "level_dimensions": slide.level_dimensions,
        "tile_size": TILE_SIZE,
        "mpp_x": slide.properties.get("openslide.mpp-x", "N/A"),
        "mpp_y": slide.properties.get("openslide.mpp-y", "N/A"),
    }


# ─── DZI ENDPOINT (OpenSeadragon reads this first) ────────────────────────────
# OpenSeadragon fetches this XML to understand image size and tile structure
@app.get("/slide.dzi")
async def get_dzi():
    if not slide:
        raise HTTPException(status_code=500, detail="Slide not loaded")

    width, height = slide.dimensions

    # DZI XML format — OpenSeadragon standard
    dzi_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Image xmlns="http://schemas.microsoft.com/deepzoom/2008"
       Format="jpeg"
       Overlap="1"
       TileSize="{TILE_SIZE}">
    <Size Width="{width}" Height="{height}"/>
</Image>"""

    return Response(content=dzi_xml, media_type="application/xml")


# ─── DZI TILES (OpenSeadragon fetches these based on zoom/pan) ────────────────
# OpenSeadragon automatically calls: /slide_files/{level}/{x}_{y}.jpeg
@app.get("/slide_files/{level}/{filename}")
async def get_dzi_tile(level: int, filename: str):
    if not slide:
        raise HTTPException(status_code=500, detail="Slide not loaded")

    # Parse x_y from filename like "3_7.jpeg"
    try:
        name = filename.replace(".jpeg", "").replace(".jpg", "")
        x_str, y_str = name.split("_")
        x, y = int(x_str), int(y_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid tile filename")

    # DZI level 0 = smallest, highest level = full resolution
    # OpenSlide level 0 = full resolution, highest level = smallest
    # Need to convert DZI level → OpenSlide level
    width, height = slide.dimensions
    max_dzi_level = math.ceil(math.log2(max(width, height)))
    openslide_level = max_dzi_level - level

    # Clamp to valid OpenSlide level range
    openslide_level = max(0, min(openslide_level, slide.level_count - 1))

    # Get dimensions at this OpenSlide level
    level_width, level_height = slide.level_dimensions[openslide_level]

    # Calculate pixel position at this level
    pixel_x = x * TILE_SIZE
    pixel_y = y * TILE_SIZE

    # Out of bounds — return white tile
    if pixel_x >= level_width or pixel_y >= level_height:
        blank = Image.new("RGB", (TILE_SIZE, TILE_SIZE), (255, 255, 255))
        img_bytes = io.BytesIO()
        blank.save(img_bytes, format="JPEG")
        img_bytes.seek(0)
        return Response(content=img_bytes.read(), media_type="image/jpeg")

    # Actual tile size (edge tiles may be smaller)
    actual_w = min(TILE_SIZE, level_width - pixel_x)
    actual_h = min(TILE_SIZE, level_height - pixel_y)

    # Scale position back to level 0 coordinates
    scale = slide.level_downsamples[openslide_level]
    level0_x = int(pixel_x * scale)
    level0_y = int(pixel_y * scale)

    # Read only this region from NDPI
    tile = slide.read_region(
        location=(level0_x, level0_y),
        level=openslide_level,
        size=(actual_w, actual_h)
    )

    tile_rgb = tile.convert("RGB")

    # Pad edge tiles to full size
    if actual_w < TILE_SIZE or actual_h < TILE_SIZE:
        padded = Image.new("RGB", (TILE_SIZE, TILE_SIZE), (255, 255, 255))
        padded.paste(tile_rgb, (0, 0))
        tile_rgb = padded

    img_bytes = io.BytesIO()
    tile_rgb.save(img_bytes, format="JPEG", quality=85)
    img_bytes.seek(0)

    return Response(content=img_bytes.read(), media_type="image/jpeg")


# ─── THUMBNAIL ────────────────────────────────────────────────────────────────
@app.get("/thumbnail")
async def get_thumbnail():
    if not slide:
        raise HTTPException(status_code=500, detail="Slide not loaded")

    thumb = slide.get_thumbnail((512, 512))
    img_bytes = io.BytesIO()
    thumb.convert("RGB").save(img_bytes, format="JPEG", quality=85)
    img_bytes.seek(0)
    return Response(content=img_bytes.read(), media_type="image/jpeg")


# ─── ROOT ─────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Slide server running ✅"}
