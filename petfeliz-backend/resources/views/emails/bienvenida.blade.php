<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a EPS PetFeliz</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      color: #334155;
    }
    .email-container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }
    .email-header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .email-body {
      padding: 32px 24px;
    }
    .welcome-card {
      background: #ecfdf5;
      border-left: 4px solid #059669;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .welcome-card p {
      margin: 0;
      color: #065f46;
      font-weight: 600;
    }
    .btn-action {
      display: inline-block;
      background: #059669;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 10px;
      font-weight: 600;
      margin-top: 16px;
    }
    .email-footer {
      background: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>¡Bienvenido a EPS PetFeliz! 🐾</h1>
    </div>
    <div class="email-body">
      <div class="welcome-card">
        <p>Hola {{ $cliente->nombre ?? 'Estimado Cliente' }}, tu cuenta ha sido creada exitosamente.</p>
      </div>
      <p>Estamos muy felices de acompañarte en el cuidado integral de tus mascotas. Con tu cuenta de PetFeliz podrás:</p>
      <ul>
        <li>Agendar citas médicas veterinarias con especialistas en línea.</li>
        <li>Acceder a la historia clínica y carné de vacunación de tus mascotas.</li>
        <li>Generar comprobantes de pago y certificados digitales.</li>
      </ul>
      <div style="text-align: center; margin-top: 30px;">
        <a href="{{ $appUrl }}" class="btn-action">Ir a mi Panel de Cliente</a>
      </div>
    </div>
    <div class="email-footer">
      <p>EPS PetFeliz — Cuidando la salud de quienes más amas ❤️</p>
      <p>Si no realizaste este registro, por favor ignora este correo.</p>
    </div>
  </div>
</body>
</html>
