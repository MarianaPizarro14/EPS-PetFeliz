<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Barryvdh\DomPDF\Facade\Pdf;

$html = '
<!DOCTYPE html>
<html>
<head>
<style>
  .box-gradient {
    width: 500px;
    height: 300px;
    background: #ffffff;
    background: linear-gradient(to bottom, #ffffff 0%, #f0fdf4 100%);
    border: 1px solid #cbd5e1;
    border-radius: 16px;
    padding: 20px;
  }
  .box-solid {
    width: 500px;
    height: 300px;
    background-color: #f8fdf9;
    border: 1px solid #cbd5e1;
    border-radius: 16px;
    padding: 20px;
    margin-top: 20px;
  }
</style>
</head>
<body>
  <div class="box-gradient">Testing Gradient in Dompdf</div>
  <div class="box-solid">Testing Solid Soft Color #f8fdf9 in Dompdf</div>
</body>
</html>
';

$pdf = Pdf::loadHTML($html);
file_put_contents('public/test_gradient.pdf', $pdf->output());
echo "Gradient PDF output size: " . filesize('public/test_gradient.pdf') . " bytes\n";
