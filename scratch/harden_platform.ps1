
$newCode = @'
const FALLBACK_MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
];

async function callAIWithFallback(apiKey: string, body: any): Promise<Response> {
  let lastError = "";
  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`Attempting AI request with model: ${model}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey 
        },
        body: JSON.stringify({ ...body, model }),
      });

      if (response.ok) {
        console.log(`AI Success with model: ${model}`);
        return response;
      }

      const errStatus = response.status;
      const errText = await response.text();
      lastError = `${model} (Status ${errStatus}): ${errText}`;
      console.warn(`Model ${model} failed:`, lastError);
      
      if (errStatus === 402 || errStatus === 429) return response;
      
    } catch (e) {
      lastError = `${model}: ${e instanceof Error ? e.message : "Network/Connection error"}`;
      console.warn(`Model ${model} execution error:`, e);
    }
  }
  throw new Error(`AI Service Unavailable. Details: ${lastError}`);
}
'@

# Regex to match the existing FALLBACK_MODELS and callAIWithFallback blocks
# Handling variants with and without type annotations
$pattern = '(?s)const\s+FALLBACK_MODELS\s*=\s*\[.*?\];.*?async\s+function\s+callAIWithFallback\(.*?\)\s*(:\s*Promise<Response>)?\s*\{.*?\}'

$files = Get-ChildItem -Path "supabase/functions" -Filter "index.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match $pattern) {
        Write-Host "Updating AI logic in: $($file.FullName)"
        $newContent = $content -replace $pattern, $newCode
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
    } else {
        Write-Host "No matching AI pattern in: $($file.FullName) - Skipping."
    }
}

Write-Host "Double-checking for any remaining 'gemini-2.5' or 'gemini-2.0' hardcoded strings..."
$files = Get-ChildItem -Path "supabase/functions" -Filter "*.ts" -Recurse
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match 'gemini-2\.[05]') {
        Write-Host "Fixing hardcoded legacy models in: $($file.FullName)"
        $newContent = $content -replace 'gemini-2\.[05]-flash', 'gemini-1.5-flash'
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
    }
}

Write-Host "Platform-wide AI hardening complete."
