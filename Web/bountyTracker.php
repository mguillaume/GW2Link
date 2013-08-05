<?php

if(!isset($_GET['groupName']))
	die;

$host = 'mysql:host=localhost;dbname=gw2';
$user = 'gw2';
$password = 'gw2loc';
$connexion = new PDO( $host, $user, $password );

$return = array(
				"error" => true,
				"data" => ''
				);

if(isset($_GET['create']) && isset($_GET['author'])) {
	$createTracker = $connexion->prepare("INSERT INTO bountyTracker(groupName, author, time) VALUES(:groupName, :author, CURDATE())");
	
	$createTracker->bindParam(':groupName', $_GET['groupName'], PDO::PARAM_STR, 25);
	$createTracker->bindParam(':author', $_GET['author'], PDO::PARAM_STR, 50);

	$success = $createTracker->execute();

	if($success)
		$return["error"] = false;
}
elseif(isset($_GET['update']) && isset($_GET['boss'])) {
	$boss_list = array("sotzz", "trillia", "michiele", "mayana", "arderus", "2mult", "trekksa", "tarban", "yanonka", "poobadoo", "brekkabek", "prisoner", "komali", "teesa", "bwikki", "felix", "brooke", "ander");
	if(in_array($_GET['boss'], $boss_list)) {
		$found = ($_GET['update'] == 'found') ? TRUE : FALSE;

		$updateTracker = $connexion->prepare("UPDATE bountyTracker SET " . $_GET['boss'] . " = :found WHERE groupName = :groupName");

		$updateTracker->bindParam(':found', $found, PDO::PARAM_BOOL);
		$updateTracker->bindParam(':groupName', $_GET['groupName'], PDO::PARAM_STR, 25);

		$success = $updateTracker->execute();

		if($success)
			$return["error"] = false;		
	}
}
elseif(isset($_GET['getData'])) {
	$getData = $connexion->prepare("SELECT * FROM bountyTracker WHERE groupName = :groupName");

	$getData->bindParam(':groupName', $_GET['groupName'], PDO::PARAM_STR, 25);

	$success = $getData->execute();

	if($success) {
		$result = $getData->fetchAll(PDO::FETCH_ASSOC);

		if(!empty($result)) {
			$return["error"] = false;
			$return["data"] = $result[0];
		}
	}
}
else if(isset($_GET['version'])) {
	$return["error"] = false;
	$return["data"] = array("version" => "0.9");
}

header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');
echo json_encode($return);
?>