$divider = "--------------------------------------------------------------------------------------"

<# Install npm. #>
npm i
Write-Host $divider 
Write-Host "Successfully installed npm"
Write-Host $divider

<# Install the jsmediatags, mkdirp, and nodemon libraries. #>
npm i jsmediatags
Write-Host $divider
Write-Host "Successfully installed jsmediatags"
Write-Host $divider
npm i mkdirp
Write-Host $divider
Write-Host "Successfully installed mkdirp"
Write-Host $divider
npm i nodemon
Write-Host $divider
Write-Host "Successfully installed nodemon"
Write-Host $divider

Write-Host $divider
Write-Host "Fixing all vulnerabilites..."
npm audit fix --force
Write-Host $divider

Write-Host ""
<# Navigate to the backend directory under the src folder and start the server. #>
Write-Host $divider
Write-Host "Starting server..."
cd ../src/backend/
nodemon server
