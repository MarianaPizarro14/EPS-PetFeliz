<?php

$corsAllowedEnv = env('CORS_ALLOWED_ORIGINS', env('FRONTEND_URL', 'http://localhost:5173,http://127.0.0.1:5173,https://www.epspetfeliz.site,https://epspetfeliz.site'));
$configuredOrigins = array_filter(array_map('trim', explode(',', $corsAllowedEnv)));

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique(array_merge([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ], $configuredOrigins))),

    'allowed_origins_patterns' => [
        '#^https://.*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];