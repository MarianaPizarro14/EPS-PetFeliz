<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NuevaFacturaMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $cliente;
    public $facturaData;
    public $downloadUrl;

    public function __construct($cliente, array $facturaData)
    {
        $this->cliente = $cliente;
        $this->facturaData = $facturaData;
        $idPago = $facturaData['id_pago'] ?? 1;
        $this->downloadUrl = config('app.url', 'http://localhost:8000') . "/api/cliente/documentos/factura/{$idPago}/pdf";
    }

    public function build()
    {
        $reciboNo = $this->facturaData['referencia'] ?? ('REC-' . time());
        $subjectText = "📄 Comprobante Digital de Atención Emitido [{$reciboNo}] - EPS PetFeliz";

        return $this->subject($subjectText)
                    ->view('emails.nueva-factura');
    }
}
