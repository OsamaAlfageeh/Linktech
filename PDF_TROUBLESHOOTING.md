# PDF Generation Troubleshooting Guide

## Problem
PDF generation fails on live server with 500 Internal Server Error, but works locally.

## Common Causes & Solutions

### 1. Chrome/Chromium Installation Issues

**Check if Chrome is properly installed:**
```bash
# Check if Chrome is installed
which google-chrome-stable
# Should return: /usr/bin/google-chrome-stable

# Check Chrome version
google-chrome-stable --version
# Should return: Google Chrome 91.0.4472.124 or similar
```

**If Chrome is not found, install it:**
```bash
# Update package list
sudo apt-get update

# Install Chrome dependencies
sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

# Install Chrome
sudo apt-get install -y google-chrome-stable
```

### 2. Environment Variables

**Check your .env file contains:**
```env
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
NODE_OPTIONS=--max-old-space-size=4096
```

**Verify environment variables are loaded:**
```bash
# Check if variables are set
echo $PUPPETEER_EXECUTABLE_PATH
echo $NODE_OPTIONS
```

### 3. Memory Issues

**Check available memory:**
```bash
# Check memory usage
free -h

# Check if swap is enabled
swapon --show
```

**If low memory, create swap:**
```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 4. Permissions Issues

**Check file permissions:**
```bash
# Check if Chrome is executable
ls -la /usr/bin/google-chrome-stable

# Should show: -rwxr-xr-x
```

**Fix permissions if needed:**
```bash
sudo chmod +x /usr/bin/google-chrome-stable
```

### 5. Test PDF Generation

**Run the test script:**
```bash
cd /path/to/your/project
node server/test-pdf-generation.js
```

**Expected output:**
```
Testing PDF generation on server...
Environment variables:
PUPPETEER_EXECUTABLE_PATH: /usr/bin/google-chrome-stable
NODE_OPTIONS: --max-old-space-size=4096
Launching browser...
Browser launched successfully
New page created
Setting page content...
Generating PDF...
PDF generated successfully, size: 12345 bytes
Test PDF saved as: test-pdf-1234567890.pdf
✓ PDF generation test completed successfully!
```

### 6. Server-Specific Issues

**For Ubuntu/Debian servers:**
```bash
# Install additional dependencies
sudo apt-get update
sudo apt-get install -y \
  libnss3-dev \
  libatk-bridge2.0-dev \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libxss1 \
  libasound2
```

**For CentOS/RHEL servers:**
```bash
# Install dependencies
sudo yum install -y \
  nss \
  atk \
  at-spi2-atk \
  gtk3 \
  libdrm \
  libxkbcommon \
  libXcomposite \
  libXdamage \
  libXrandr \
  libgbm \
  libXScrnSaver \
  alsa-lib
```

### 7. Docker Issues (if using Docker)

**Add to Dockerfile:**
```dockerfile
# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV NODE_OPTIONS=--max-old-space-size=4096
```

### 8. Debugging Steps

**1. Check server logs:**
```bash
# Check your application logs for detailed error messages
tail -f /var/log/your-app.log
```

**2. Test Chrome manually:**
```bash
# Test if Chrome can run in headless mode
google-chrome-stable --headless --disable-gpu --no-sandbox --dump-dom https://www.google.com
```

**3. Check system resources:**
```bash
# Check CPU and memory usage
top
htop

# Check disk space
df -h
```

### 9. Alternative Solutions

**If Puppeteer still fails, consider:**

1. **Use a different PDF library:**
   - `@react-pdf/renderer` (already implemented as fallback)
   - `pdfkit`
   - `jsPDF`

2. **Use a headless service:**
   - Deploy a separate PDF generation service
   - Use a cloud service like AWS Lambda with Puppeteer

3. **Pre-generate PDFs:**
   - Generate PDFs in background jobs
   - Cache generated PDFs
   - Use a queue system like Bull or Agenda

### 10. Quick Fix Commands

**Run these commands in order:**

```bash
# 1. Update system
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Chrome dependencies
sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

# 3. Install Chrome
sudo apt-get install -y google-chrome-stable

# 4. Set permissions
sudo chmod +x /usr/bin/google-chrome-stable

# 5. Test Chrome
google-chrome-stable --version

# 6. Test PDF generation
node server/test-pdf-generation.js

# 7. Restart your application
pm2 restart your-app-name
# or
systemctl restart your-app-service
```

## Expected Results

After following these steps, you should see:
- Chrome installed and working
- PDF generation test passing
- No more 500 errors in your application
- PDF downloads working in the AI assistant

## Still Having Issues?

If the problem persists:
1. Check the exact error message in server logs
2. Verify all environment variables are set correctly
3. Ensure sufficient memory (at least 1GB free)
4. Try running the test script manually
5. Consider using the React PDF fallback instead of Puppeteer
