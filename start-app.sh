#!/bin/bash

echo -e "\e[32mStarting JSON Viewer application...\e[0m"

# Start the server in the background
echo -e "\e[36mStarting Node.js server...\e[0m"
cd "$(dirname "$0")/server" && npm run dev &
SERVER_PID=$!

# Give the server a moment to start
sleep 2

# Start React app in the foreground
echo -e "\e[36mStarting React application...\e[0m"
cd "$(dirname "$0")" && npm start

# If the React app is terminated, also kill the server
kill $SERVER_PID 