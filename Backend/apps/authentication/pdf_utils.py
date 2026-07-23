import io

from reportlab.graphics.barcode.code128 import Code128
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


def generate_shipping_labels_pdf(orders) -> io.BytesIO:
    buffer = io.BytesIO()
    width, height = letter
    label_width = width
    label_height = 3 * inch

    can = canvas.Canvas(buffer, pagesize=(label_width, label_height))

    for i, order in enumerate(orders):
        if i > 0:
            can.showPage()
            can.setPageSize((label_width, label_height))

        buyer = order.buyer
        profile = getattr(buyer, "buyer_profile", None)
        company = profile.company_name if profile else ""
        address = order.delivery_address

        y = label_height - 0.5 * inch

        can.setFont("Helvetica-Bold", 16)
        can.drawString(0.5 * inch, y, "ETIQUETA DE ENVÍO")
        y -= 0.3 * inch

        can.setFont("Helvetica", 10)
        can.drawString(0.5 * inch, y, f"Orden #{order.id}")
        y -= 0.15 * inch

        can.drawString(0.5 * inch, y, f"Fecha: {order.created_at.strftime('%d/%m/%Y %H:%M')}")
        y -= 0.3 * inch

        can.setFont("Helvetica-Bold", 11)
        can.drawString(0.5 * inch, y, "Para:")
        y -= 0.18 * inch
        can.setFont("Helvetica", 11)
        can.drawString(0.5 * inch, y, buyer.full_name)
        y -= 0.15 * inch

        if company:
            can.drawString(0.5 * inch, y, company)
            y -= 0.15 * inch

        can.setFont("Helvetica", 10)
        can.drawString(0.5 * inch, y, address)
        y -= 0.4 * inch

        can.setFont("Helvetica", 9)
        can.drawString(0.5 * inch, y, f"Subtotal: ${order.subtotal}")
        can.drawString(2.5 * inch, y, f"IVA: ${order.tax}")
        y -= 0.15 * inch
        can.setFont("Helvetica-Bold", 10)
        can.drawString(0.5 * inch, y, f"Total: ${order.total}")

        bc = Code128(
            str(order.id),
            barWidth=0.019 * inch,
            barHeight=0.35 * inch,
        )
        bc.drawOn(can, 0.5 * inch, 0.25 * inch)

    can.save()
    buffer.seek(0)
    return buffer
