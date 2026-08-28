<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Carnet Digital de Afiliación - EPS PetFeliz</title>
    <style>
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 12px;
            font-size: 11px;
            background-color: #ffffff;
        }

        .card-container {
            width: 530px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            border-radius: 14px;
            background-color: #ffffff;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
        }

        /* ── HEADER INSTITUCIONAL ── */
        .card-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            border-bottom: 3px solid #16a34a;
            color: #ffffff;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .brand-logo-text {
            font-size: 20px;
            font-weight: bold;
            line-height: 1.1;
            color: #ffffff;
        }

        .brand-eps { color: #38bdf8; font-weight: bold; }
        .brand-pet { color: #4ade80; font-weight: bold; }
        .brand-feliz { color: #facc15; font-weight: bold; }

        .brand-sub {
            font-size: 8px;
            color: #94a3b8;
            font-weight: bold;
            margin-top: 3px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .affiliate-badge {
            background-color: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 6px 12px;
            text-align: right;
            display: inline-block;
        }

        .affiliate-label {
            font-size: 7.5px;
            color: #cbd5e1;
            font-weight: bold;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .affiliate-code {
            font-size: 11.5px;
            font-weight: bold;
            color: #ffffff;
            margin-top: 2px;
        }

        /* ── BODY ── */
        .card-body {
            padding: 16px 20px;
            background-color: #fafdfb;
        }

        /* ── SECCIONES ── */
        .section-header {
            margin-bottom: 10px;
            border-bottom: 1.5px solid #e2e8f0;
            padding-bottom: 4px;
        }

        .section-title {
            font-size: 10.5px;
            font-weight: bold;
            color: #166534;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }

        /* ── TITULAR & PLAN ── */
        .titular-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 14px;
        }

        .titular-table td {
            vertical-align: top;
        }

        .field-label {
            font-size: 8px;
            color: #64748b;
            font-weight: bold;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            margin-bottom: 3px;
        }

        .titular-name {
            font-size: 12.5px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 3px;
        }

        .titular-doc {
            font-size: 9.5px;
            color: #475569;
            font-weight: bold;
        }

        .status-pill {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-pill-active {
            background-color: #f0fdf4;
            color: #15803d;
            border: 1px solid #bbf7d0;
        }

        .status-pill-inactive {
            background-color: #fef2f2;
            color: #b91c1c;
            border: 1px solid #fecaca;
        }

        .plan-subtext {
            font-size: 8.5px;
            color: #64748b;
            margin-top: 3px;
        }

        /* ── MASCOTAS UNIFORMES ── */
        .pet-card {
            background-color: #ffffff;
            border: 1px solid #cbd5e1;
            border-left: 4px solid #16a34a;
            border-radius: 8px;
            padding: 9px 12px;
            margin-bottom: 8px;
        }

        .pet-table {
            width: 100%;
            border-collapse: collapse;
        }

        .pet-badge-cell {
            width: 28px;
            vertical-align: middle;
        }

        .pet-badge {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            text-align: center;
            vertical-align: middle;
        }

        .pet-name {
            font-size: 11.5px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 2px;
        }

        .pet-meta {
            font-size: 9px;
            color: #475569;
            margin-bottom: 2px;
        }

        .pet-chip {
            font-size: 8.5px;
            color: #166534;
            font-weight: bold;
        }

        .no-pets {
            text-align: center;
            padding: 12px;
            background-color: #ffffff;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            color: #64748b;
            font-size: 9.5px;
            margin-bottom: 10px;
        }

        /* ── EMERGENCIAS UNIFICADO ── */
        .emergency-box {
            background-color: #0f172a;
            border-radius: 10px;
            padding: 10px 14px;
            margin-top: 12px;
            color: #ffffff;
        }

        .emergency-title {
            text-align: center;
            font-size: 9.5px;
            font-weight: bold;
            color: #4ade80;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        .emergency-table {
            width: 100%;
            border-collapse: collapse;
            text-align: center;
        }

        .emergency-table td {
            vertical-align: top;
            padding: 0 4px;
        }

        .emergency-sede {
            font-size: 8px;
            font-weight: bold;
            color: #94a3b8;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .emergency-phone {
            font-size: 9.5px;
            font-weight: bold;
            color: #ffffff;
        }

        .emergency-tag {
            font-size: 7.5px;
            color: #38bdf8;
            font-weight: bold;
            margin-top: 1px;
        }

        /* ── FOOTER BANNER INSTITUCIONAL ── */
        .card-footer {
            background-color: #166534;
            color: #ffffff;
            padding: 8px 16px;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-text {
            font-size: 8px;
            color: #f0fdf4;
        }

        .footer-cta {
            font-size: 9px;
            font-weight: bold;
            text-align: right;
            color: #ffffff;
        }
    </style>
</head>
<body>

    <div class="card-container">
        <!-- ── ENCABEZADO INSTITUCIONAL ── -->
        <div class="card-header">
            <table class="header-table">
                <tr>
                    <td style="vertical-align: middle;">
                        <table style="border-collapse: collapse;">
                            <tr>
                                <td style="vertical-align: middle; padding-right: 10px;">
                                    <img src="{{ public_path('img/paw-icon-white.svg') }}" width="26" height="26" alt="Huella PetFeliz">
                                </td>
                                <td style="vertical-align: middle;">
                                    <div class="brand-logo-text">
                                        <span class="brand-eps">EPS</span> <span class="brand-pet">Pet</span><span class="brand-feliz">Feliz</span>
                                    </div>
                                    <div class="brand-sub">Carnet Digital de Afiliación y Salud Veterinaria</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td style="width: 180px; text-align: right; vertical-align: middle;">
                        <div class="affiliate-badge">
                            <div class="affiliate-label">Código Afiliado</div>
                            <div class="affiliate-code">EPS-PET-{{ str_pad($cliente->id_cliente ?? 1, 5, '0', STR_PAD_LEFT) }}</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- ── CUERPO DEL CARNET ── -->
        <div class="card-body">
            
            <!-- ── SECCIÓN 1: TITULAR Y ESTADO DE AFILIACIÓN ── -->
            <div class="section-header">
                <div class="section-title">
                    <img src="{{ public_path('img/paw-icon.svg') }}" width="12" height="12" style="vertical-align: -1px; margin-right: 4px;" alt="Icon">
                    Titular Responsable y Cobertura
                </div>
            </div>

            <table class="titular-table">
                <tr>
                    <td style="width: 55%;">
                        <div class="field-label">Titular de la Afiliación</div>
                        <div class="titular-name">{{ $cliente_nombre }}</div>
                        <div class="titular-doc">DOCUMENTO: {{ $cliente_doc }}</div>
                    </td>
                    <td style="width: 45%; text-align: right;">
                        <div class="field-label" style="text-align: right;">Estado de Afiliación</div>
                        @if($es_afiliado ?? true)
                            <div class="status-pill status-pill-active">✓ AFILIADO EPS • ACTIVO</div>
                            <div class="plan-subtext">Plan Integral Mascota</div>
                        @else
                            <div class="status-pill status-pill-inactive">NO AFILIADO • PARTICULAR</div>
                            <div class="plan-subtext">Atención Particular Sin Cobertura</div>
                        @endif
                    </td>
                </tr>
            </table>

            <!-- ── SECCIÓN 2: MASCOTAS BENEFICIARIAS ── -->
            <div class="section-header">
                <div class="section-title">
                    <img src="{{ public_path('img/paw-icon.svg') }}" width="12" height="12" style="vertical-align: -1px; margin-right: 4px;" alt="Icon">
                    Mascotas Aseguradas / Beneficiarias
                </div>
            </div>

            @forelse($mascotas as $index => $mascota)
                @php
                    $nombreMascota = is_array($mascota) ? ($mascota['nombre'] ?? 'Mascota') : ($mascota->nombre ?? 'Mascota');
                    $especieMascota = is_array($mascota) ? ($mascota['especie'] ?? 'S/D') : ($mascota->especie ?? 'S/D');
                    $razaMascota = is_array($mascota) ? ($mascota['raza'] ?? 'Criollo / Mestizo') : ($mascota->raza ?? 'Criollo / Mestizo');
                    $sexoMascota = is_array($mascota) ? ($mascota['sexo'] ?? 'Macho') : ($mascota->sexo ?? 'Macho');
                    $chipMascota = is_array($mascota) ? ($mascota['chip'] ?? ('CHIP-PET-' . ($mascota['id'] ?? ($index + 1)))) : ('CHIP-PET-' . ($mascota->id_mascota ?? ($index + 1)));
                @endphp

                <div class="pet-card">
                    <table class="pet-table">
                        <tr>
                            <td class="pet-badge-cell">
                                <div class="pet-badge">
                                    <img src="{{ public_path('img/paw-icon.svg') }}" width="12" height="12" style="vertical-align: middle; margin-top: 4px;" alt="Paw">
                                </div>
                            </td>
                            <td style="vertical-align: middle; padding-left: 6px;">
                                <div class="pet-name">PACIENTE: {{ mb_strtoupper($nombreMascota, 'UTF-8') }}</div>
                                <div class="pet-meta">
                                    Especie: {{ mb_strtoupper($especieMascota, 'UTF-8') }} • Raza: {{ mb_strtoupper($razaMascota, 'UTF-8') }} • Sexo: {{ mb_strtoupper($sexoMascota, 'UTF-8') }}
                                </div>
                                <div class="pet-chip">Registro ID Chip: {{ $chipMascota }}</div>
                            </td>
                        </tr>
                    </table>
                </div>
            @empty
                <div class="no-pets">
                    No existen mascotas beneficiarias registradas bajo esta afiliación.
                </div>
            @endforelse

            <!-- ── SECCIÓN 3: EMERGENCIAS Y URGENCIAS 24/7 ── -->
            <div class="emergency-box">
                <div class="emergency-title">LÍNEAS DE URGENCIAS VETERINARIAS 24/7</div>
                <table class="emergency-table">
                    <tr>
                        <td style="width: 33%;">
                            <div class="emergency-sede">Sede Laureles</div>
                            <div class="emergency-phone">(604) 444-7389</div>
                            <div class="emergency-tag">Urgencias 24/7</div>
                        </td>
                        <td style="width: 34%; border-left: 1px solid #334155; border-right: 1px solid #334155;">
                            <div class="emergency-sede">Sede Itagüí</div>
                            <div class="emergency-phone">(604) 372-9100</div>
                            <div class="emergency-tag">Urgencias 24/7</div>
                        </td>
                        <td style="width: 33%;">
                            <div class="emergency-sede">Sede Bello</div>
                            <div class="emergency-phone">(604) 480-2211</div>
                            <div class="emergency-tag">Atención General</div>
                        </td>
                    </tr>
                </table>
            </div>

        </div>

        <!-- ── PIE DE PÁGINA BANNER INSTITUCIONAL ── -->
        <div class="card-footer">
            <table class="footer-table">
                <tr>
                    <td class="footer-text">
                        Documento oficial emitido por EPS PetFeliz S.A.S. Presente este carnet digital en clínicas veterinarias aliadas.
                    </td>
                    <td class="footer-cta">
                        Amor a un click
                    </td>
                </tr>
            </table>
        </div>
    </div>

</body>
</html>
