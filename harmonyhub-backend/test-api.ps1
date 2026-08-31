# test-login.ps1

Write-Host "Testing Login..." -ForegroundColor Yellow

$body = @{
    email = "admin@harmonyhub.test"
    password = "password123"
} | ConvertTo-Json

Write-Host "Request Body: $body" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "`n✓ Login Successful!" -ForegroundColor Green
    Write-Host "User: $($response.data.user.name)" -ForegroundColor Cyan
    Write-Host "Email: $($response.data.user.email)" -ForegroundColor Cyan
    Write-Host "Token: $($response.data.token.Substring(0, 30))..." -ForegroundColor Cyan
} catch {
    Write-Host "`n✗ Login Failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}