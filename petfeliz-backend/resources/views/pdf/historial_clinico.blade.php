<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Historial Clínico - EPS PetFeliz</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            font-size: 12px;
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
        .doc-details {
            text-align: right;
            font-size: 12px;
        }
        .doc-title {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
        }
        .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #0d9488;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-top: 15px;
            margin-bottom: 10px;
        }
        .info-table {
            width: 100%;
            margin-bottom: 15px;
        }
        .info-table td {
            padding: 4px 0;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
            width: 30%;
        }
        .history-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .history-table th {
            background-color: #f1f5f9;
            color: #334155;
            text-align: left;
            padding: 8px;
            font-size: 11px;
            border-bottom: 1px solid #cbd5e1;
        }
        .history-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td>
                <div class="logo-title">EPS PetFeliz</div>
                <div class="logo-sub">Historia Clínica y Expediente Médico Veterinario</div>
            </td>
            <td class="doc-details">
                <div class="doc-title">EXPEDIENTE VETERINARIO</div>
                <div><strong>Fecha Emisión:</strong> {{ date('d/m/Y') }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">INFORMACIÓN DEL PACIENTE Y PROPIETARIO</div>
    <table class="info-table">
        <tr>
            <td class="info-label">Nombre Paciente:</td>
            <td><strong>{{ $mascota->nombre }}</strong></td>
            <td class="info-label">Especie / Raza:</td>
            <td>{{ $mascota->especie }} - {{ $mascota->raza ?? 'Criollo' }}</td>
        </tr>
        <tr>
            <td class="info-label">Sexo / Peso:</td>
            <td>{{ $mascota->sexo ?? 'No registrado' }} • {{ $mascota->peso ? $mascota->peso . ' kg' : 'N/A' }}</td>
            <td class="info-label">Chip / ID Registro:</td>
            <td>{{ $mascota->chip ?? ('CHIP-PET-' . $mascota->id_mascota) }}</td>
        </tr>
        <tr>
            <td class="info-label">Propietario Responsable:</td>
            <td>{{ $cliente_nombre }} (Doc: {{ $cliente_doc }})</td>
            <td class="info-label">Estado de Afiliación:</td>
            <td>
                @if($es_afiliado ?? true)
                    <span style="color: #15803d; font-weight: bold;">✓ AFILIADO EPS (Cobertura Activa)</span>
                @else
                    <span style="color: #b91c1c; font-weight: bold;">NO AFILIADO (Paciente Particular)</span>
                @endif
            </td>
        </tr>
    </table>

    <div class="section-title">REGISTRO CRONOLÓGICO DE ATENCIONES MÉDICAS</div>
    @if(count($historial) === 0)
        <p style="text-align: center; color: #64748b; margin: 30px 0;">No existen atenciones médicas ni observaciones registradas para este paciente.</p>
    @else
        <table class="history-table">
            <thead>
                <tr>
                    <th style="width: 15%;">Fecha / Hora</th>
                    <th style="width: 25%;">Servicio / Motivo</th>
                    <th style="width: 25%;">Especialista</th>
                    <th style="width: 35%;">Observaciones / Diagnóstico</th>
                </tr>
            </thead>
            <tbody>
                @foreach($historial as $h)
                    <tr>
                        <td>
                            <strong>{{ $h['fecha'] }}</strong><br>
                            <span style="color: #64748b; font-size: 10px;">{{ $h['hora'] }}</span>
                        </td>
                        <td>
                            <strong>{{ $h['tipo_servicio'] }}</strong>
                        </td>
                        <td>{{ $h['especialista'] }}</td>
                        <td>{{ $h['observacion'] ?? 'Consulta veterinaria sin observaciones adicionales registadas.' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="footer">
        EPS PetFeliz Veterinarios S.A.S. • Este documento es una copia fidedigna del historial de atenciones registradas en el sistema.
    </div>
</body>
</html>
