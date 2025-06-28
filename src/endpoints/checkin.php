<?php
// endpoints/checkin.php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required_fields = ['name', 'mobile', 'purpose', 'imageName', 'imageUrl'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || empty(trim($input[$field]))) {
        http_response_code(400);
        echo json_encode(['error' => "Field '$field' is required"]);
        exit();
    }
}

// Sanitize input data
$data = [
    'name' => trim($input['name']),
    'mobile' => trim($input['mobile']),
    'id_type' => $input['idType'] ?? 'none',
    'id_number' => trim($input['idNumber'] ?? ''),
    'purpose' => trim($input['purpose']),
    'address' => trim($input['address'] ?? ''),
    'designation' => trim($input['designation'] ?? ''),
    'image_name' => trim($input['imageName']),
    'image_url' => trim($input['imageUrl']),
    'check_in_time' => date('Y-m-d H:i:s'),
    'status' => 'checked-in'
];

// Validate mobile number format
if (!preg_match('/^[0-9]{10}$/', $data['mobile'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid mobile number format']);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if visitor already checked in today
    $check_query = "SELECT id FROM visitors WHERE mobile = :mobile AND DATE(check_in_time) = CURDATE() AND status = 'checked-in' LIMIT 1";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':mobile', $data['mobile']);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Visitor already checked in today']);
        exit();
    }
    
    // Insert new visitor record
    $query = "INSERT INTO visitors (name, mobile, id_type, id_number, purpose, address, designation, image_name, image_url, check_in_time, status) 
              VALUES (:name, :mobile, :id_type, :id_number, :purpose, :address, :designation, :image_name, :image_url, :check_in_time, :status)";
    
    $stmt = $db->prepare($query);
    
    foreach ($data as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    
    if ($stmt->execute()) {
        $visitor_id = $db->lastInsertId();
        
        // Return success response with visitor details
        echo json_encode([
            'success' => true,
            'message' => 'Check-in successful',
            'visitor_id' => $visitor_id,
            'visitor' => [
                'id' => $visitor_id,
                'name' => $data['name'],
                'mobile' => $data['mobile'],
                'check_in_time' => $data['check_in_time'],
                'status' => $data['status']
            ]
        ]);
    } else {
        throw new Exception('Failed to save visitor data');
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>