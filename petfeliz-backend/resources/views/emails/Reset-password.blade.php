<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer contraseña · PetFeliz</title>
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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500&display=swap');
    </style>
</head>
<body style="margin:0; padding:0; background-color:#eef2ed; -webkit-text-size-adjust:100%;">

    <!-- Preheader (texto de vista previa, oculto) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
        Restablece tu contraseña de PetFeliz. Este enlace vence en 60 minutos.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2ed; padding:40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(21,128,61,0.08);">

                    <!-- Encabezado (monograma con CSS, no depende de ninguna imagen externa) -->
                    <tr>
                        <td style="background-color:#0f5132; padding:36px 40px; text-align:center;">
                            <!--[if mso]>
                            <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td style="width:60px;height:60px;background-color:#ffffff;border-radius:50%;" align="center" valign="middle">
                            <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#0f5132;">PF</span>
                            </td></tr></table>
                            <![endif]-->
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
                                PetFeliz
                            </div>
                            <div style="font-family:'Inter', Arial, sans-serif; font-size:12px; color:#bfe3cf; margin-top:4px; text-transform:uppercase; letter-spacing:1.5px;">
                                Salud y bienestar para tu mascota
                            </div>
                        </td>
                    </tr>

                    <!-- Franja decorativa (reemplaza a la foto; no depende de ningún archivo externo) -->
                    <tr>
                        <td style="height:6px; line-height:6px; font-size:0; background-color:#ffbf69;">&nbsp;</td>
                    </tr>

                    <!-- Cuerpo -->
                    <tr>
                        <td style="padding:40px 40px 8px 40px; font-family:'Inter', Arial, sans-serif;">
                            <h1 style="margin:0 0 16px 0; font-family:'Poppins', Arial, sans-serif; font-size:20px; font-weight:700; color:#0f2419;">
                                Solicitud de restablecimiento de contraseña
                            </h1>
                            <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#3f4b45;">
                                Hola, recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>PetFeliz</strong>. Si fuiste tú, haz clic en el botón para crear una nueva contraseña.
                            </p>
                        </td>
                    </tr>

                    <!-- Botón CTA (versión "bulletproof": VML para Outlook + tabla para el resto, área táctil ampliada para móvil) -->
                    <tr>
                        <td align="center" style="padding:16px 40px 8px 40px;">
                            <!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ $resetLink }}" style="height:52px;v-text-anchor:middle;width:260px;" arcsize="15%" strokecolor="#15803d" fillcolor="#15803d">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Restablecer contraseña</center>
                            </v:roundrect>
                            <![endif]-->
                            <!--[if !mso]><!-->
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="border-radius:8px; background-color:#15803d;">
                                        <a href="{{ $resetLink }}" target="_blank" style="display:inline-block; min-width:220px; padding:16px 32px; font-family:'Poppins', Arial, sans-serif; font-size:16px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px; line-height:1.2;">
                                            Restablecer contraseña
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <!--<![endif]-->
                        </td>
                    </tr>

                    <!-- Enlace alternativo -->
                    <tr>
                        <td style="padding:16px 40px 0 40px; font-family:'Inter', Arial, sans-serif;">
                            <p style="margin:0; font-size:13px; line-height:1.6; color:#8b978e;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                                <a href="{{ $resetLink }}" style="color:#15803d; word-break:break-all;">{{ $resetLink }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Divisor -->
                    <tr>
                        <td style="padding:28px 40px 0 40px;">
                            <hr style="border:none; border-top:1px solid #e5e9e6; margin:0;">
                        </td>
                    </tr>

                    <!-- Aviso de seguridad -->
                    <tr>
                        <td style="padding:20px 40px 36px 40px; font-family:'Inter', Arial, sans-serif;">
                            <p style="margin:0; font-size:13px; line-height:1.6; color:#8b978e;">
                                Este enlace expira en <strong>60 minutos</strong> por tu seguridad. Si tú no solicitaste este cambio, puedes ignorar este correo; tu contraseña actual seguirá siendo válida.
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Pie de página -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; margin-top:24px;">
                    <tr>
                        <td align="center" style="font-family:'Inter', Arial, sans-serif; font-size:12px; color:#9aa39d; padding:0 20px;">
                            © {{ date('Y') }} PetFeliz · Medellín, Colombia<br>
                            Este es un correo automático, por favor no respondas a esta dirección.
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>