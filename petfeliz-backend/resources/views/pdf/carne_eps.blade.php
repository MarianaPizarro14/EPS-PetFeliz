<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Certificado de Afiliación - EPS PetFeliz</title>
    <style>
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px 30px;
            font-size: 9.5px;
            background-color: #ffffff;
        }

        /* ── MARCA DE AGUA SIN USAR BACKGROUND-IMAGE (COMPATIBLE CON DOMPDF SIN EXTENSIÓN GD) ── */
        .watermark-grid {
            position: fixed;
            top: -20px;
            left: -20px;
            width: 110%;
            height: 110%;
            z-index: -1000;
            overflow: hidden;
            pointer-events: none;
        }

        .watermark-text {
            font-size: 13px;
            font-weight: bold;
            color: #16a34a;
            opacity: 0.05;
            display: inline-block;
            margin: 18px 24px;
            transform: rotate(-22deg);
        }

        .document-container {
            width: 100%;
            margin: 0 auto;
            position: relative;
            z-index: 1;
        }

        /* ── ENCABEZADO ── */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #166534;
            margin-bottom: 18px;
        }

        .header-table td {
            padding-bottom: 14px;
        }

        .brand-logo-text {
            font-size: 22px;
            font-weight: bold;
            line-height: 1;
            color: #166534;
        }

        .brand-eps, .brand-pet, .brand-feliz {
            color: #166534;
            font-weight: bold;
        }

        .brand-sub {
            font-size: 8px;
            color: #64748b;
            font-weight: bold;
            margin-top: 4px;
            letter-spacing: 0.5px;
        }

        .affiliate-badge-box {
            border: 1.5px solid #0284c7;
            border-radius: 6px;
            padding: 6px 14px;
            background-color: #f0f9ff;
            text-align: right;
            display: inline-block;
            margin-bottom: 6px;
        }

        .affiliate-badge-label {
            font-size: 7.5px;
            color: #0284c7;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .affiliate-badge-code {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 2px;
        }

        /* ── TÍTULO PRINCIPAL ── */
        .doc-title-main {
            text-align: center;
            font-size: 13.5px;
            font-weight: bold;
            color: #166534;
            text-transform: uppercase;
            margin-top: 14px;
            margin-bottom: 16px;
            letter-spacing: 0.2px;
        }

        /* ── TEXTO DE CERTIFICACIÓN FORMAL ── */
        .cert-statement {
            font-size: 9.5px;
            color: #334155;
            line-height: 1.5;
            margin-bottom: 12px;
        }

        .cert-title-big {
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            margin: 14px 0;
            letter-spacing: 1px;
        }

        .cert-body-text {
            font-size: 9.5px;
            color: #334155;
            line-height: 1.5;
            margin-bottom: 18px;
        }

        /* ── TABLA CLAVE / VALOR ── */
        .kv-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
        }

        .kv-table td {
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9.5px;
            vertical-align: middle;
        }

        .kv-label {
            font-weight: bold;
            color: #475569;
            width: 36%;
            text-transform: uppercase;
            font-size: 8.5px;
        }

        .kv-value {
            color: #0f172a;
            font-weight: bold;
            width: 64%;
        }

        .text-accent {
            color: #166534;
            font-size: 10.5px;
        }

        .status-active {
            color: #15803d;
            font-weight: bold;
        }

        .status-inactive {
            color: #b91c1c;
            font-weight: bold;
        }

        /* ── SECCIONES SECUNDARIAS ── */
        .sub-section-title {
            font-size: 10px;
            font-weight: bold;
            color: #166534;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-top: 18px;
            margin-bottom: 10px;
        }

        /* ── TABLA MASCOTAS ── */
        .pets-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        .pets-table th {
            background-color: #f1f5f9;
            color: #334155;
            text-align: left;
            padding: 6px 8px;
            font-size: 8.5px;
            border-bottom: 1.5px solid #cbd5e1;
            text-transform: uppercase;
        }

        .pets-table td {
            padding: 7px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9px;
            vertical-align: middle;
        }

        .chip-code {
            color: #166534;
            font-weight: bold;
        }

        /* ── TABLA URGENCIAS 24/7 ── */
        .urgencies-table {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            margin-top: 8px;
            margin-bottom: 22px;
            text-align: center;
        }

        .urgencies-table td {
            padding: 8px 6px;
            vertical-align: top;
            width: 33.33%;
        }

        .urgency-sede {
            font-size: 8px;
            font-weight: bold;
            color: #166534;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .urgency-phone {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
        }

        .urgency-tag {
            font-size: 7.5px;
            color: #64748b;
            margin-top: 1px;
        }

        /* ── PIE DE PÁGINA ── */
        .cert-footer {
            margin-top: 25px;
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
        }

        .cert-legal-notice {
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            margin-top: 14px;
            padding: 8px;
            background-color: #f1f5f9;
            border-radius: 4px;
            letter-spacing: 0.3px;
        }
    </style>
