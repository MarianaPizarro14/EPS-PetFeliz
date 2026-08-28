<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RecordatorioCitaMail extends Mailable
{
    use Queueable, SerializesModels;

    public $cliente;
    public $citaData;
    public $appUrl;

    public function __construct($cliente, array $citaData)
    {
        $this->cliente = $cliente;
        $this->citaData = $citaData;
        $this->appUrl = config('app.frontend_url', 'http://localhost:5173') . '/cliente/citas';
    }

    public function build()
    {
        $mascotaNombre = $this->citaData['mascota'] ?? 'tu mascota';
        $subjectText = "⏰ Recordatorio: Mañana tienes una cita médica para {$mascotaNombre} - EPS PetFeliz";

        return $this->subject($subjectText)
                    ->view('emails.recordatorio-cita');
    }
}
