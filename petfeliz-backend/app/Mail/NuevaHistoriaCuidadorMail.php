<?php

namespace App\Mail;

use App\Models\HistoriaCuidador;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NuevaHistoriaCuidadorMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public HistoriaCuidador $historia;
    public string $adminUrl;
    public string $extracto;
    public string $fechaEnvio;

    public function __construct(HistoriaCuidador $historia)
    {
        $this->historia = $historia;
        
        $frontendUrl = config('app.frontend_url') ?? env('FRONTEND_URL', 'http://localhost:5173');
        $this->adminUrl = rtrim($frontendUrl, '/') . '/admin/historias/' . $historia->id;
        
        $fullText = $historia->historia;
        $this->extracto = mb_substr($fullText, 0, 200) . (mb_strlen($fullText) > 200 ? '...' : '');
        $this->fechaEnvio = $historia->created_at ? $historia->created_at->format('d/m/Y H:i A') : date('d/m/Y H:i A');
    }

    public function build()
    {
        return $this->subject('Nueva historia de cuidador pendiente de revisión - EPS PetFeliz')
                    ->view('emails.nueva-historia-cuidador');
    }
}
