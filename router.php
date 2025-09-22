<?php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

// Serve the requested resource as-is if it exists.
$assetPath = __DIR__ . $uri;
if ($uri !== '/' && file_exists($assetPath)) {
    if (is_file($assetPath)) {
        return false;
    }
    // Allow directory indexes when an index.php exists inside.
    if (is_dir($assetPath) && file_exists($assetPath . '/index.php')) {
        require $assetPath . '/index.php';
        return true;
    }
}

if ($uri !== '/' && pathinfo($uri, PATHINFO_EXTENSION)) {
    http_response_code(404);
    return true;
}

require __DIR__ . '/index.php';
