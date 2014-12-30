<?php 
define('UPLOAD_DIR', 'images/');
	$img = $_POST['data'];
	$img = str_replace('data:image/webp;base64,', '', $img);
	$img = str_replace(' ', '+', $img);
	$data = base64_decode($img);
	$file = UPLOAD_DIR . uniqid() . '.jpg';
	$temp = UPLOAD_DIR . uniqid() . '.jpg';
//	$success = file_put_contents($file, $data);
//	print $success ? $file : $success;

    $fp = fopen($file, 'w');
//$i = 0;
//    while(strlen($data) > ($i+1024)){
//        $tempData = substr($data, $i,$i+1023);
//        fwrite($fp, $tempData);
//        
//        $i += 1024;
//    }
    fwrite($fp, $data);
    fclose($fp);
    print $file;
 ?>