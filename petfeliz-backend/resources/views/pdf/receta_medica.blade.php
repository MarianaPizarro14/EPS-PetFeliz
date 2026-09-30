<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Receta Médica - EPS PetFeliz</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            font-size: 12px;
        }
        .header-table {
            width: 100%;
            border-bottom: 3px solid #059669;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .logo-title {
            font-size: 22px;
            font-weight: bold;
            color: #059669;
            letter-spacing: -0.5px;
        }
        .logo-sub {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
        }
        .doc-details {
            text-align: right;
            font-size: 11px;
        }
        .doc-title {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
        }
        .rx-badge {
            background-color: #ecfdf5;
            color: #047857;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: bold;
            display: inline-block;
            margin-top: 4px;
            border: 1px solid #a7f3d0;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #047857;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-top: 18px;
            margin-bottom: 10px;
        }
        .info-table {
            width: 100%;
            margin-bottom: 15px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
        }
        .info-table td {
            padding: 4px 8px;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
            width: 25%;
        }
        .med-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }
        .med-table th {
            background-color: #059669;
            color: #ffffff;
            text-align: left;
            padding: 9px 12px;
            font-size: 11px;
            font-weight: bold;
        }
        .med-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .med-name {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
        }
        .med-dosis {
            font-size: 12px;
            color: #047857;
            font-weight: bold;
            margin-top: 2px;
        }
        .med-ind {
            font-size: 11px;
            color: #475569;
            margin-top: 4px;
            font-style: italic;
        }
        .no-meds {
            text-align: center;
            color: #64748b;
            padding: 30px;
            background-color: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 6px;
        }
        .signature-box {
            margin-top: 60px;
            width: 100%;
        }
        .signature-line {
            width: 240px;
            border-top: 1px solid #475569;
            text-align: center;
            padding-top: 6px;
            float: right;
        }
        .vet-name {
            font-weight: bold;
            font-size: 12px;
            color: #0f172a;
        }
        .vet-card {
            font-size: 10px;
            color: #64748b;
        }
        .footer {
            margin-top: 80px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            clear: both;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td>
                <div class="logo-title">EPS PetFeliz</div>
                <div class="logo-sub">Sistema de Salud y Bienestar Animal EPS</div>
            </td>
            <td class="doc-details">
                <div class="doc-title">FÓRMULA / RECETA MÉDICA</div>
                <div class="rx-badge">Rx PRESCRIPCIÓN VETERINARIA</div>
                <div style="margin-top: 4px;"><strong>Fecha:</strong> {{ $fecha_emision }} - {{ $hora_emision }}</div>
                <div><strong>N° Consulta:</strong> CITA-{{ $cita->id_cita }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">DATOS DEL PACIENTE Y TUTOR</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Paciente Mascotas:</td>
            <td><strong>{{ $mascota_nombre }}</strong></td>
            <td class="info-label">Especie / Raza:</td>
            <td>{{ $mascota_especie }} — {{ $mascota_raza }}</td>
        </tr>
        <tr>
            <td class="info-label">Peso Corporal:</td>
            <td>{{ $mascota_peso }}</td>
            <td class="info-label">Servicio Atendido:</td>
            <td>{{ $servicio_nombre }}</td>
        </tr>
        <tr>
            <td class="info-label">Tutor / Cliente:</td>
            <td>{{ $cliente_nombre }} (Doc: {{ $cliente_doc }})</td>
            <td class="info-label">Médico Tratante:</td>
            <td>{{ $veterinario_nombre }}</td>
        </tr>
    </table>

    <div class="section-title">MEDICAMENTOS RECETADOS Y POSOLOGÍA</div>

    @if(empty($medicamentos) || count($medicamentos) === 0)
        <div class="no-meds">
            No se prescribieron medicamentos para esta consulta médica.
        </div>
    @else
        <table class="med-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 35%;">Medicamento / Fármaco</th>
                    <th style="width: 30%;">Dosis y Frecuencia</th>
                    <th style="width: 30%;">Indicaciones Especiales</th>
                </tr>
            </thead>
            <tbody>
                @foreach($medicamentos as $idx => $m)
                    <tr>
                        <td style="font-weight: bold; color: #64748b;">{{ $idx + 1 }}</td>
                        <td>
                            <div class="med-name">{{ $m['nombre'] ?? 'Medicamento' }}</div>
                        </td>
                        <td>
                            <div class="med-dosis">{{ $m['dosis'] ?? 'Según indicación del veterinario' }}</div>
                        </td>
                        <td>
                            <div class="med-ind">{{ $m['indicaciones'] ?? 'Sin indicaciones adicionales' }}</div>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div style="margin-top: 25px; padding: 10px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 10px; color: #b45309;">
        <strong>Nota importante para el tutor:</strong> Siga estrictamente las dosis y horarios indicados. No suspenda el tratamiento antes del tiempo estipulado sin consultar a su médico veterinario de cabecera.
    </div>

    <div class="signature-box">
        <div class="signature-line">
            <div class="vet-name">{{ $veterinario_nombre }}</div>
            <div class="vet-card">{{ $veterinario_especialidad }}</div>
            <div class="vet-card">Tarjeta Prof.: {{ $veterinario_tarjeta }}</div>
        </div>
    </div>

    <div class="footer">
        EPS PetFeliz Veterinarios S.A.S. • Documento Oficial de Prescripción Médica Veterinaria Generado Electrónicamente.
    </div>
</body>
</html>
