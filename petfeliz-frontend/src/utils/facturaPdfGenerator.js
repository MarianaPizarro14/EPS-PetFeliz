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
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700&display=swap');
        body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px 20px 60px 20px; }

        .invoice-box {
          max-width: 820px;
          margin: auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.05);
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

        /* Barra de acciones inferior (No se imprime) */
        .no-print.bottom-action-bar {
          max-width: 820px;
          margin: 30px auto 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 26px;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .btn-download {
          background: #0f172a;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18);
        }

        .btn-download:hover {
          background: #1e293b;
          transform: translateY(-1.5px);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.28);
        }

        .btn-print {
          background: #ffffff;
          color: #334155;
          border: 1px solid #cbd5e1;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .btn-print:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #94a3b8;
          transform: translateY(-1.5px);
        }

        @media print {
          body { padding: 0; background: #ffffff; }
          .no-print { display: none !important; }
          .invoice-box { border: none; box-shadow: none; padding: 20px; }
        }
      </style>
      <script>
        function descargarPDF() {
          const element = document.querySelector('.invoice-box');
          const btn = document.getElementById('btn-descargar-pdf');
          if (btn) {
            btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:8px; animation: spin 1s linear infinite;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"></path></svg> Generando PDF...';
            btn.style.opacity = '0.8';
          }

          const opt = {
            margin:       [8, 8, 8, 8],
            filename:     'Factura_${idFactura}.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };

          if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(element).save().then(() => {
              if (btn) {
                btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:8px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Descargar Factura (PDF)';
                btn.style.opacity = '1';
              }
            }).catch((err) => {
              console.error('Error html2pdf:', err);
              window.print();
              if (btn) {
                btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:8px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Descargar Factura (PDF)';
                btn.style.opacity = '1';
              }
            });
          } else {
            window.print();
            if (btn) {
              btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:8px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Descargar Factura (PDF)';
              btn.style.opacity = '1';
            }
          }
        }

        function imprimirFactura() {
          window.print();
        }
      </script>
    </head>
    <body>
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

      <!-- Acciones de Descarga e Impresión al final del documento -->
      <div class="no-print bottom-action-bar">
        <button type="button" id="btn-descargar-pdf" class="btn-action btn-download" onclick="descargarPDF()">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:8px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Descargar Factura (PDF)
        </button>
        <button type="button" class="btn-action btn-print" onclick="imprimirFactura()">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:8px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Imprimir Comprobante
        </button>
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

