<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ConfirmacionPagoMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $cliente;
    public $pagoData;
    public $appUrl;

    public function __construct($cliente, array $pagoData)
    {
        $this->cliente = $cliente;
        $this->pagoData = $pagoData;
        $this->appUrl = config('app.frontend_url', 'http://localhost:5173') . '/cliente/pagos';
    }

    public function build()
    {
        $referencia = $this->pagoData['referencia'] ?? 'TX-PETFELIZ';
        $subjectText = "✅ Confirmación de Pago Exitoso [{$referencia}] - EPS PetFeliz";

        return $this->subject($subjectText)
                    ->view('emails.confirmacion-pago');
    }
}
