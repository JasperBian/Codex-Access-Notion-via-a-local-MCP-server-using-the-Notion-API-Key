@echo off
echo ============================================
echo  Notion Workspace Codex Plugin - Setup
echo ============================================
echo.
echo Step 1: Install Node.js dependencies...
cd /d "%~dp0mcp-server"
call npm install
echo.
echo Step 2: Configure your Notion API Key
echo.
echo 1. Go to https://www.notion.so/my-integrations
echo 2. Create a new Internal Integration
echo 3. Copy the "Internal Integration Secret"
echo 4. Set it as environment variable:
echo.
echo    setx NOTION_API_KEY "your_secret_key_here"
echo.
echo Step 3: Restart Codex and install the plugin
echo.
echo Done!
pause
