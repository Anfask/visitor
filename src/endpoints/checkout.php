<?php
// endpoints/checkout.php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['mobile']) || empty(trim($input['mobile']))) {
    http_response_code(400);
    echo json_encode(['error' => 'Mobile number is required']);
    exit();
}

$mobile = trim($input['mobile']);

// Validate mobile number format
if (!preg_match('/^[0-9]{10}$/', $mobile)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid mobile number format']);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Find the most recent checked-in visitor with this mobile number
    $query = "SELECT id, name, mobile, check_in_time, status 
              FROM visitors 
              WHERE mobile = :mobile AND status = 'checked-in' 
              ORDER BY check_in_time DESC LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':mobile', $mobile);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'No active check-in found for this mobile number']);
        exit();
    }
    
    $visitor = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Update visitor status to checked-out
    $checkout_time = date('Y-m-d H:i:s');
    $update_query = "UPDATE visitors SET status = 'checked-out', check_out_time = :check_out_time WHERE id = :id";
    
    $update_stmt = $db->prepare($update_query);
    $update_stmt->bindParam(':check_out_time', $checkout_time);
    $update_stmt->bindParam(':id', $visitor['id']);
    
    if ($update_stmt->execute()) {
        // Calculate visit duration
        $checkin_time = new DateTime($visitor['check_in_time']);
        $checkout_time_obj = new DateTime($checkout_time);
        $duration = $checkin_time->diff($checkout_time_obj);
        
        $duration_text = '';
        if ($duration->h > 0) {
            $duration_text .= $duration->h . ' hour' . ($duration->h > 1 ? 's' : '') . ' ';
        }
        if ($duration->i > 0) {
            $duration_text .= $duration->i . ' minute' . ($duration->i > 1 ? 's' : '');
        }
        if (empty($duration_text)) {
            $duration_text = 'Less than a minute';
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Check-out successful',
            'visitor' => [
                'id' => $visitor['id'],
                'name' => $visitor['name'],
                'mobile' => $visitor['mobile'],
                'check_in_time' => $visitor['check_in_time'],
                'check_out_time' => $checkout_time,
                'duration' => trim($duration_text),
                'status' => 'checked-out'
            ]
        ]);
    } else {
        throw new Exception('Failed to update checkout status');
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>