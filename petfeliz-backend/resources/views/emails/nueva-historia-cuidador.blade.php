<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva historia de cuidador · EPS PetFeliz</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600&display=swap');
    </style>
</head>
<body style="margin:0; padding:0; background-color:#eef2ed; -webkit-text-size-adjust:100%;">

    <!-- Preheader (texto de vista previa oculto) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
        Nueva historia enviada por {{ $historia->nombre_cuidador }} para su revisión.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2ed; padding:40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(21,128,61,0.08);">

                    <!-- Encabezado -->
                    <tr>
                        <td style="background-color:#0f5132; padding:36px 40px; text-align:center;">
                            <!--[if !mso]><!-->
                            <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                                <tr>
                                    <td width="60" height="60" style="width:60px; height:60px; background-color:#ffffff; border-radius:50%; text-align:center; vertical-align:middle;">
                                        <span style="font-family:'Poppins', Arial, sans-serif; font-size:22px; font-weight:700; color:#0f5132; line-height:60px;">PF</span>
                                    </td>
                                </tr>
                            </table>
                            <!--<![endif]-->
                            <div style="font-family:'Poppins', Arial, sans-serif; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:0.3px; margin-top:14px;">
                                EPS PetFeliz
                            </div>
                            <div style="font-family:'Inter', Arial, sans-serif; font-size:12px; color:#bfe3cf; margin-top:4px; text-transform:uppercase; letter-spacing:1.5px;">
                                Panel Editorial & Notificaciones
                            </div>
                        </td>
                    </tr>

                    <!-- Franja decorativa de atención -->
                    <tr>
                        <td style="height:6px; line-height:6px; font-size:0; background-color:#006780;">&nbsp;</td>
                    </tr>

                    <!-- Cuerpo -->
                    <tr>
                        <td style="padding:36px 40px 16px 40px; font-family:'Inter', Arial, sans-serif;">
                            <h1 style="margin:0 0 16px 0; font-family:'Poppins', Arial, sans-serif; font-size:20px; font-weight:700; color:#0f2419;">
                                🐾 Nueva historia pendiente de revisión
                            </h1>
                            <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#3f4b45;">
                                Se ha registrado un nuevo testimonio en el portal de <strong>EPS PetFeliz</strong> que requiere la revisión del equipo editorial antes de ser publicado.
                            </p>

                            <!-- Tarjeta con resumen de la historia -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:24px;">
                                <tr>
                                    <td style="font-family:'Inter', Arial, sans-serif; font-size:14px; color:#334155; line-height:1.7;">
                                        <p style="margin:0 0 8px 0;"><strong>👤 Cuidador:</strong> {{ $historia->nombre_cuidador }}</p>
                                        <p style="margin:0 0 8px 0;"><strong>🐶 Mascota:</strong> {{ $historia->nombre_mascota }}</p>
                                        <p style="margin:0 0 8px 0;"><strong>🏷️ Categoría:</strong> {{ $historia->categoria }}</p>
                                        <p style="margin:0 0 12px 0;"><strong>📅 Fecha de envío:</strong> {{ $fechaEnvio }}</p>
                                        <div style="border-top:1px dashed #cbd5e1; padding-top:12px; margin-top:8px;">
                                            <strong style="color:#0f5132; display:block; margin-bottom:6px;">💬 Extracto del testimonio:</strong>
                                            <em style="color:#475569; display:block; background:#ffffff; padding:12px; border-radius:8px; border-left:3px solid #006780;">
                                                "{{ $extracto }}"
                                            </em>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Botón CTA al Panel de Administración -->
                    <tr>
                        <td align="center" style="padding:0 40px 24px 40px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="border-radius:8px; background-color:#15803d;">
                                        <a href="{{ $adminUrl }}" target="_blank" style="display:inline-block; min-width:240px; padding:16px 32px; font-family:'Poppins', Arial, sans-serif; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px; line-height:1.2; text-align:center;">
                                            Revisar historia en el Panel Admin →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Enlace directo alternativo -->
                    <tr>
                        <td style="padding:0 40px 24px 40px; font-family:'Inter', Arial, sans-serif;">
                            <p style="margin:0; font-size:12px; line-height:1.5; color:#64748b; text-align:center;">
                                Si el botón no abre directamente, usa este enlace:<br>
                                <a href="{{ $adminUrl }}" style="color:#15803d; word-break:break-all;">{{ $adminUrl }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Divisor -->
                    <tr>
                        <td style="padding:0 40px;">
                            <hr style="border:none; border-top:1px solid #e5e9e6; margin:0;">
                        </td>
                    </tr>

                    <!-- Pie de página -->
                    <tr>
                        <td style="padding:20px 40px 32px 40px; font-family:'Inter', Arial, sans-serif; text-align:center; font-size:12px; color:#94a3b8;">
                            © {{ date('Y') }} EPS PetFeliz · Notificación del Sistema<br>
                            Este es un correo automático enviado al equipo editorial.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
