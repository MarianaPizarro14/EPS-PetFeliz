<?php

namespace App\Services;

use Cloudinary\Cloudinary;

class CloudinaryService
{
    /**
     * Instancia la clase oficial de Cloudinary con soporte para CLOUDINARY_URL o las 3 variables de entorno separadas.
     */
    protected static function getCloudinaryInstance(): Cloudinary
    {
        $cloudinaryUrl = env('CLOUDINARY_URL');
        
        if (!empty($cloudinaryUrl)) {
            return new Cloudinary($cloudinaryUrl);
        }

        return new Cloudinary([
            'cloud' => [
                'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
                'api_key'    => env('CLOUDINARY_API_KEY'),
                'api_secret' => env('CLOUDINARY_API_SECRET'),
            ],
            'url' => [
                'secure' => true,
            ],
        ]);
    }

    /**
     * Sube un archivo a Cloudinary y devuelve la URL segura (https).
     *
     * @param \Illuminate\Http\UploadedFile|string $file
     * @param string $folder
     * @return string
     */
    public static function upload($file, string $folder = 'uploads'): string
    {
        $cloudinary = static::getCloudinaryInstance();
        $filePath = is_string($file) ? $file : $file->getRealPath();

        $result = $cloudinary->uploadApi()->upload($filePath, [
            'folder' => $folder,
            'resource_type' => 'auto',
        ]);

        return $result['secure_url'] ?? $result['url'];
    }
}