</head>
<body>

    <!-- MARCA DE AGUA SUTIL (REPETIDA EN GRID SIN USAR GD EXTENSION) -->
    <div class="watermark-grid">
        @for ($i = 0; $i < 35; $i++)
            <span class="watermark-text">EPS PetFeliz</span>
        @endfor
    </div>

    <div class="document-container">
        <!-- ── ENCABEZADO OFICIAL ── -->
        <table class="header-table">
            <tr>
                <td style="vertical-align: middle;">
                    <table style="border-collapse: collapse;">
                        <tr>
                            <td style="vertical-align: middle; padding-right: 10px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 512 512" style="vertical-align: middle;">
                                    <path fill="#166534" d="M256 224c-70 0-130 55-130 135 0 40 32 75 75 75 24 0 45-12 55-30 10 18 31 30 55 30 43 0 75-35 75-75 0-80-60-135-130-135z"/>
                                    <circle cx="110" cy="190" r="42" fill="#166534"/>
                                    <circle cx="205" cy="115" r="46" fill="#166534"/>
                                    <circle cx="307" cy="115" r="46" fill="#166534"/>
                                    <circle cx="402" cy="190" r="42" fill="#166534"/>
                                </svg>
                            </td>
                            <td style="vertical-align: middle;">
                                <div class="brand-logo-text">
                                    <span class="brand-eps">EPS</span> <span class="brand-pet">PetFeliz</span>
                                </div>
                                <div class="brand-sub">SALUD Y COBERTURA VETERINARIA S.A.S. • NIT 901.234.567-8</div>
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                    <div class="affiliate-badge-box">
                        <div class="affiliate-badge-label">CÓDIGO DE AFILIADO</div>
                        <div class="affiliate-badge-code">{{ $codigo_afiliado ?? ('EPS-PET-' . str_pad($cliente->id_cliente ?? 1, 5, '0', STR_PAD_LEFT)) }}</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- ── TÍTULO DEL CERTIFICADO ── -->
        <div class="doc-title-main">
            CERTIFICADO DE AFILIACIÓN AL PLAN DE BENEFICIOS VETERINARIOS DE EPS PETFELIZ
        </div>

        <!-- ── TEXTO DE CERTIFICACIÓN FORMAL ── -->
        <div class="cert-statement">
            <strong>EPS PETFELIZ S.A.S.</strong> en desarrollo de su programa especial para la garantía del Plan de Cobertura en Salud Veterinaria denominado <strong>EPS PETFELIZ</strong>:
        </div>

        <div class="cert-title-big">
            CERTIFICA
        </div>

        <div class="cert-body-text">
            Que <strong>{{ $cliente_nombre }}</strong> identificado(a) con <strong>CÉDULA DE CIUDADANÍA</strong> número <strong>{{ $cliente_doc }}</strong> está registrado(a) en el Plan de Beneficios de <strong>EPS PETFELIZ</strong> con la siguiente información:
        </div>

        <!-- ── TABLA DE DATOS CLAVE / VALOR ── -->
        <table class="kv-table">
            <tr>
                <td class="kv-label">TIPO Y NÚMERO DE IDENTIFICACIÓN</td>
                <td class="kv-value">CC {{ $cliente_doc }}</td>
            </tr>
            <tr>
                <td class="kv-label">NOMBRES Y APELLIDOS DEL TITULAR</td>
                <td class="kv-value">{{ $cliente_nombre }}</td>
            </tr>
            <tr>
                <td class="kv-label">CÓDIGO DE AFILIADO</td>
                <td class="kv-value text-accent">{{ $codigo_afiliado ?? ('EPS-PET-' . str_pad($cliente->id_cliente ?? 1, 5, '0', STR_PAD_LEFT)) }}</td>
            </tr>
            <tr>
                <td class="kv-label">TIPO DE AFILIADO / ROL</td>
                <td class="kv-value">TITULAR RESPONSABLE</td>
            </tr>
            <tr>
                <td class="kv-label">ESTADO DE LA AFILIACIÓN</td>
                <td class="kv-value">
                    @if($es_afiliado ?? true)
                        <span class="status-active">TIENE DERECHO A COBERTURA INTEGRAL ACTIVA</span>
                    @else
                        <span class="status-inactive">SIN COBERTURA ACTIVA / PACIENTE PARTICULAR</span>
                    @endif
                </td>
            </tr>
            <tr>
                <td class="kv-label">CAUSA ESTADO DE LA AFILIACIÓN</td>
                <td class="kv-value">PLAN INTEGRAL VETERINARIO MASCOTA</td>
            </tr>
            <tr>
                <td class="kv-label">FECHA DE REGISTRO EN EPS PETFELIZ</td>
                <td class="kv-value">{{ $fecha_ingreso ?? date('d/m/Y') }}</td>
            </tr>
            <tr>
                <td class="kv-label">DATOS DE CONTACTO Y UBICACIÓN</td>
                <td class="kv-value">TEL: {{ $telefono ?? 'N/A' }} • {{ $direccion ?? 'N/A' }} ({{ $ciudad ?? 'MEDELLÍN' }} - {{ $departamento ?? 'ANTIOQUIA' }})</td>
            </tr>
            <tr>
                <td class="kv-label">CONTACTO DE EMERGENCIA</td>
                <td class="kv-value">{{ $contacto_emergencia_nombre ?? 'NO REGISTRADO' }} • TEL: {{ $contacto_emergencia_telefono ?? 'N/A' }}</td>
            </tr>
        </table>

        <!-- ── MASCOTAS BENEFICIARIAS ── -->
        <div class="sub-section-title">MASCOTAS BENEFICIARIAS / PACIENTES ASEGURADOS</div>
        <table class="pets-table">
            <thead>
                <tr>
                    <th style="width: 25%;">NOMBRE PACIENTE</th>
                    <th style="width: 35%;">ESPECIE / RAZA</th>
                    <th style="width: 15%;">SEXO</th>
                    <th style="width: 25%;">CÓDIGO CHIP REGISTRO</th>
                </tr>
            </thead>
            <tbody>
                @forelse($mascotas as $m)
                    <tr>
                        <td><strong>{{ $m['nombre'] }}</strong></td>
                        <td>{{ $m['especie'] }} — {{ $m['raza'] }}</td>
                        <td>{{ $m['sexo'] }}</td>
                        <td><span class="chip-code">{{ $m['chip'] }}</span></td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" style="text-align: center; color: #64748b;">No existen mascotas beneficiarias registradas en esta afiliación.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <!-- ── URGENCIAS 24/7 ── -->
        <div class="sub-section-title">LÍNEAS DIRECTAS DE URGENCIAS VETERINARIAS 24/7</div>
        <table class="urgencies-table">
            <tr>
                <td>
                    <div class="urgency-sede">SEDE LAURELES</div>
                    <div class="urgency-phone">(604) 444-7389</div>
                    <div class="urgency-tag">Urgencias 24 Horas</div>
                </td>
                <td style="border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">
                    <div class="urgency-sede">SEDE ITAGÜÍ</div>
                    <div class="urgency-phone">(604) 372-9100</div>
                    <div class="urgency-tag">Urgencias 24 Horas</div>
                </td>
                <td>
                    <div class="urgency-sede">SEDE BELLO</div>
                    <div class="urgency-phone">(604) 480-2211</div>
                    <div class="urgency-tag">Atención Médica General</div>
                </td>
            </tr>
        </table>

        <!-- ── PIE DE PÁGINA ── -->
        <div class="cert-footer">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td>
                        <div style="font-weight: bold; color: #334155; font-size: 8.5px;">DIRECCIÓN DE AFILIACIONES Y AUDITORÍA MÉDICA VETERINARIA</div>
                        <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Fecha de generación: <strong>{{ $fecha_generacion ?? date('d/m/Y') }}</strong></div>
                    </td>
                    <td style="text-align: right; vertical-align: bottom;">
                        <div style="font-size: 8.5px; color: #166534; font-weight: bold;">EPS PetFeliz S.A.S. • Amor a un click</div>
                    </td>
                </tr>
            </table>

            <div class="cert-legal-notice">
                ESTE DOCUMENTO CERTIFICA LA AFILIACIÓN VIGENTE ANTE EPS PETFELIZ S.A.S. Y LA COBERTURA DE SUS PACIENTES REGISTRADOS
            </div>
        </div>
    </div>

</body>
</html>
