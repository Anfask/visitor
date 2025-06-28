<?php
// api/index.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../config/cors.php';

// Get request method and endpoint
$method = $_SERVER['REQUEST_METHOD'];
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));

// Remove 'api' from segments if present
if ($segments[0] === 'api') {
    array_shift($segments);
}

$endpoint = $segments[0] ?? '';

try {
    switch ($endpoint) {
        case 'checkin':
            if ($method === 'POST') {
                require_once '../endpoints/checkin.php';
            }
            break;
            
        case 'checkout':
            if ($method === 'POST') {
                require_once '../endpoints/checkout.php';
            }
            break;
            
        case 'visitors':
            if ($method === 'GET') {
                require_once '../endpoints/get_visitors.php';
            }
            break;
            
        case 'visitor':
            if ($method === 'GET' && isset($segments[1])) {
                $_GET['id'] = $segments[1];
                require_once '../endpoints/get_visitor.php';
            }
            break;
            
        case 'auth':
            if ($method === 'POST') {
                require_once '../endpoints/auth.php';
            }
            break;
            
        case 'save-image':
            if ($method === 'POST') {
                require_once '../endpoints/save_image.php';
            }
            break;
            
        case 'search':
            if ($method === 'GET') {
                require_once '../endpoints/search_visitor.php';
            }
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
?>