<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Pago · EPS PetFeliz</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600&display=swap');
    </style>
</head>
<body style="margin:0; padding:0; background-color:#eef2ed; -webkit-text-size-adjust:100%;">

    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
        Confirmación de pago procesado con éxito en EPS PetFeliz para {{ $pagoData['servicio'] ?? 'servicio de salud' }}.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2ed; padding:40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(21,128,61,0.08);">

                    <!-- Encabezado -->
                    <tr>
                        <td style="background-color:#0f5132; padding:36px 40px; text-align:center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
                                <tr>
                                    <td width="60" height="60" style="width:60px; height:60px; background-color:#ffffff; border-radius:50%; text-align:center; vertical-align:middle;">
                                        <span style="font-family:'Poppins', Arial, sans-serif; font-size:22px; font-weight:700; color:#0f5132; line-height:60px;">PF</span>
                                    </td>
                                </tr>
                            </table>
                            <div style="font-family:'Poppins', Arial, sans-serif; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:0.3px; margin-top:14px;">
                                EPS PetFeliz
                            </div>
                            <div style="font-family:'Inter', Arial, sans-serif; font-size:12px; color:#bfe3cf; margin-top:4px; text-transform:uppercase; letter-spacing:1.5px;">
                                Comprobante Electrónico de Pago
                            </div>
                        </td>
                    </tr>

                    <!-- Franja decorativa -->
                    <tr>
                        <td style="height:6px; line-height:6px; font-size:0; background-color:#16803d;">&nbsp;</td>
                    </tr>

                    <!-- Cuerpo -->
                    <tr>
                        <td style="padding:36px 40px 16px 40px; font-family:'Inter', Arial, sans-serif;">
                            <h1 style="margin:0 0 16px 0; font-family:'Poppins', Arial, sans-serif; font-size:20px; font-weight:700; color:#0f2419;">
                                ✅ ¡Pago Procesado Exitosamente!
                            </h1>
                            <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#3f4b45;">
                                Hola <strong>{{ $cliente->nombre ?? 'Estimado(a) Afiliado(a)' }}</strong>, hemos recibido y verificado tu pago correctamente.
                            </p>

                            <!-- Tarjeta de Resumen de Pago -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:24px;">
                                <tr>
                                    <td style="font-family:'Inter', Arial, sans-serif; font-size:14px; color:#334155; line-height:1.8;">
                                        <p style="margin:0 0 6px 0;"><strong>🔖 Referencia:</strong> <span style="font-family:monospace; color:#166534; font-weight:bold;">{{ $pagoData['referencia'] ?? 'TX-PETFELIZ' }}</span></p>
                                        <p style="margin:0 0 6px 0;"><strong>💵 Monto Pagado:</strong> <strong style="color:#0f172a; font-size:16px;">${{ number_format($pagoData['monto'] ?? 0, 0, ',', '.') }} COP</strong></p>
                                        <p style="margin:0 0 6px 0;"><strong>🩺 Concepto / Servicio:</strong> {{ $pagoData['servicio'] ?? 'Consulta Veterinaria / Plan EPS' }}</p>
                                        <p style="margin:0 0 6px 0;"><strong>💳 Método de Pago:</strong> {{ $pagoData['metodo'] ?? 'Tarjeta de Crédito / PSE' }}</p>
                                        <p style="margin:0;"><strong>📅 Fecha y Hora:</strong> {{ date('d/m/Y h:i A') }}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Botón CTA -->
                    <tr>
                        <td align="center" style="padding:0 40px 32px 40px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="border-radius:8px; background-color:#15803d;">
                                        <a href="{{ $appUrl }}" target="_blank" style="display:inline-block; min-width:240px; padding:16px 32px; font-family:'Poppins', Arial, sans-serif; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px; line-height:1.2; text-align:center;">
                                            Ver Historial de Pagos →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Pie de página -->
                    <tr>
                        <td style="padding:20px 40px 32px 40px; font-family:'Inter', Arial, sans-serif; text-align:center; font-size:12px; color:#94a3b8; border-top:1px solid #e5e9e6;">
                            © {{ date('Y') }} EPS PetFeliz S.A.S. · Amor a un click<br>
                            Este es un comprobante automático enviado a tu correo registrado.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
