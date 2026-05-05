from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_report_pdf(path: Path, report_payload: dict) -> Path:
    styles = getSampleStyleSheet()
    document = SimpleDocTemplate(str(path), pagesize=A4)
    elements = []

    elements.append(Paragraph("Plagiarism Detection Report", styles["Title"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Report ID: {report_payload['report_id']}", styles["BodyText"]))
    elements.append(Paragraph(f"Classification: {report_payload['classification']}", styles["BodyText"]))
    elements.append(Paragraph(f"Similarity Score: {report_payload['similarity_score']}%", styles["BodyText"]))
    elements.append(Spacer(1, 12))

    rows = [["Source", "Score", "Classification"]]
    for source in report_payload.get("matched_sources", []):
        rows.append([source["title"], f"{source['score']}%", source["classification"]])

    table = Table(rows)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#10213d")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d4e1f7")),
                ("ALIGN", (1, 1), (-1, -1), "CENTER"),
            ]
        )
    )
    elements.append(table)

    document.build(elements)
    return path
