import math
from PIL import Image, ImageDraw, ImageFilter

def create_setu_icon():
    SIZE = 1024
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    # 1. Background subtle radial gradient glow
    cx, cy = 512, 500
    for r in range(480, 0, -8):
        alpha = int(45 * (1 - r / 480.0))
        # emerald glow
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(16, 185, 129, alpha))

    # We will build an SVG-style master shield path
    # Shield coordinates (Outer)
    # Let's create an oversized mask for supersampling 2x (2048x2048)
    S2 = 2048
    img2 = Image.new("RGBA", (S2, S2), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(img2)

    # 2x coordinates
    # Shield shape points
    # Top center: (1024, 380)
    # Top left corner: (480, 460)
    # Top right corner: (1568, 460)
    # Mid left: (480, 1050)
    # Mid right: (1568, 1050)
    # Bottom tip: (1024, 1720)
    
    shield_pts = [
        (1024, 360),
        (1300, 390),
        (1580, 460),
        (1580, 1020),
        (1400, 1380),
        (1024, 1740),
        (648, 1380),
        (468, 1020),
        (468, 460),
        (748, 390)
    ]

    # Draw dark metallic shield surface
    d2.polygon(shield_pts, fill=(13, 17, 23, 255))

    # Draw shield glowing border (16px)
    d2.polygon(shield_pts, outline=(16, 185, 129, 255), width=24)

    # Inner shield accent rim
    inner_pts = [
        (1024, 420),
        (1280, 445),
        (1520, 505),
        (1520, 1000),
        (1360, 1320),
        (1024, 1660),
        (688, 1320),
        (528, 1000),
        (528, 505),
        (768, 445)
    ]
    d2.polygon(inner_pts, outline=(56, 189, 248, 70), width=8)

    # Draw the iconic "Setu" (Bridge) Symbol in center
    # Two elegant sweeping interlocking bridge arcs
    # Top Emerald Arc
    top_arc = [
        (680, 680),
        (880, 600),
        (1168, 600),
        (1368, 680),
        (1420, 750),
        (1368, 820),
        (1200, 760),
        (1024, 760),
        (848, 820),
        (628, 750),
    ]
    d2.polygon(top_arc, fill=(16, 185, 129, 255))

    # Bottom Cyan Arch (Supporting Bridge Foundation)
    bot_arc = [
        (628, 1100),
        (848, 1030),
        (1024, 1030),
        (1200, 1100),
        (1420, 1170),
        (1368, 1240),
        (1168, 1180),
        (880, 1180),
        (680, 1240),
        (628, 1170),
    ]
    d2.polygon(bot_arc, fill=(56, 189, 248, 255))

    # Center Vault Security Node (Diamond/Circle)
    d2.ellipse([924, 824, 1124, 1024], fill=(255, 255, 255, 255))
    d2.ellipse([954, 854, 1094, 994], fill=(13, 17, 23, 255))
    d2.ellipse([984, 884, 1064, 964], fill=(16, 185, 129, 255))

    # Connect bridge pillars
    d2.line([(1024, 760), (1024, 824)], fill=(16, 185, 129, 255), width=28)
    d2.line([(1024, 1024), (1024, 1080)], fill=(56, 189, 248, 255), width=28)

    # Resize down with LANCZOS for pristine supersampled antialiasing
    rendered = img2.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    img.alpha_composite(rendered)

    img.save("/tmp/python_logo.png")
    print("Saved /tmp/python_logo.png")

create_setu_icon()
