<?php
// config/database.php
class Database {
    private $host = "localhost";
    private $db_name = "visitor_register";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}

// Firebase Admin SDK Configuration
require_once 'vendor/autoload.php';

use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth;

class FirebaseConfig {
    private static $instance = null;
    private $auth;
    
    private function __construct() {
        // Initialize Firebase with service account
        $factory = (new Factory)
            ->withServiceAccount(__DIR__ . '/firebase-service-account.json')
            ->withDatabaseUri('https://your-project-id-default-rtdb.firebaseio.com/');
        
        $this->auth = $factory->createAuth();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new FirebaseConfig();
        }
        return self::$instance;
    }
    
    public function getAuth() {
        return $this->auth;
    }
    
    public function verifyIdToken($idToken) {
        try {
            $verifiedIdToken = $this->auth->verifyIdToken($idToken);
            return $verifiedIdToken;
        } catch (Exception $e) {
            return false;
        }
    }
}
?>