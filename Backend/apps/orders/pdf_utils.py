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

        can.drawString(
            0.5 * inch, y, f"Fecha: {order.created_at.strftime('%d/%m/%Y %H:%M')}"
        )
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


def generate_receipt_pdf(order) -> io.BytesIO:
    buffer = io.BytesIO()
    width, height = letter
    can = canvas.Canvas(buffer, pagesize=(width, height))
    margin = 0.75 * inch
    y = height - margin

    can.setFont("Helvetica-Bold", 20)
    can.drawCentredString(width / 2, y, "COMPROBANTE DE COMPRA")
    y -= 0.5 * inch

    can.setStrokeColorRGB(0.2, 0.2, 0.2)
    can.setLineWidth(1)
    can.line(margin, y, width - margin, y)
    y -= 0.3 * inch

    can.setFont("Helvetica", 10)
    can.drawString(margin, y, f"Orden: #{order.id}")
    y -= 0.15 * inch
    can.drawString(margin, y, f"Fecha: {order.created_at.strftime('%d/%m/%Y %H:%M')}")
    if order.transaction_id:
        can.drawString(
            3.5 * inch, y + 0.15 * inch, f"Transacción: {order.transaction_id}"
        )
    y -= 0.15 * inch
    can.drawString(margin, y, f"Cliente: {order.buyer.full_name}")
    profile = getattr(order.buyer, "buyer_profile", None)
    if profile and profile.company_name:
        can.drawString(3.5 * inch, y, f"Empresa: {profile.company_name}")
    y -= 0.4 * inch

    can.setStrokeColorRGB(0.8, 0.8, 0.8)
    can.setLineWidth(0.5)
    col_x = [margin, margin + 2.5 * inch, margin + 3.8 * inch, margin + 4.8 * inch]
    col_w = [2.5 * inch, 1.3 * inch, 1.0 * inch, 1.2 * inch]

    can.setFont("Helvetica-Bold", 9)
    headers = ["Producto", "Cant", "P. Unit", "Subtotal"]
    for idx, (cx, cw) in enumerate(zip(col_x, col_w)):
        can.drawString(cx, y, headers[idx])
        can.line(cx, y - 2, cx + cw, y - 2)
    y -= 0.2 * inch

    can.setFont("Helvetica", 9)
    items = order.items.all()
    for item in items:
        can.drawString(col_x[0], y, item.product.name[:40])
        can.drawString(col_x[1], y, str(item.quantity))
        can.drawString(col_x[2], y, f"${item.unit_price}")
        can.drawRightString(col_x[3] + col_w[3] - 0.1 * inch, y, f"${item.subtotal}")
        y -= 0.15 * inch
        if y < 1.5 * inch:
            can.showPage()
            y = height - margin
            can.setFont("Helvetica", 9)

    y -= 0.1 * inch
    can.setStrokeColorRGB(0.8, 0.8, 0.8)
    can.line(margin, y, width - margin, y)
    y -= 0.15 * inch

    can.setFont("Helvetica", 10)
    can.drawRightString(width - margin, y, f"Subtotal: ${order.subtotal}")
    y -= 0.15 * inch
    can.drawRightString(width - margin, y, f"IVA (19%): ${order.tax}")
    y -= 0.15 * inch
    can.setFont("Helvetica-Bold", 12)
    can.drawRightString(width - margin, y, f"Total: ${order.total}")
    y -= 0.3 * inch

    can.setStrokeColorRGB(0.8, 0.8, 0.8)
    can.line(margin, y, width - margin, y)
    y -= 0.3 * inch

    can.setFont("Helvetica", 9)
    can.drawCentredString(width / 2, y, "Smart Snack Office — Gracias por tu compra")
    y -= 0.15 * inch
    can.drawCentredString(width / 2, y, "Este documento es un comprobante de pago.")

    can.save()
    buffer.seek(0)
    return buffer
