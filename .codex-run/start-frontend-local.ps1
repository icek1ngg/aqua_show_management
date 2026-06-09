$env:VITE_API_BASE_URL = 'https://operative-agent-relay.ngrok-free.dev/api'

Set-Location 'C:\Users\Admin\OneDrive\Documents\SWD392\frontend'
npm.cmd exec vite -- --host 0.0.0.0 --port 5174 --strictPort
