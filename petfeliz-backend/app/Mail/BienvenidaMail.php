<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BienvenidaMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $cliente;
    public $appUrl;

    public function __construct($cliente)
    {
        $this->cliente = $cliente;
        $this->appUrl = config('app.frontend_url', 'http://localhost:5173') . '/cliente/dashboard';
    }

    public function build()
    {
        return $this->subject('¡Te damos la bienvenida a EPS PetFeliz! 🐾')
                    ->view('emails.bienvenida');
    }
}
