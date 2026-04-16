#!/usr/bin/env python3
"""Generate CarPrice2025.PNG and CarPriceDetails2025.PNG from the bundled pricing catalog.

This keeps the legacy chart image files aligned with the current canonical pricing JSON.
"""

from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parents[1]
DATA_PATH = BASE / "data" / "rosie_services_pricing_and_packages.json"
OUT_DIR = BASE / "assets" / "brand"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_REG = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FONT_BLACK = "/usr/share/fonts/truetype/noto/NotoSans-Black.ttf"

BG = "#070b10"
PANEL = "#101a28"
PANEL_ALT = "#0d1522"
BORDER = "#2a3b55"
TEXT = "#edf4ff"
MUTED = "#b9c9de"
ACCENT = "#4d77ff"
ACCENT2 = "#22c55e"
WARN = "#f59e0b"
WHITE = "#ffffff"


def font(kind: str, size: int):
    path = {"regular": FONT_REG, "bold": FONT_BOLD, "black": FONT_BLACK}[kind]
    return ImageFont.truetype(path, size)


def money(value):
    if value is None:
        return "—"
    return f"${float(value):,.0f}"


def rounded(draw, box, fill, outline=None, radius=18, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def wrap(draw, text, fnt, max_width):
    words = str(text).split()
    if not words:
        return [""]
    lines, current = [], ""
    for word in words:
        trial = (current + " " + word).strip()
        if draw.textbbox((0, 0), trial, font=fnt)[2] <= max_width or not current:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def price_chart(data):
    packages = data["packages"]
    addons = data["addons"]
    package_rows = [[p["name"], money(p["prices_cad"].get("small")), money(p["prices_cad"].get("mid")), money(p["prices_cad"].get("oversize")), money(p.get("deposit_cad"))] for p in packages]
    addon_rows = []
    for addon in addons:
        size_map = addon.get("prices_cad") or {}
        addon_rows.append([addon["name"], money(size_map.get("small")), money(size_map.get("mid")), money(size_map.get("oversize")), money(addon.get("price_cad")), "Yes" if addon.get("quote_required") else "No"])

    width, height, margin = 1900, 2200, 70
    img = Image.new("RGBA", (width, height), BG)
    draw = ImageDraw.Draw(img)
    rounded(draw, (margin, 45, width - margin, 250), fill=PANEL, outline=BORDER, radius=28, width=2)
    draw.text((margin + 36, 88), "Rosie Dazzlers Vehicle Price Chart 2025", font=font("black", 48), fill=TEXT)
    subtitle = "Generated from the current canonical pricing catalog. Package prices are grouped by vehicle size. Add-ons are listed below with size-based prices or starting flat rates."
    draw.multiline_text((margin + 36, 150), "\n".join(wrap(draw, subtitle, font("regular", 24), width - margin * 2 - 72)), font=font("regular", 24), fill=MUTED, spacing=8)
    badge = "Ontario mobile detailing pricing"
    badge_w = draw.textbbox((0, 0), badge, font=font("bold", 22))[2]
    rounded(draw, (width - margin - 36 - badge_w - 28, 86, width - margin - 36, 132), fill=ACCENT, radius=18)
    draw.text((width - margin - 50, 109), badge, font=font("bold", 22), fill=WHITE, anchor="ra")

    y = 290

    def draw_table(title, subtitle, columns, rows, widths, aligns, compact=False):
        nonlocal y
        section_h = 68
        rounded(draw, (margin, y, width - margin, y + section_h), fill=ACCENT, radius=20)
        draw.text((margin + 24, y + 18), title, font=font("bold", 30), fill=WHITE)
        if subtitle:
            draw.text((width - margin - 24, y + 23), subtitle, font=font("regular", 18), fill="#dfe8ff", anchor="ra")
        y += section_h + 14

        head_h = 60
        rounded(draw, (margin, y, width - margin, y + head_h), fill=PANEL_ALT, outline=BORDER, radius=18, width=1)
        x = margin
        for idx, column in enumerate(columns):
            col_w = widths[idx]
            if idx:
                draw.line((x, y + 10, x, y + head_h - 10), fill=BORDER, width=1)
            if aligns[idx] == "left":
                draw.text((x + 18, y + 16), column, font=font("bold", 22), fill=TEXT)
            elif aligns[idx] == "center":
                draw.text((x + col_w / 2, y + head_h / 2), column, font=font("bold", 22), fill=TEXT, anchor="mm")
            else:
                draw.text((x + col_w - 18, y + 16), column, font=font("bold", 22), fill=TEXT, anchor="ra")
            x += col_w
        y += head_h + 8

        row_font = font("regular", 22 if compact else 24)
        row_font_bold = font("bold", 22 if compact else 24)
        for row_index, row in enumerate(rows):
            first_lines = wrap(draw, row[0], row_font_bold, widths[0] - 30)
            row_h = max(60 if compact else 68, 24 + len(first_lines) * (row_font_bold.size + 2))
            fill = PANEL if row_index % 2 == 0 else PANEL_ALT
            rounded(draw, (margin, y, width - margin, y + row_h), fill=fill, outline=BORDER, radius=14, width=1)
            x = margin
            for idx, value in enumerate(row):
                col_w = widths[idx]
                if idx:
                    draw.line((x, y + 8, x, y + row_h - 8), fill=BORDER, width=1)
                align = aligns[idx]
                current_font = row_font_bold if idx == 0 else row_font
                if idx == 0:
                    lines = wrap(draw, str(value), current_font, col_w - 30)
                    text_h = len(lines) * current_font.size + (len(lines) - 1) * 4
                    draw.multiline_text((x + 16, y + (row_h - text_h) / 2 - 2), "\n".join(lines), font=current_font, fill=TEXT, spacing=4)
                elif align == "center":
                    color = ACCENT2 if str(value).strip().lower() in {"yes", "included"} else (WARN if str(value).startswith("$") and idx == 4 and row[4] != "—" else TEXT)
                    draw.text((x + col_w / 2, y + row_h / 2), str(value), font=current_font, fill=color, anchor="mm")
                else:
                    draw.text((x + col_w - 16, y + row_h / 2), str(value), font=current_font, fill=TEXT, anchor="rm")
                x += col_w
            y += row_h + 8
        y += 18

    draw_table("Package pricing", "5 package families • 15 size-price points", ["Package", "Small", "Mid-size", "Oversize / Exotic", "Deposit"], package_rows, [700, 230, 230, 340, 260], ["left", "right", "right", "right", "right"])
    draw_table("Add-on pricing", "12 add-ons from the same catalog", ["Add-on", "Small", "Mid-size", "Oversize / Exotic", "Flat / From", "Quote"], addon_rows, [700, 180, 180, 250, 250, 160], ["left", "right", "right", "right", "right", "center"], compact=True)

    notes = [
        "Notes:",
        "• Quote = item typically needs a visual inspection or condition check before final approval.",
        "• Flat / From is used where the catalog stores a single starting price instead of size-based pricing.",
        "• Travel, fuel, material surcharges, and taxes are managed separately in App Management and checkout."
    ]
    rounded(draw, (margin, y, width - margin, y + 146), fill=PANEL, outline=BORDER, radius=22, width=1)
    draw.multiline_text((margin + 24, y + 22), "\n".join(notes), font=font("regular", 21), fill=MUTED, spacing=8)

    img.convert("RGB").save(OUT_DIR / "CarPrice2025.PNG", quality=95)


def details_chart(data):
    packages = data["packages"]
    service_matrix = data["service_matrix"]
    pkg_codes = [pkg["code"] for pkg in packages]

    width, height, margin = 1900, 1500, 70
    img = Image.new("RGBA", (width, height), BG)
    draw = ImageDraw.Draw(img)
    rounded(draw, (margin, 45, width - margin, 220), fill=PANEL, outline=BORDER, radius=28, width=2)
    draw.text((margin + 36, 88), "Rosie Dazzlers Package Service Details Chart", font=font("black", 46), fill=TEXT)
    subtitle = "This table shows which service steps are included in each package family. Use it with CarPrice2025.PNG for current package and add-on prices."
    draw.multiline_text((margin + 36, 145), "\n".join(wrap(draw, subtitle, font("regular", 24), width - margin * 2 - 72)), font=font("regular", 24), fill=MUTED, spacing=8)

    columns = ["Service", "Premium\nWash", "Basic\nDetail", "Complete\nDetail", "Interior\nDetail", "Exterior\nDetail", "Notes"]
    widths = [600, 155, 155, 190, 190, 190, 280]
    y, head_h = 260, 88
    rounded(draw, (margin, y, width - margin, y + head_h), fill=ACCENT, radius=18)
    x = margin
    for idx, column in enumerate(columns):
        col_w = widths[idx]
        if idx:
            draw.line((x, y + 10, x, y + head_h - 10), fill="#9db5ff", width=1)
        if idx == 0:
            draw.text((x + 18, y + 24), column, font=font("bold", 24), fill=WHITE)
        else:
            draw.multiline_text((x + col_w / 2, y + head_h / 2 - 18), column, font=font("bold", 22), fill=WHITE, anchor="mm", align="center", spacing=2)
        x += col_w
    y += head_h + 10

    rows = []
    for service in service_matrix:
        rows.append([service["service"], *["YES" if service["included_in"].get(code) else "—" for code in pkg_codes], service.get("conditional_note") or ""])

    for row_index, row in enumerate(rows):
        note_lines = wrap(draw, row[-1], font("regular", 20), widths[-1] - 24) if row[-1] else [""]
        service_lines = wrap(draw, row[0], font("bold", 22), widths[0] - 28)
        line_count = max(len(note_lines), len(service_lines), 1)
        row_h = max(62, 24 + line_count * 24)
        fill = PANEL if row_index % 2 == 0 else PANEL_ALT
        rounded(draw, (margin, y, width - margin, y + row_h), fill=fill, outline=BORDER, radius=14, width=1)
        x = margin
        for idx, value in enumerate(row):
            col_w = widths[idx]
            if idx:
                draw.line((x, y + 8, x, y + row_h - 8), fill=BORDER, width=1)
            if idx == 0:
                text_h = len(service_lines) * 22 + (len(service_lines) - 1) * 4
                draw.multiline_text((x + 16, y + (row_h - text_h) / 2 - 1), "\n".join(service_lines), font=font("bold", 22), fill=TEXT, spacing=4)
            elif 1 <= idx <= 5:
                color = ACCENT2 if value == "YES" else "#6f84a0"
                draw.text((x + col_w / 2, y + row_h / 2), value, font=font("bold", 24), fill=color, anchor="mm")
            else:
                text_h = len(note_lines) * 20 + (len(note_lines) - 1) * 4
                draw.multiline_text((x + 14, y + (row_h - text_h) / 2 - 1), "\n".join(note_lines), font=font("regular", 20), fill=MUTED, spacing=4)
            x += col_w
        y += row_h + 8

    legend_y = y + 12
    rounded(draw, (margin, legend_y, width - margin, legend_y + 150), fill=PANEL, outline=BORDER, radius=22, width=1)
    draw.text((margin + 24, legend_y + 20), "Legend", font=font("bold", 26), fill=TEXT)
    legend = [
        "YES = Included in package",
        "— = Not included in package",
        "Where equipped = only applies when that seat or material type exists on the vehicle",
        "Add-ons, travel charges, and surcharges are priced separately from this matrix"
    ]
    yy = legend_y + 62
    for item in legend:
        draw.text((margin + 28, yy), f"• {item}", font=font("regular", 21), fill=MUTED)
        yy += 28

    img.convert("RGB").save(OUT_DIR / "CarPriceDetails2025.PNG", quality=95)



def size_chart(data):
    width, height, margin = 1700, 1080, 70
    img = Image.new("RGBA", (width, height), BG)
    draw = ImageDraw.Draw(img)

    rounded(draw, (margin, 45, width - margin, 230), fill=PANEL, outline=BORDER, radius=28, width=2)
    draw.text((margin + 36, 88), "Rosie Dazzlers Vehicle Size Guide", font=font("black", 46), fill=TEXT)
    subtitle = "Use this quick guide before booking or quoting. Final size can still be adjusted after staff review, but this keeps small, mid-size, and oversize / exotic choices consistent with the live pricing catalog."
    draw.multiline_text((margin + 36, 145), "\n".join(wrap(draw, subtitle, font("regular", 24), width - margin * 2 - 72)), font=font("regular", 24), fill=MUTED, spacing=8)

    badge = "Matches booking + pricing"
    badge_w = draw.textbbox((0, 0), badge, font=font("bold", 22))[2]
    rounded(draw, (width - margin - 36 - badge_w - 28, 86, width - margin - 36, 132), fill=ACCENT, radius=18)
    draw.text((width - margin - 50, 109), badge, font=font("bold", 22), fill=WHITE, anchor="ra")

    card_y = 280
    gap = 26
    card_w = int((width - (margin * 2) - (gap * 2)) / 3)
    card_h = 540
    size_cards = [
        {
            "title": "Small",
            "accent": "#22c55e",
            "price": "Compact pricing tier",
            "examples": ["Compact cars", "Sedans", "Coupes", "Hatchbacks"],
            "rule": "Best fit when the vehicle is lower, narrower, and closer to standard passenger-car size.",
        },
        {
            "title": "Mid-size",
            "accent": "#4d77ff",
            "price": "Mid-size pricing tier",
            "examples": ["Crossovers", "Mid-size sedans", "Small SUVs", "Wagons"],
            "rule": "Use this when the vehicle has more cabin or cargo room than a compact car but is not a full-size SUV, truck, or van.",
        },
        {
            "title": "Oversize / Exotic",
            "accent": "#f59e0b",
            "price": "Oversize + exotic pricing tier",
            "examples": ["SUVs", "Trucks", "Vans", "Exotic / specialty vehicles"],
            "rule": "Use this tier for larger body sizes, oversized work vehicles, or premium/exotic vehicles that need extra setup time or care.",
        },
    ]

    for idx, card in enumerate(size_cards):
        x0 = margin + idx * (card_w + gap)
        x1 = x0 + card_w
        rounded(draw, (x0, card_y, x1, card_y + card_h), fill=PANEL, outline=BORDER, radius=24, width=2)
        rounded(draw, (x0, card_y, x1, card_y + 74), fill=card["accent"], radius=24)
        draw.text((x0 + 22, card_y + 20), card["title"], font=font("bold", 30), fill=WHITE)
        draw.text((x0 + 22, card_y + 96), card["price"], font=font("bold", 24), fill=TEXT)

        yy = card_y + 142
        draw.text((x0 + 22, yy), "Common examples", font=font("bold", 22), fill=MUTED)
        yy += 38
        for ex in card["examples"]:
            draw.text((x0 + 28, yy), f"• {ex}", font=font("regular", 22), fill=TEXT)
            yy += 34

        yy += 16
        draw.text((x0 + 22, yy), "Sizing note", font=font("bold", 22), fill=MUTED)
        yy += 38
        rule_lines = wrap(draw, card["rule"], font("regular", 21), card_w - 44)
        draw.multiline_text((x0 + 22, yy), "\n".join(rule_lines), font=font("regular", 21), fill=TEXT, spacing=6)

    note_y = card_y + card_h + 28
    rounded(draw, (margin, note_y, width - margin, note_y + 170), fill=PANEL_ALT, outline=BORDER, radius=22, width=1)
    notes = [
        "Quick reminders:",
        "• Vehicle size affects package price and many add-on prices.",
        "• Staff can still adjust the final size during review if the booking choice does not match the actual vehicle.",
        "• Oversize / Exotic is currently one shared tier in the canonical pricing catalog.",
    ]
    draw.multiline_text((margin + 24, note_y + 24), "\n".join(notes), font=font("regular", 22), fill=MUTED, spacing=8)

    img.convert("RGB").save(OUT_DIR / "CarSizeChart.PNG", quality=95)

def main():
    data = json.loads(DATA_PATH.read_text())
    price_chart(data)
    details_chart(data)
    size_chart(data)
    print("Generated", OUT_DIR / "CarPrice2025.PNG")
    print("Generated", OUT_DIR / "CarPriceDetails2025.PNG")
    print("Generated", OUT_DIR / "CarSizeChart.PNG")


if __name__ == "__main__":
    main()
