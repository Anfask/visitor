<?php
// endpoints/get_visitors.php
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get query parameters
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 20;
    $status = isset($_GET['status']) ? $_GET['status'] : 'all';
    $date = isset($_GET['date']) ? $_GET['date'] : '';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    
    $offset = ($page - 1) * $limit;
    
    // Build query conditions
    $conditions = [];
    $params = [];
    
    if ($status !== 'all') {
        $conditions[] = "status = :status";
        $params[':status'] = $status;
    }
    
    if (!empty($date)) {
        $conditions[] = "DATE(check_in_time) = :date";
        $params[':date'] = $date;
    }
    
    if (!empty($search)) {
        $conditions[] = "(name LIKE :search OR mobile LIKE :search OR purpose LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }
    
    $where_clause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
    
    // Get total count
    $count_query = "SELECT COUNT(*) as total FROM visitors $where_clause";
    $count_stmt = $db->prepare($count_query);
    foreach ($params as $key => $value) {
        $count_stmt->bindValue($key, $value);
    }
    $count_stmt->execute();
    $total_count = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get visitors data
    $query = "SELECT id, name, mobile, id_type, id_number, purpose, address, designation, 
                     image_name, image_url, check_in_time, check_out_time, status
              FROM visitors 
              $where_clause 
              ORDER BY check_in_time DESC 
              LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $visitors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate pagination info
    $total_pages = ceil($total_count / $limit);
    
    // Format visitor data
    $formatted_visitors = array_map(function($visitor) {
        $duration = null;
        if ($visitor['check_out_time']) {
            $checkin_time = new DateTime($visitor['check_in_time']);
            $checkout_time = new DateTime($visitor['check_out_time']);
            $diff = $checkin_time->diff($checkout_time);
            
            $duration_text = '';
            if ($diff->h > 0) {
                $duration_text .= $diff->h . 'h ';
            }
            if ($diff->i > 0) {
                $duration_text .= $diff->i . 'm';
            }
            if (empty($duration_text)) {
                $duration_text = '<1m';
            }
            $duration = trim($duration_text);
        }
        
        return [
            'id' => $visitor['id'],
            'name' => $visitor['name'],
            'mobile' => $visitor['mobile'],
            'idType' => $visitor['id_type'],
            'idNumber' => $visitor['id_number'],
            'purpose' => $visitor['purpose'],
            'address' => $visitor['address'],
            'designation' => $visitor['designation'],
            'imageName' => $visitor['image_name'],
            'imageUrl' => $visitor['image_url'],
            'checkInTime' => $visitor['check_in_time'],
            'checkOutTime' => $visitor['check_out_time'],
            'status' => $visitor['status'],
            'duration' => $duration
        ];
    }, $visitors);
    
    echo json_encode([
        'success' => true,
        'visitors' => $formatted_visitors,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $total_pages,
            'total_count' => intval($total_count),
            'per_page' => $limit,
            'has_next' => $page < $total_pages,
            'has_prev' => $page > 1
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>