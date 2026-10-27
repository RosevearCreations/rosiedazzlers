"""Render the committed Build 682 owner release brief to a polished, readable PDF."""
from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "BUILD682_GIFT_RECHECK_FOLLOWUP_RECURRENCE.md"
OUTPUT = ROOT / "output" / "pdf" / "rosiedazzlers-build682-gift-recovery-release.pdf"
CHARCOAL = colors.HexColor("#1D2229")
GOLD = colors.HexColor("#B49245")
SLATE = colors.HexColor("#495465")


def markup(text: str) -> str:
    safe = html.escape(text)
    safe = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", safe)
    safe = re.sub(r"`([^`]+)`", r"<font name='Courier' size='8'>\1</font>", safe)
    safe = re.sub(r"(?<!\S)(https://[^\s<]+)", r"<link href='\1' color='#765F2B'>\1</link>", safe)
    return safe


def render():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    regular = ParagraphStyle("regular", fontName="Helvetica", fontSize=10.2, leading=15.3,
                             textColor=CHARCOAL, spaceAfter=9, alignment=TA_LEFT)
    title = ParagraphStyle("title", parent=regular, fontName="Helvetica-Bold",
                           fontSize=20.5, leading=25, textColor=CHARCOAL, spaceBefore=0,
                           spaceAfter=12)
    subtitle = ParagraphStyle("subtitle", parent=regular, fontName="Helvetica-Bold",
                              fontSize=13.2, leading=18.2, textColor=SLATE, spaceAfter=14)
    heading = ParagraphStyle("heading", parent=regular, fontName="Helvetica-Bold",
                             fontSize=12, leading=16, textColor=GOLD,
                             spaceBefore=11, spaceAfter=7)
    bullet = ParagraphStyle("bullet", parent=regular, leftIndent=16, firstLineIndent=-11,
                            spaceAfter=6, leading=14.5)
    note = ParagraphStyle("note", parent=regular, fontSize=9.5, leading=13.5,
                          textColor=SLATE, spaceAfter=5)
    styles = {1: title, 2: subtitle, 3: heading}
    blocks = []
    for raw in SOURCE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line:
            blocks.append(Spacer(1, 2))
            continue
        match = re.match(r"^(#{1,3})\s+(.+)$", line)
        if match:
            level = len(match.group(1))
            if match.group(2) == "Protection and audit trail":
                blocks.append(PageBreak())
            blocks.append(Paragraph(markup(match.group(2)), styles[level]))
        elif re.match(r"^\d+\.\s+", line):
            number, content = line.split(". ", 1)
            blocks.append(Paragraph(markup(number + ".  " + content), bullet))
        elif line.startswith("- "):
            blocks.append(Paragraph(markup("-  " + line[2:]), bullet))
        else:
            blocks.append(Paragraph(markup(line), note if line.startswith("**Release date:") else regular))

    def decorate(canvas, doc):
        canvas.saveState()
        width, height = letter
        canvas.setFillColor(CHARCOAL)
        canvas.rect(0, height - 10, width, 10, stroke=0, fill=1)
        canvas.setFillColor(GOLD)
        canvas.rect(0, height - 13, width, 3, stroke=0, fill=1)
        canvas.setStrokeColor(colors.HexColor("#C9CDD2"))
        canvas.line(0.65 * inch, 0.67 * inch, width - 0.65 * inch, 0.67 * inch)
        canvas.setFillColor(SLATE)
        canvas.setFont("Helvetica", 8)
        canvas.drawString(0.7 * inch, 0.45 * inch, "ROSIE DAZZLERS  |  BUILD 682  |  INTERNAL HOLD RELEASE BRIEF")
        canvas.drawRightString(width - 0.7 * inch, 0.45 * inch, f"Page {doc.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(str(OUTPUT), pagesize=letter, leftMargin=0.73 * inch,
                            rightMargin=0.73 * inch, topMargin=0.56 * inch,
                            bottomMargin=0.85 * inch, title="Rosie Dazzlers Build 682 - Gift Recovery HOLD",
                            author="Rosie Dazzlers")
    doc.build(blocks, onFirstPage=decorate, onLaterPages=decorate)
    print(OUTPUT)


if __name__ == "__main__":
    render()
