<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Nuevo mensaje de contacto · EPS PetFeliz</title>
</head>
<body style="margin:0; padding:0; background-color:#eef2ed; font-family:'Inter', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2ed; padding:40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
                    <!-- Encabezado -->
                    <tr>
                        <td style="background-color:#0f5132; padding:36px 40px; text-align:center;">
                            <div style="font-family:'Poppins', Arial, sans-serif; font-size:22px; font-weight:700; color:#ffffff;">
                                EPS PetFeliz
                            </div>
                            <div style="font-size:12px; color:#bfe3cf; text-transform:uppercase; letter-spacing:1px; margin-top:4px;">
                                Formulario de Contacto Web
                            </div>
                        </td>
                    </tr>

                    <!-- Contenido Principal -->
                    <tr>
                        <td style="padding:36px 40px 16px 40px;">
                            <h1 style="margin:0 0 16px 0; font-family:'Poppins', Arial, sans-serif; font-size:20px; font-weight:700; color:#0f2419;">
                                📩 Has recibido un nuevo mensaje
                            </h1>
                            <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#3f4b45;">
                                Se ha recibido una nueva solicitud de contacto a través del portal web de EPS PetFeliz.
                            </p>

                            <!-- Tarjeta de Datos -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:24px;">
                                <tr>
                                    <td style="font-size:14px; color:#334155; line-height:1.7;">
                                        <p style="margin:0 0 8px 0;"><strong>👤 Remitente:</strong> {{ $nombre }}</p>
                                        <p style="margin:0 0 8px 0;"><strong>✉️ Correo:</strong> <a href="mailto:{{ $correo }}" style="color:#006780; text-decoration:none; font-weight:600;">{{ $correo }}</a></p>
                                        <p style="margin:0 0 8px 0;"><strong>🏷️ Asunto:</strong> <span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:6px; font-weight:600; text-transform:capitalize;">{{ $asunto }}</span></p>
                                        <p style="margin:0 0 12px 0;"><strong>📅 Fecha:</strong> {{ $fecha }}</p>
                                        
                                        <div style="border-top:1px dashed #cbd5e1; padding-top:14px; margin-top:10px;">
                                            <strong style="color:#0f5132; display:block; margin-bottom:6px;">💬 Mensaje enviado:</strong>
                                            <div style="background:#ffffff; padding:14px; border-radius:8px; border-left:4px solid #15803d; color:#1e293b; font-style:normal; white-space:pre-wrap; line-height:1.6;">{{ $mensaje }}</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Pie de Página -->
                    <tr>
                        <td style="padding:20px 40px 32px 40px; text-align:center; font-size:12px; color:#94a3b8; border-top:1px solid #f1f5f9;">
                            © 2026 EPS PetFeliz · Correo Automático de Contacto
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
