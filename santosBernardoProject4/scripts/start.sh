#!/bin/bash

$divider = "--------------------------------------------------------------------------------------"

<# Install npm. #>
npm i
echo $divider 
echo "Successfully installed npm"
echo $divider

<# Install the jsmediatags, mkdirp, and nodemon libraries. #>
npm i jsmediatags
echo $divider
echo "Successfully installed jsmediatags"
echo $divider
npm i mkdirp
echo $divider
echo "Successfully installed mkdirp"
echo $divider
npm i nodemon
echo $divider
echo "Successfully installed nodemon"
echo $divider

echo $divider
echo "Fixing all vulnerabilites..."
npm audit fix --force
echo $divider

echo ""
<# Navigate to the backend directory under the src folder and start the server. #>
echo $divider
echo "Starting server..."
cd ../src/backend/
nodemon server