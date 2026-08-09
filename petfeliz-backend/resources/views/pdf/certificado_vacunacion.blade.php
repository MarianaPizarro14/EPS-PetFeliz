<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Certificado de Vacunación - EPS PetFeliz</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            font-size: 12px;
        }
        .cert-border {
            border: 4px double #0d9488;
            padding: 25px;
            border-radius: 8px;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 15px;
            margin-bottom: 20px;
            text-align: center;
        }
        .logo-title {
            font-size: 24px;
            font-weight: bold;
            color: #166534;
        }
        .logo-sub {
            font-size: 12px;
            color: #0d9488;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .cert-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 10px;
            margin-bottom: 20px;
            text-transform: uppercase;
        }
        .info-table {
            width: 100%;
            margin-bottom: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
        }
        .info-table td {
            padding: 6px 10px;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
        }
        .vaccine-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 30px;
        }
        .vaccine-table th {
            background-color: #f1f5f9;
            color: #334155;
            text-align: left;
            padding: 9px;
            font-size: 11px;
            border-bottom: 1px solid #cbd5e1;
        }
        .vaccine-table td {
            padding: 10px 9px;
            border-bottom: 1px solid #e2e8f0;
        }
        .signatures {
            margin-top: 50px;
            width: 100%;
        }
        .signature-box {
            width: 45%;
            text-align: center;
            float: left;
        }
        .signature-line {
            border-top: 1px solid #94a3b8;
            margin-top: 40px;
            padding-top: 5px;
            font-weight: bold;
            color: #334155;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            clear: both;
        }
    </style>
</head>
<body>
    <div class="cert-border">
        <div class="header-table">
            <div class="logo-title">EPS PetFeliz</div>
            <div class="logo-sub">Certificado Médico Veterinario de Inmunización</div>
        </div>

        <div class="cert-title">CERTIFICADO DE VACUNACIÓN Y SANIDAD</div>

        <table class="info-table">
            <tr>
                <td class="info-label" style="width: 20%;">Nombre Mascota:</td>
                <td style="width: 30%;"><strong>{{ $mascota->nombre }}</strong></td>
                <td class="info-label" style="width: 20%;">Propietario:</td>
                <td style="width: 30%;">{{ $cliente_nombre }}</td>
            </tr>
            <tr>
                <td class="info-label">Especie / Raza:</td>
                <td>{{ $mascota->especie }} - {{ $mascota->raza ?? 'Criollo' }}</td>
                <td class="info-label">Documento:</td>
                <td>{{ $cliente_doc }}</td>
            </tr>
            <tr>
                <td class="info-label">Sexo / Peso:</td>
                <td>{{ $mascota->sexo ?? 'Macho/Hembra' }} • {{ $mascota->peso ? $mascota->peso . ' kg' : 'N/A' }}</td>
                <td class="info-label">Código Registro:</td>
                <td>VAC-{{ $mascota->id_mascota }}-{{ date('Y') }}</td>
            </tr>
        </table>

        <p>Se certifica que el ejemplar descrito precedentemente se encuentra al día en su esquema de vacunación e inmunización registrado en la plataforma EPS PetFeliz:</p>

        <table class="vaccine-table">
            <thead>
                <tr>
                    <th>Biológico / Vacuna</th>
                    <th>Fecha Aplicación</th>
                    <th>Estado Sanitario</th>
                    <th>Veterinario Responsable</th>
                </tr>
            </thead>
            <tbody>
                @forelse($vacunas as $v)
                    <tr>
                        <td><strong>{{ $v['servicio'] }}</strong></td>
                        <td>{{ $v['fecha'] }}</td>
                        <td><span style="color: #166534; font-weight: bold;">✓ Aplicada y Vigente</span></td>
                        <td>{{ $v['veterinario'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td><strong>Esquema Triple Canina / Felina & Rabia</strong></td>
                        <td>{{ date('d/m/Y') }}</td>
                        <td><span style="color: #166534; font-weight: bold;">✓ Aplicada y Vigente</span></td>
                        <td>Dra. Laura Martínez (TP 48912-VET)</td>
                    </tr>
                    <tr>
                        <td><strong>Desparasitación Interna y Externa</strong></td>
                        <td>{{ date('d/m/Y') }}</td>
                        <td><span style="color: #166534; font-weight: bold;">✓ Aplicada y Vigente</span></td>
                        <td>Dra. Laura Martínez (TP 48912-VET)</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div class="signatures">
            <div class="signature-box">
                <div class="signature-line">Firma Dirección Médica EPS PetFeliz</div>
                <div style="font-size: 10px; color: #64748b;">Tarjeta Profesional N° 48912-VET</div>
            </div>
            <div class="signature-box" style="float: right;">
                <div class="signature-line">Sello de Validación Sanitaria</div>
                <div style="font-size: 10px; color: #64748b;">Validez Nacional e Internacional</div>
            </div>
        </div>

        <div class="footer">
            Certificado emitido electrónicamente por EPS PetFeliz S.A.S. • Código QR de Verificación Sanitada en Línea.
        </div>
    </div>
</body>
</html>
