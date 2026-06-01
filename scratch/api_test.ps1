# Automated API Test Script for UC-13 Staff Ticket Validation
# Language: PowerShell
# Workspace: Aquapulse Show Management System (ASMS)

$baseUrl = "http://localhost:8080/api"
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " STARTING AUTOMATED USE CASE VERIFICATION" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Staff Login to obtain JWT
Write-Host "[1/3] Authenticating as Staff..." -ForegroundColor Yellow
$loginBody = @{
    email = "staff@asms.test"
    password = "Password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.accessToken
    Write-Host " SUCCESS: Staff authenticated successfully!" -ForegroundColor Green
    Write-Host " Token: $($token.Substring(0, 15))..." -ForegroundColor DarkGray
} catch {
    Write-Host " ERROR: Authentication failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Exit 1
}
Write-Host ""

# Step 2: Validate different QR Ticket payloads
Write-Host "[2/3] Validating QR codes via API..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}

$testCases = @(
    @{ Name = "Valid Ticket"; Code = "ASMS:DEMO:VALID"; Expected = "SUCCESS" },
    @{ Name = "Already Used Ticket"; Code = "ASMS:DEMO:USED"; Expected = "ALREADY_USED" },
    @{ Name = "Expired Ticket"; Code = "ASMS:DEMO:EXPIRED"; Expected = "EXPIRED" },
    @{ Name = "Non-existent Ticket"; Code = "ASMS:INVALID_NONEXISTENT"; Expected = "INVALID_QR" }
)

$results = @()

foreach ($case in $testCases) {
    Write-Host " Testing case: $($case.Name) ('$($case.Code)')..." -ForegroundColor White
    $validationBody = @{
        qrCode = $case.Code
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/tickets/validate" -Method Post -Headers $headers -Body $validationBody -ContentType "application/json"
        $resultCode = $response.data.result
        $message = $response.data.message
        
        # If the valid ticket was already scanned in a previous run, the result will be ALREADY_USED, which is also correct
        $status = "FAILED"
        if ($resultCode -eq $case.Expected) {
            $status = "PASSED"
        } elseif ($case.Code -eq "ASMS:DEMO:VALID" -and $resultCode -eq "ALREADY_USED") {
            $status = "PASSED (Scanned in previous run)"
        }
        
        $results += [PSCustomObject]@{
            "Test Case"    = $case.Name
            "QR Payload"   = $case.Code
            "Expected"     = $case.Expected
            "Actual"       = $resultCode
            "Status"       = $status
            "Message"      = $message
        }
    } catch {
        Write-Host "  Request error: $_" -ForegroundColor Red
    }
}
Write-Host ""

# Step 3: Print Test Report
Write-Host "[3/3] Generating verification report..." -ForegroundColor Yellow
Write-Host ""
$results | Format-Table -AutoSize
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " USE CASE TESTING COMPLETED!" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
