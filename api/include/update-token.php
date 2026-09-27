<?php
    use \Firebase\JWT\JWT;
 
    $token= ["id"=>$my_details->id, "full_name"=>$my_details->full_name, "login"=>true];
    $jwt = JWT::encode($token, $privateKey, 'RS256');
  
    $code = ["jwt"=>$jwt];