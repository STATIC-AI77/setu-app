from PIL import Image, ImageOps, ImageEnhance
import os

SOURCE_PATH = "/home/kaelprime/.gemini/antigravity-cli/brain/71e35060-bd5a-4d48-87c5-3340eed73a41/setu_guardian_app_icon_1793491800801.jpg"
ASSETS_DIR = "/workspace/hackathon/hack-setu-app/assets"

src = Image.open(SOURCE_PATH).convert("RGBA")
W, H = src.size

# 1. assets/icon.png (1024x1024)
icon_1024 = src.resize((1024, 1024), Image.Resampling.LANCZOS)
icon_1024.save(os.path.join(ASSETS_DIR, "icon.png"), "PNG")
print("Saved icon.png (1024x1024)")

# 2. assets/splash-icon.png (1024x1024)
icon_1024.save(os.path.join(ASSETS_DIR, "splash-icon.png"), "PNG")
print("Saved splash-icon.png (1024x1024)")

# 3. assets/favicon.png (48x48)
favicon = src.resize((48, 48), Image.Resampling.LANCZOS)
favicon.save(os.path.join(ASSETS_DIR, "favicon.png"), "PNG")
print("Saved favicon.png (48x48)")

# 4. assets/android-icon-background.png (512x512)
# Deep pitch obsidian with subtle center vignette
bg = Image.new("RGBA", (512, 512), (10, 13, 20, 255))
bg.save(os.path.join(ASSETS_DIR, "android-icon-background.png"), "PNG")
print("Saved android-icon-background.png (512x512)")

# 5. assets/android-icon-foreground.png (512x512)
# For Android adaptive icon, the foreground sits on top of background.
# We crop the central shield emblem and scale it so it sits inside the Android safe zone (within circle of diameter ~360px)
# Crop center 65% of the source image to extract shield
left = int(W * 0.16)
top = int(H * 0.16)
right = int(W * 0.84)
bottom = int(H * 0.84)
shield_crop = src.crop((left, top, right, bottom))

# Scale to fit nicely in 512x512 (around 380x380)
TARGET_EMBLEM_SIZE = 380
shield_resized = shield_crop.resize((TARGET_EMBLEM_SIZE, TARGET_EMBLEM_SIZE), Image.Resampling.LANCZOS)

# Create transparent 512x512 canvas
fg = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
paste_x = (512 - TARGET_EMBLEM_SIZE) // 2
paste_y = (512 - TARGET_EMBLEM_SIZE) // 2
fg.paste(shield_resized, (paste_x, paste_y), shield_resized)
fg.save(os.path.join(ASSETS_DIR, "android-icon-foreground.png"), "PNG")
print("Saved android-icon-foreground.png (512x512)")

# 6. assets/android-icon-monochrome.png (432x432)
# Grayscale / white silhouette for Android 13+ themed icons
gray_crop = ImageOps.grayscale(shield_crop)
# Threshold and invert to create crisp white emblem
mono_emblem = Image.new("RGBA", shield_crop.size, (255, 255, 255, 0))
# Use brightness as alpha
for x in range(shield_crop.width):
    for y in range(shield_crop.height):
        lum = gray_crop.getpixel((x, y))
        if lum > 40:
            alpha = min(255, int((lum - 40) * 1.5))
            mono_emblem.putpixel((x, y), (255, 255, 255, alpha))

mono_resized = mono_emblem.resize((320, 320), Image.Resampling.LANCZOS)
mono = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
mono.paste(mono_resized, ((432 - 320) // 2, (432 - 320) // 2), mono_resized)
mono.save(os.path.join(ASSETS_DIR, "android-icon-monochrome.png"), "PNG")
print("Saved android-icon-monochrome.png (432x432)")
