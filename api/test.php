<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <?php 
        function generateId1(){
            $bytes = random_bytes(16);
            $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
            $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
            
            $hex = strtolower(bin2hex($bytes));
            return substr($hex, 0, 8) . '-' .substr($hex, 8, 4) . '-' .substr($hex, 12, 4) . '-' .substr($hex, 16, 4) . '-' .substr($hex, 20, 12);
        }

        function generateId2() {
            $bytes = random_bytes(16);
            $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
            $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
            $hex = bin2hex($bytes);
            return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split($hex, 4));
        }
        echo generateId1()."&nbsp;&nbsp;&nbsp;&nbsp;".generateId2()."<br>";
    ?>
</body>
</html>