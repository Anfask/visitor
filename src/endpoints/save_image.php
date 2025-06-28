<?php
// endpoints/save_image.php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['dataUrl']) || !isset($input['mobile'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: dataUrl and mobile']);
    exit();
}

$dataUrl = $input['dataUrl'];
$mobile = $input['mobile'];

// Validate mobile number
if (!preg_match('/^[0-9]{10}$/', $mobile)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid mobile number format']);
    exit();
}

// Validate base64 image data
if (!preg_match('/^data:image\/(jpeg|jpg|png);base64,/', $dataUrl)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid image format. Only JPEG and PNG are allowed']);
    exit();
}

try {
    // Create img directory if it doesn't exist
    $img_dir = '../img';
    if (!file_exists($img_dir)) {
        if (!mkdir($img_dir, 0755, true)) {
            throw new Exception('Failed to create image directory');
        }
    }
    
    // Extract base64 data
    $image_parts = explode(";base64,", $dataUrl);
    $image_type_aux = explode("image/", $image_parts[0]);
    $image_type = $image_type_aux[1];
    $image_base64 = base64_decode($image_parts[1]);
    
    if ($image_base64 === false) {
        throw new Exception('Failed to decode base64 image');
    }
    
    // Generate unique filename
    $timestamp = date('Y-m-d_H-i-s');
    $filename = $mobile . '_' . $timestamp . '.' . $image_type;
    $file_path = $img_dir . '/' . $filename;
    
    // Save image file
    if (file_put_contents($file_path, $image_base64) === false) {
        throw new Exception('Failed to save image file');
    }
    
    // Create thumbnail (optional)
    $thumbnail_path = $img_dir . '/thumbs';
    if (!file_exists($thumbnail_path)) {
        mkdir($thumbnail_path, 0755, true);
    }
    
    $thumbnail_file = $thumbnail_path . '/thumb_' . $filename;
    createThumbnail($file_path, $thumbnail_file, 150, 150);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'path' => '/img/' . $filename,
        'thumbnail' => '/img/thumbs/thumb_' . $filename,
        'size' => filesize($file_path)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save image: ' . $e->getMessage()]);
}

function createThumbnail($source, $destination, $width, $height) {
    $info = getimagesize($source);
    if ($info === false) return false;
    
    $mime = $info['mime'];
    
    switch ($mime) {
        case 'image/jpeg':
            $image = imagecreatefromjpeg($source);
            break;
        case 'image/png':
            $image = imagecreatefrompng($source);
            break;
        default:
            return false;
    }
    
    $src_width = imagesx($image);
    $src_height = imagesy($image);
    
    // Calculate aspect ratio
    $ratio = min($width / $src_width, $height / $src_height);
    $new_width = intval($src_width * $ratio);
    $new_height = intval($src_height * $ratio);
    
    $thumbnail = imagecreatetruecolor($new_width, $new_height);
    
    // Preserve transparency for PNG
    if ($mime === 'image/png') {
        imagealphablending($thumbnail, false);
        imagesavealpha($thumbnail, true);
        $transparent = imagecolorallocatealpha($thumbnail, 255, 255, 255, 127);
        imagefilledrectangle($thumbnail, 0, 0, $new_width, $new_height, $transparent);
    }
    
    imagecopyresampled($thumbnail, $image, 0, 0, 0, 0, $new_width, $new_height, $src_width, $src_height);
    
    switch ($mime) {
        case 'image/jpeg':
            imagejpeg($thumbnail, $destination, 85);
            break;
        case 'image/png':
            imagepng($thumbnail, $destination, 8);
            break;
    }
    
    imagedestroy($image);
    imagedestroy($thumbnail);
    
    return true;
}
?>