<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Factura de Pago - EPS PetFeliz</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            font-size: 13px;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .logo-title {
            font-size: 22px;
            font-weight: bold;
            color: #166534;
        }
        .logo-sub {
            font-size: 11px;
            color: #64748b;
        }
        .invoice-details {
            text-align: right;
            font-size: 12px;
        }
        .invoice-title {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #0d9488;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .info-table {
            width: 100%;
            margin-bottom: 20px;
        }
        .info-table td {
            padding: 5px 0;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
            width: 35%;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 20px;
        }
        .items-table th {
            background-color: #f1f5f9;
            color: #334155;
            text-align: left;
            padding: 8px;
            font-size: 12px;
            border-bottom: 1px solid #cbd5e1;
        }
        .items-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
        }
        .total-box {
            float: right;
            width: 40%;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            text-align: right;
        }
        .total-label {
            font-size: 14px;
            font-weight: bold;
            color: #0f172a;
        }
        .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #166534;
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
        }
        .badge-eps { background-color: #dcfce7; color: #15803d; }
        .badge-copago { background-color: #fef3c7; color: #b45309; }
        .badge-particular { background-color: #e0f2fe; color: #0369a1; }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td>
                <div class="logo-title">EPS PetFeliz</div>
                <div class="logo-sub">Salud e Inmunización Veterinaria • NIT: 901.234.567-8</div>
            </td>
            <td class="invoice-details">
                <div class="invoice-title">RECIBO DE PAGO</div>
                <div><strong>No. Recibo:</strong> {{ $pago->referencia_transaccion ?? ('#PAY-' . $pago->id_pago) }}</div>
                <div><strong>Fecha:</strong> {{ $pago->created_at ? $pago->created_at->format('d/m/Y H:i') : date('d/m/Y') }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">DATOS DEL TITULAR Y PACIENTE</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Titular Afiliado:</td>
            <td>{{ $cliente_nombre }}</td>
        </tr>
        <tr>
            <td class="info-label">Documento Identidad:</td>
            <td>{{ $cliente_doc }}</td>
        </tr>
        <tr>
            <td class="info-label">Mascota (Paciente):</td>
            <td>{{ $mascota_nombre }} ({{ $mascota_especie }} - {{ $mascota_raza }})</td>
        </tr>
        <tr>
            <td class="info-label">Médico Veterinario:</td>
            <td>{{ $veterinario_nombre }}</td>
        </tr>
    </table>

    <div class="section-title">DETALLE DE LA TRANSACCIÓN</div>
    <table class="items-table">
        <thead>
            <tr>
                <th>Servicio Atendido</th>
                <th>Fecha Cita</th>
                <th>Cobertura EPS</th>
                <th>Método de Pago</th>
                <th style="text-align: right;">Monto</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>{{ $servicio_nombre }}</strong></td>
                <td>{{ $fecha_cita }} ({{ $hora_cita }})</td>
                <td>
                    @if($pago->tipo_cobertura === 'eps')
                        <span class="badge badge-eps">Incluido EPS</span>
                    @elseif($pago->tipo_cobertura === 'copago')
                        <span class="badge badge-copago">Copago EPS</span>
                    @else
                        <span class="badge badge-particular">Particular</span>
                    @endif
                </td>
                <td>{{ $pago->metodo_pago }}</td>
                <td style="text-align: right;">
                    @if($pago->monto == 0)
                        $0 COP (Cubierto)
                    @else
                        ${{ number_format($pago->monto, 0, ',', '.') }} COP
                    @endif
                </td>
            </tr>
        </tbody>
    </table>

    <div class="total-box">
        <div class="total-label">Total Liquidado:</div>
        <div class="total-amount">
            @if($pago->monto == 0)
                $0 COP
            @else
                ${{ number_format($pago->monto, 0, ',', '.') }} COP
            @endif
        </div>
        <div style="font-size: 10px; color: #166534; margin-top: 4px;">Estado: Confirmado / Transacción Aprobada</div>
    </div>

    <div style="clear: both;"></div>

    <div class="footer">
        EPS PetFeliz S.A.S. • Línea Nacional de Atención 01 8000 123 456 • Soporte 24/7 en App PetFeliz<br>
        Este documento es un comprobante digital oficial emitido tras la confirmación de la cita.
    </div>
</body>
</html>
