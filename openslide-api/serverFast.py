import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse
from io import BytesIO

# 1. LINK THE BINARIES (This lets Python read .ndpi)
# Update this path to match YOUR folder location
bin_path = r"C:\Users\chira\OneDrive\Desktop\Vyuhaa\newwebsite\Integrating\openslide-api\openslide-bin\bin"
os.add_dll_directory(bin_path)
try:
    if os.path.exists(bin_path):
        os.add_dll_directory(bin_path)
        import openslide
        print("✅ SUCCESS: OpenSlide binaries loaded and library imported!")
    else:
        print(f"❌ ERROR: Path not found: {bin_path}")
except Exception as e:
    print(f"❌ ERROR: {e}")

import openslide
from openslide.deepzoom import DeepZoomGenerator

app = FastAPI()

# 2. ALLOW REACT TO TALK TO PYTHON
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. POINT TO YOUR UPLOADS FOLDER
SLIDE_DIR = r"C:\Users\chira\OneDrive\Desktop\Vyuhaa\newwebsite\Checking\uploads\pathology"

@app.get("/tile/{slide_name}/{level}/{col}_{row}.jpg")
def get_tile(slide_name: str, level: int, col: int, row: int):
    full_path = os.path.join(SLIDE_DIR, slide_name)
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Slide file not found")
    
    try:
        slide = openslide.OpenSlide(full_path)
        # DeepZoom creates the "Pyramid" of images
        dz = DeepZoomGenerator(slide, tile_size=254, overlap=1)
        
        # Get the specific small square (tile) requested
        tile = dz.get_tile(level, (col, row))
        
        # Convert tile to a format browsers understand (JPEG)
        buf = BytesIO()
        tile.save(buf, format="JPEG", quality=85)
        return StreamingResponse(BytesIO(buf.getvalue()), media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Start the server on Port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)