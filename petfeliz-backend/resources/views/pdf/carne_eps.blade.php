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
            padding: 15px;
            font-size: 11px;
            background-color: #ffffff;
        }

        .card-container {
            width: 530px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            border-radius: 16px;
            background-color: #fafdfb;
            overflow: hidden;
        }

        /* ── HEADER ── */
        .card-header {
            padding: 16px 20px 12px 20px;
            background-color: #ffffff;
            border-bottom: 1px solid #e2e8f0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .brand-logo-text {
            font-size: 22px;
            font-weight: bold;
            line-height: 1.1;
        }

        .brand-eps { color: #0284c7; }
        .brand-pet { color: #16a34a; }
        .brand-feliz { color: #eab308; }

        .brand-sub {
            font-size: 8.5px;
            color: #64748b;
            font-weight: bold;
            margin-top: 4px;
            letter-spacing: 0.3px;
        }

        .affiliate-badge {
            background-color: #0284c7;
            color: #ffffff;
            border-radius: 10px;
            padding: 6px 10px;
            text-align: center;
            white-space: nowrap;
            width: 150px;
            display: inline-block;
        }

        .affiliate-label {
            font-size: 8px;
            color: #e0f2fe;
            font-weight: bold;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }

        .affiliate-code {
            font-size: 12px;
            font-weight: bold;
            color: #ffffff;
            margin-top: 2px;
            letter-spacing: 0px;
            white-space: nowrap;
        }

        /* ── BODY ── */
        .card-body {
            padding: 16px 20px;
        }

        /* ── SECCIONES ── */
        .section-header {
            margin-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
        }

        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: 0.4px;
        }

        /* ── TITULAR & PLAN ── */
        .titular-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        .titular-table td {
            vertical-align: top;
            width: 50%;
        }

        .field-label {
            font-size: 8.5px;
            color: #0284c7;
            font-weight: bold;
            letter-spacing: 0.4px;
            margin-bottom: 4px;
        }

        .titular-name {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 4px;
        }

        .titular-doc {
            font-size: 9.5px;
            color: #475569;
        }

        .status-pill {
            display: inline-block;
            background-color: #f0fdf4;
            color: #16a34a;
            border: 1px solid #bbf7d0;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 9.5px;
            font-weight: bold;
            margin-bottom: 4px;
        }

        .plan-subtext {
            font-size: 9px;
            color: #475569;
        }

        /* ── MASCOTAS ── */
        .pet-card {
            border-radius: 12px;
            padding: 10px 14px;
            margin-bottom: 10px;
            border: 1px solid #e2e8f0;
        }

        .pet-card-blue {
            background-color: #f0f9ff;
            border-color: #bae6fd;
        }
        .pet-card-amber {
            background-color: #fefce8;
            border-color: #fef08a;
        }
        .pet-card-green {
            background-color: #f0fdf4;
            border-color: #bbf7d0;
        }

        .pet-table {
            width: 100%;
            border-collapse: collapse;
        }

        .pet-badge-cell {
            width: 32px;
            vertical-align: middle;
        }

        .pet-badge {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            text-align: center;
            vertical-align: middle;
        }

        .pet-badge-blue { background-color: #0284c7; }
        .pet-badge-amber { background-color: #eab308; }
        .pet-badge-green { background-color: #16a34a; }

        .pet-name {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 2px;
        }

        .pet-meta {
            font-size: 9.5px;
            color: #334155;
            margin-bottom: 3px;
        }

        .pet-chip {
            font-size: 9px;
            color: #16a34a;
            font-weight: bold;
        }

        .no-pets {
            text-align: center;
            padding: 14px;
            background-color: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 10px;
            color: #64748b;
            font-size: 10px;
            margin-bottom: 12px;
        }

        /* ── EMERGENCIAS ── */
        .emergency-box {
            background-color: #fefce8;
            border: 1px solid #fde047;
            border-radius: 12px;
            padding: 10px 14px;
            margin-top: 14px;
        }

        .emergency-title {
            text-align: center;
            font-size: 10.5px;
            font-weight: bold;
            color: #854d0e;
            letter-spacing: 0.5px;
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
            font-size: 8.5px;
            font-weight: bold;
            color: #713f12;
            margin-bottom: 2px;
        }

        .emergency-phone {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
        }

        .emergency-tag {
            font-size: 7.5px;
            color: #ca8a04;
            font-weight: bold;
        }

        /* ── FOOTER BANNER ── */
        .card-footer {
            background-color: #16a34a;
            color: #ffffff;
            padding: 8px 16px;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-text {
            font-size: 8.5px;
            color: #ffffff;
        }

        .footer-cta {
            font-size: 9.5px;
            font-weight: bold;
            text-align: right;
            color: #ffffff;
        }
    </style>
</head>
<body>

    <div class="card-container">
        <!-- ── ENCABEZADO OFICIAL ── -->
        <div class="card-header">
            <table class="header-table">
                <tr>
                    <td style="vertical-align: middle;">
                        <table style="border-collapse: collapse;">
                            <tr>
                                <td style="vertical-align: middle; padding-right: 8px;">
                                    <img src="{{ public_path('img/paw-icon.svg') }}" width="28" height="28" alt="Paw">
                                </td>
                                <td style="vertical-align: middle;">
                                    <div class="brand-logo-text">
                                        <span class="brand-eps">EPS</span>
                                        <span class="brand-pet">Pet</span><span class="brand-feliz">Feliz</span>
                                    </div>
                                    <div class="brand-sub">CARNET DIGITAL DE AFILIACIÓN Y SALUD VETERINARIA</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td style="width: 175px; text-align: right; vertical-align: middle;">
                        <div class="affiliate-badge">
                            <div class="affiliate-label">CÓDIGO AFILIADO</div>
                            <div class="affiliate-code">EPS-PET-{{ str_pad($cliente->id_cliente ?? 1, 5, '0', STR_PAD_LEFT) }}</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- ── CUERPO DEL CARNET ── -->
        <div class="card-body">
            
            <!-- ── SECCIÓN 1: TITULAR Y ESTADO ── -->
            <div class="section-header">
                <div class="section-title">
                    <img src="{{ public_path('img/paw-icon.svg') }}" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;" alt="Icon">
                    TITULAR RESPONSABLE Y ESTADO DEL PLAN
                </div>
            </div>

            <table class="titular-table">
                <tr>
                    <td>
                        <div class="field-label">TITULAR AFILIADO</div>
                        <div class="titular-name">{{ $cliente_nombre }}</div>
                        <div class="titular-doc">DOCUMENTO: {{ $cliente_doc }}</div>
                    </td>
                    <td>
                        <div class="field-label">ESTADO DE COBERTURA</div>
                        <div class="status-pill">COBERTURA EPS ACTIVA</div>
                        <div class="plan-subtext">Plan Integral Mascota</div>
                    </td>
                </tr>
            </table>

            <!-- ── SECCIÓN 2: MASCOTAS BENEFICIARIAS ── -->
            <div class="section-header">
                <div class="section-title">
                    <img src="{{ public_path('img/paw-icon.svg') }}" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;" alt="Icon">
                    MASCOTAS ASEGURADAS / BENEFICIARIAS
                </div>
            </div>

            @php
                $colorThemes = [
                    ['card' => 'pet-card-blue', 'badge' => 'pet-badge-blue'],
                    ['card' => 'pet-card-amber', 'badge' => 'pet-badge-amber'],
                    ['card' => 'pet-card-green', 'badge' => 'pet-badge-green'],
                ];
            @endphp

            @forelse($mascotas as $index => $mascota)
                @php
                    $theme = $colorThemes[$index % 3];
                    $nombreMascota = is_array($mascota) ? ($mascota['nombre'] ?? 'Mascota') : ($mascota->nombre ?? 'Mascota');
                    $especieMascota = is_array($mascota) ? ($mascota['especie'] ?? 'S/D') : ($mascota->especie ?? 'S/D');
                    $razaMascota = is_array($mascota) ? ($mascota['raza'] ?? 'Criollo / Mestizo') : ($mascota->raza ?? 'Criollo / Mestizo');
                    $sexoMascota = is_array($mascota) ? ($mascota['sexo'] ?? 'Macho') : ($mascota->sexo ?? 'Macho');
                    $chipMascota = is_array($mascota) ? ($mascota['chip'] ?? ('CHIP-PET-' . ($mascota['id'] ?? ($index + 1)))) : ('CHIP-PET-' . ($mascota->id_mascota ?? ($index + 1)));
                @endphp

                <div class="pet-card {{ $theme['card'] }}">
                    <table class="pet-table">
                        <tr>
                            <td class="pet-badge-cell">
                                <div class="pet-badge {{ $theme['badge'] }}">
                                    <img src="{{ public_path('img/paw-icon-white.svg') }}" width="14" height="14" style="vertical-align: middle; margin-top: 5px;" alt="Paw">
                                </div>
                            </td>
                            <td style="vertical-align: middle; padding-left: 6px;">
                                <div class="pet-name">PACIENTE: {{ mb_strtoupper($nombreMascota, 'UTF-8') }}</div>
                                <div class="pet-meta">
                                    Especie: {{ mb_strtoupper($especieMascota, 'UTF-8') }} • Raza: {{ mb_strtoupper($razaMascota, 'UTF-8') }} • Sexo: {{ mb_strtoupper($sexoMascota, 'UTF-8') }}
                                </div>
                                <div class="pet-chip">ID Registro Chip: {{ $chipMascota }}</div>
                            </td>
                        </tr>
                    </table>
                </div>
            @empty
                <div class="no-pets">
                    No existen mascotas beneficiarias registradas bajo esta afiliación.
                </div>
            @endforelse

            <!-- ── SECCIÓN 3: EMERGENCIAS Y URGENCIAS (3 SEDES) ── -->
            <div class="emergency-box">
                <div class="emergency-title">URGENCIAS VETERINARIAS 24/7</div>
                <table class="emergency-table">
                    <tr>
                        <td style="width: 33%;">
                            <div class="emergency-sede">SEDE LAURELES</div>
                            <div class="emergency-phone">(604) 444-7389</div>
                            <div class="emergency-tag">Urgencias 24/7</div>
                        </td>
                        <td style="width: 34%; border-left: 1px solid #fde047; border-right: 1px solid #fde047;">
                            <div class="emergency-sede">SEDE ITAGÜÍ</div>
                            <div class="emergency-phone">(604) 372-9100</div>
                            <div class="emergency-tag">Urgencias 24/7</div>
                        </td>
                        <td style="width: 33%;">
                            <div class="emergency-sede">SEDE BELLO</div>
                            <div class="emergency-phone">(604) 480-2211</div>
                            <div class="emergency-tag">Atención General</div>
                        </td>
                    </tr>
                </table>
            </div>

        </div>

        <!-- ── PIE DE PÁGINA BANNER ── -->
        <div class="card-footer">
            <table class="footer-table">
                <tr>
                    <td class="footer-text">
                        Presente este carnet digital en la red de clínicas veterinarias aliadas de EPS PetFeliz S.A.S.
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
