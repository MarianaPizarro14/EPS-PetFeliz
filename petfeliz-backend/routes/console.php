<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('petfeliz:verificar-afiliaciones-vencidas')->dailyAt('00:05');
Schedule::command('petfeliz:enviar-recordatorios-citas')->dailyAt('08:00');
