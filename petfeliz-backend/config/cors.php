<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://www.epspetfeliz.site',
        'https://epspetfeliz.site',
        env('FRONTEND_URL', 'https://www.epspetfeliz.site'),
    ],

    'allowed_origins_patterns' => [
        '#^https://(www\.)?epspetfeliz\.site$#',
        '#^https://.*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];