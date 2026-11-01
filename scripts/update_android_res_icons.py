from PIL import Image
import os

ASSETS_DIR = "/workspace/hackathon/hack-setu-app/assets"
RES_DIR = "/workspace/hackathon/hack-setu-app/android/app/src/main/res"

icon_img = Image.open(os.path.join(ASSETS_DIR, "icon.png")).convert("RGBA")
fg_img = Image.open(os.path.join(ASSETS_DIR, "android-icon-foreground.png")).convert("RGBA")
bg_img = Image.open(os.path.join(ASSETS_DIR, "android-icon-background.png")).convert("RGBA")
mono_img = Image.open(os.path.join(ASSETS_DIR, "android-icon-monochrome.png")).convert("RGBA")

# Mipmap densities and standard sizes (ic_launcher, ic_launcher_foreground)
densities = {
    "mipmap-mdpi": (48, 108),
    "mipmap-hdpi": (72, 162),
    "mipmap-xhdpi": (96, 216),
    "mipmap-xxhdpi": (144, 324),
    "mipmap-xxxhdpi": (192, 432),
}

for folder, (size_icon, size_fg) in densities.items():
    target_dir = os.path.join(RES_DIR, folder)
    if not os.path.exists(target_dir):
        continue

    # ic_launcher.webp / png
    for ext in ["png", "webp"]:
        f = os.path.join(target_dir, f"ic_launcher.{ext}")
        if os.path.exists(f):
            icon_img.resize((size_icon, size_icon), Image.Resampling.LANCZOS).save(f)
        
        f_round = os.path.join(target_dir, f"ic_launcher_round.{ext}")
        if os.path.exists(f_round):
            icon_img.resize((size_icon, size_icon), Image.Resampling.LANCZOS).save(f_round)

        f_fg = os.path.join(target_dir, f"ic_launcher_foreground.{ext}")
        if os.path.exists(f_fg):
            fg_img.resize((size_fg, size_fg), Image.Resampling.LANCZOS).save(f_fg)

        f_bg = os.path.join(target_dir, f"ic_launcher_background.{ext}")
        if os.path.exists(f_bg):
            bg_img.resize((size_fg, size_fg), Image.Resampling.LANCZOS).save(f_bg)

        f_mono = os.path.join(target_dir, f"ic_launcher_monochrome.{ext}")
        if os.path.exists(f_mono):
            mono_img.resize((size_fg, size_fg), Image.Resampling.LANCZOS).save(f_mono)

print("Updated all Android mipmap resources with Setu Guardian logo!")
