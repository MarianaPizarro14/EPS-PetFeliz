<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactoMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $nombre;
    public string $correo;
    public string $asunto;
    public string $mensaje;
    public string $fecha;

    public function __construct(string $nombre, string $correo, string $asunto, string $mensaje)
    {
        $this->nombre  = $nombre;
        $this->correo  = $correo;
        $this->asunto  = $asunto;
        $this->mensaje = $mensaje;
        $this->fecha   = date('d/m/Y H:i A');
    }

    public function build()
    {
        $subjectText = 'Nuevo mensaje de contacto [' . ucfirst($this->asunto) . '] - EPS PetFeliz';

        return $this->subject($subjectText)
                    ->replyTo($this->correo, $this->nombre)
                    ->view('emails.contacto');
    }
}
