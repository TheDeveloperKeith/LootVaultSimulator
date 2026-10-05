"""Render the editable project guide into a paginated PDF."""
from pathlib import Path
import re
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/Understanding-LootVault.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Guide', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('GuideBold', 'C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFontFamily('Guide', normal='Guide', bold='GuideBold')
body = ParagraphStyle('Body', fontName='Guide', fontSize=9.2, leading=13, spaceAfter=9, textColor=colors.HexColor('#253247'))
title = ParagraphStyle('Title', parent=body, fontName='GuideBold', fontSize=22, leading=28, spaceAfter=20, textColor=colors.HexColor('#11223a'))
sub = ParagraphStyle('Sub', parent=body, fontName='GuideBold', fontSize=12, leading=17, spaceBefore=12, spaceAfter=7)
cell = ParagraphStyle('Cell', parent=body, fontSize=8.3, leading=12, spaceAfter=0)

def markup(s):
    s = escape(s)
    s = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<link href="\2" color="#245a92">\1</link>', s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    return s.replace('`', '')

lines = (ROOT / 'docs/understanding-lootvault.md').read_text(encoding='utf-8').splitlines()
story=[]; paragraph=[]; tables=[]; chapters=0
def flush():
    if paragraph:
        story.append(Paragraph(markup(' '.join(paragraph)),body)); paragraph.clear()
def flush_table():
    if not tables: return
    data=[[Paragraph(markup(c),cell) for c in row] for row in tables]
    n=len(data[0]); widths={2:[142,362],3:[128,188,188],4:[146,96,130,132]}.get(n,[504/n]*n)
    table=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e9eef5')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,-1),0.4,colors.HexColor('#d6dce5'))]))
    story.extend([table,Spacer(1,12)]); tables.clear()
for line in lines:
    if line.startswith('# '): continue
    if line.startswith('## '):
        flush(); flush_table()
        if chapters: story.append(PageBreak())
        else: story.append(Paragraph('UNDERSTANDING LOOTVAULT',sub))
        chapters+=1; story.append(Paragraph(markup(line[3:]),title))
    elif line.startswith('### '):
        flush(); flush_table(); story.append(Paragraph(markup(line[4:]),sub))
    elif line.startswith('|'):
        flush()
        if not re.match(r'^\|[\s:|\-]+$',line): tables.append([c.strip() for c in line.strip('|').split('|')])
    elif not line.strip(): flush(); flush_table()
    elif line.startswith('- ') or re.match(r'^\d+\. ',line):
        flush(); flush_table(); story.append(Paragraph(markup(line),body))
    else: paragraph.append(line)
flush(); flush_table()
def footer(c,doc):
    c.saveState(); c.setFont('Guide',8); c.setFillColor(colors.HexColor('#607086'))
    c.drawString(54,26,'LootVault | Project guide | 5 October 2026')
    c.drawRightString(558,26,str(doc.page)); c.restoreState()
SimpleDocTemplate(str(OUT),pagesize=(612,792),leftMargin=54,rightMargin=54,topMargin=44,bottomMargin=48,title='Understanding LootVault',author='LootVault project guide').build(story,onFirstPage=footer,onLaterPages=footer)
print(str(OUT))
