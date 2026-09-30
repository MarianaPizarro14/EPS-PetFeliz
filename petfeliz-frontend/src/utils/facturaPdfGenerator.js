// src/utils/facturaPdfGenerator.js
// Generador uniforme de Facturas Digitales e Imprimibles en PDF para EPS PetFeliz

export const generateInvoiceHTML = (pago) => {
  if (!pago) return ''

  const clienteNombre = pago.cliente?.nombre || pago.cliente_nombre || pago.usuario_nombre || 'Cliente EPS PetFeliz'
  const clienteCedula = pago.cliente?.cedula || pago.cedula || '1020304050'
  const idFactura = pago.referencia_transaccion || pago.referencia || `FAC-2026-${pago.id_pago || '001'}`
  const fecha = pago.fecha_formateada || pago.fecha || pago.fecha_pago || pago.fecha_cita || new Date().toLocaleDateString('es-CO')
  const monto = pago.monto_formateado || (typeof pago.monto === 'number' ? `$ ${pago.monto.toLocaleString('es-CO')} COP` : pago.monto ? `$ ${pago.monto}` : '$ 0 COP')
  const metodo = pago.metodo_pago || 'Pasarela PSE / Wompi'
  const servicio = pago.servicio || pago.servicio_nombre || 'Servicio Médico Veterinario / Cobertura EPS'
  const estado = (pago.estado || 'CONFIRMADO').toUpperCase()

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Factura_${idFactura}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700&display=swap');
        body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 30px 20px; }
        
        .no-print.action-bar {
          max-width: 820px;
          margin: 0 auto 20px auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px 22px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }

        .action-bar-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .action-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          padding: 9px 18px;
          border-radius: 9px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .btn-pdf {
          background: #059669;
          color: #ffffff;
        }

        .btn-pdf:hover {
          background: #047857;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        }

        .btn-print {
          background: #0284c7;
          color: #ffffff;
        }

        .btn-print:hover {
          background: #0369a1;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
        }

        .invoice-box {
          max-width: 820px;
          margin: auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
          position: relative;
          overflow: hidden;
        }

        .top-stripe {
          display: flex;
          height: 5px;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }

        .stripe-green { flex: 2; background: #059669; }
        .stripe-blue { flex: 1; background: #0284c7; }
        .stripe-yellow { flex: 1; background: #f59e0b; }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 24px;
          margin-bottom: 30px;
          margin-top: 10px;
        }

        .logo-title {
          font-family: 'Sora', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #059669;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .logo-sub {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
          font-weight: 500;
        }

        .badge {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
          padding: 8px 18px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: inline-block;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }

        .info-card-client {
          background: #fffbe6;
          border: 1px solid #fde68a;
          padding: 18px 22px;
          border-radius: 12px;
        }

        .info-card-client h4 {
          font-family: 'Sora', sans-serif;
          margin: 0 0 10px 0;
          color: #b45309;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .info-card-tx {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 18px 22px;
          border-radius: 12px;
        }

        .info-card-tx h4 {
          font-family: 'Sora', sans-serif;
          margin: 0 0 10px 0;
          color: #0369a1;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .info-card p {
          margin: 5px 0;
          font-size: 14px;
          color: #334155;
        }

        .info-card p strong {
          color: #0f172a;
          font-weight: 600;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 30px;
        }

        th {
          background: #059669;
          color: #ffffff;
          text-align: left;
          padding: 14px 18px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        th:first-child { border-top-left-radius: 8px; }
        th:last-child { border-top-right-radius: 8px; }

        td {
          padding: 16px 18px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
          color: #334155;
        }

        .total-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          background: #ecfdf5;
          border-radius: 12px;
          border: 1.5px solid #a7f3d0;
          margin-bottom: 30px;
        }

        .total-box span {
          font-size: 15px;
          color: #047857;
          font-weight: 700;
        }

        .total-box strong {
          font-size: 24px;
          color: #059669;
          font-weight: 700;
          font-family: 'Sora', sans-serif;
        }

        .footer {
          margin-top: 40px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 24px;
          font-size: 12px;
          color: #64748b;
          line-height: 1.6;
        }

        @media print {
          body { padding: 0; background: #ffffff; }
          .no-print { display: none !important; }
          .invoice-box { border: none; box-shadow: none; padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="no-print action-bar">
        <div class="action-bar-info">
          <strong style="color: #059669; font-family: 'Sora', sans-serif; font-size: 14px;">Comprobante Digital Oficial EPS PetFeliz</strong>
          <span style="font-size: 12px; color: #64748b;">Visualiza tu factura digital o utiliza las opciones para guardar como PDF e imprimir</span>
        </div>
        <div class="action-buttons">
          <button type="button" class="btn-action btn-pdf" onclick="window.print()">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:6px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Guardar / Descargar PDF
          </button>
          <button type="button" class="btn-action btn-print" onclick="window.print()">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:6px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Imprimir Factura
          </button>
        </div>
      </div>

      <div class="invoice-box">
        <div class="top-stripe">
          <div class="stripe-green"></div>
          <div class="stripe-blue"></div>
          <div class="stripe-yellow"></div>
        </div>

        <div class="header">
          <div>
            <h1 class="logo-title">EPS PetFeliz</h1>
            <div class="logo-sub">Factura Electrónica de Venta y Comprobante Oficial</div>
          </div>
          <div>
            <span class="badge">${estado}</span>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card-client info-card">
            <h4>DATOS DEL CLIENTE / AFILIADO</h4>
            <p><strong>Nombre:</strong> ${clienteNombre}</p>
            <p><strong>Cédula / Documento:</strong> ${clienteCedula}</p>
            <p><strong>Método de Pago:</strong> ${metodo}</p>
          </div>
          <div class="info-card-tx info-card">
            <h4>DETALLES DE LA TRANSACCIÓN</h4>
            <p><strong>N° Factura:</strong> ${idFactura}</p>
            <p><strong>Fecha / Hora:</strong> ${fecha}</p>
            <p><strong>Estado:</strong> <span style="color:#0284c7; font-weight:700;">PROCESADO Y VERIFICADO</span></p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Descripción del Servicio / Cobertura</th>
              <th style="text-align:center;">Cantidad</th>
              <th style="text-align:right;">Monto Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong style="color: #0f172a; font-size: 15px;">${servicio}</strong><br>
                <span style="font-size:12.5px; color:#64748b;">Atención médica veterinaria e intervenciones clínicas institucionales en EPS PetFeliz</span>
              </td>
              <td style="text-align:center; font-weight: 600;">1</td>
              <td style="text-align:right; font-weight:700; color:#059669; font-size: 16px;">${monto}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <span>VALOR TOTAL PAGADO:</span>
          <strong>${monto}</strong>
        </div>

        <div class="footer">
          <p><strong>EPS PetFeliz S.A.S.</strong> • NIT 901.458.963-4 • Sistema Integral de Salud Veterinaria</p>
          <p>Este documento representa el comprobante fiscal y oficial de pago generado electrónicamente por la plataforma.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const openInvoiceWindow = (pago) => {
  const invoiceHtml = generateInvoiceHTML(pago)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
  }
}
