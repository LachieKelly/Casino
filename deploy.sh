#!/bin/bash

# Gambling Addiction Satisfier - Deployment Script
echo "🎰 Deploying Gambling Addiction Satisfier to Netlify..."

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Login to Netlify (if not already logged in)
echo "🔐 Checking Netlify authentication..."
if ! netlify status &> /dev/null; then
    echo "Please login to Netlify:"
    netlify login
fi

# Deploy the site
echo "🚀 Deploying to Netlify..."
netlify deploy --prod --dir .

echo "✅ Deployment complete!"
echo "🌐 Your site is now live at the URL shown above!"
echo "💡 You can also set up a custom domain in the Netlify dashboard."
