# 📱 SMS Notification Setup Guide

## Current Issue
The parent portal shows "sent successfully" for SMS notifications, but parents aren't receiving text messages. This is because the system is currently using email fallback instead of real SMS.

## Solution: Twilio SMS Integration

### Step 1: Create Twilio Account
1. Visit https://twilio.com
2. Sign up for a free account
3. Verify your email and phone number

### Step 2: Get Twilio Credentials
Once logged into your Twilio Console:

1. **Account SID**: Found on your dashboard main page
2. **Auth Token**: Found on your dashboard main page (click to reveal)
3. **Phone Number**: 
   - Go to Phone Numbers → Manage → Active numbers
   - If none exists, click "Buy a number" (free trial includes credit)
   - Choose a number with SMS capabilities

### Step 3: Add Credentials to Replit
In your Replit project, add these as Secrets:

- `TWILIO_ACCOUNT_SID`: Your Account SID (starts with "AC...")
- `TWILIO_AUTH_TOKEN`: Your Auth Token 
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number (format: +1234567890)

### Step 4: Test SMS Functionality
Once credentials are added, the parent portal will automatically start sending real SMS messages instead of email fallbacks.

## Temporary Workaround
Until SMS is set up, notifications are being sent as emails to the parent's email address with SMS-style content.

## Need Help?
Contact support if you need assistance with Twilio setup or have questions about the SMS integration.