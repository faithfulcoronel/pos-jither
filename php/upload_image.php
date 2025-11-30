<?php
header('Content-Type: application/json');

// Define upload directory
$uploadDir = __DIR__ . '/../images/';

// Ensure upload directory exists
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Check if file was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode([
        'success' => false,
        'message' => 'No file uploaded or upload error occurred.'
    ]);
    exit;
}

$file = $_FILES['image'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$fileType = $file['type'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
    ]);
    exit;
}

// Validate file size (max 5MB)
$maxFileSize = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxFileSize) {
    echo json_encode([
        'success' => false,
        'message' => 'File size exceeds 5MB limit.'
    ]);
    exit;
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
if (empty($extension)) {
    // Fallback to extension based on mime type
    $extensionMap = [
        'image/jpeg' => 'jpg',
        'image/jpg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];
    $extension = $extensionMap[$mimeType] ?? 'jpg';
}

// Create a safe filename
$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
$safeOriginalName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $originalName);
$timestamp = time();
$filename = $safeOriginalName . '_' . $timestamp . '.' . $extension;

$targetPath = $uploadDir . $filename;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'message' => 'File uploaded successfully.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to move uploaded file.'
    ]);
}
