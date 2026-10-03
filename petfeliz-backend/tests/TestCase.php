<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $defaultConn = config('database.default');
        $dbName = (string) config("database.connections.{$defaultConn}.database");

        if (!str_ends_with($dbName, '_test')) {
            throw new \RuntimeException(
                "PROTECCION DE SEGURIDAD ACTIVADA: La ejecucion de pruebas esta estrictamente restringida a bases de datos cuyo nombre termine en '_test' para proteger la integridad de los datos de desarrollo y produccion. Base configurada actualmente: '{$dbName}' (Conexion: {$defaultConn})."
            );
        }
    }
}
