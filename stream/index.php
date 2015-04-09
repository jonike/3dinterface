<?php include_once("header_functions.php"); ?>
<!doctype html>
<html>
    <?php head('Streaming simulator'); ?>
    <body>
        <?php include("header.php"); ?>
        <?php include("nav.php"); ?>
        <div style="border-width:1px; border-style: solid;" id="container"></div>
        <?php include("jsIncludes.php"); ?>
        <script src="js/Params.js.php?<?php echo htmlentities($_SERVER['QUERY_STRING']); ?>"></script>
        <script src="js/main.js"></script>
    </body>
</html>
