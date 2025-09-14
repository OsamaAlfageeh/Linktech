# Notification Testing Guide

## Overview
This guide documents the process for testing the notification system in the Linktech application, specifically focusing on offer notifications. The testing process verifies that notifications are properly generated when offers are created and that the notification read status can be updated correctly.

## Test Scripts

Three test scripts have been created to test different aspects of the notification system:

1. `test-offer-notification.js` - Creates a project offer and triggers notification generation
2. `verify-notification.js` - Verifies that offer notifications are properly generated for project owners
3. `test-mark-notification-read.js` - Tests marking notifications as read (both individual and all)

## Prerequisites

- Node.js installed
- Axios library installed (`npm install axios`)
- Linktech server running on localhost:3000
- Test user accounts created in the system:
  - Project owner: user2@example.com / password123
  - Company: company1@example.com / password123

## Testing Process

### 1. Creating Offer Notifications

Run the first test script to create an offer and generate a notification:

```bash
node test-offer-notification.js
```

This script will:
- Log in as a company user
- Fetch available projects
- Create an offer for the first project
- The server will automatically generate a notification for the project owner

### 2. Verifying Notifications

Run the verification script to check if notifications were properly generated:

```bash
node verify-notification.js
```

This script will:
- Log in as the project owner
- Fetch notifications
- Filter for 'offer' type notifications
- Display notification details including metadata

### 3. Testing Notification Read Status

Run the read status test script to verify marking notifications as read:

```bash
node test-mark-notification-read.js
```

This script will:
- Log in as the project owner
- Fetch notifications
- Mark a single notification as read
- Verify the read status was updated
- Mark all notifications as read
- Verify all notifications are marked as read

## API Endpoints Used

The test scripts interact with the following API endpoints:

- `/api/login` - For authentication
- `/api/projects` - To fetch available projects
- `/api/projects/:id/offers` - To create offers
- `/api/notifications` - To fetch user notifications
- `/api/notifications/:id/read` - To mark a single notification as read
- `/api/notifications/read-all` - To mark all notifications as read

## Notification Structure

Notifications in the system have the following structure:

```javascript
{
  id: String,           // Unique identifier
  userId: String,       // ID of the user who receives the notification
  type: String,         // Type of notification (e.g., 'offer')
  title: String,        // Notification title
  content: String,      // Notification content/message
  read: Boolean,        // Read status
  createdAt: Date,      // Creation timestamp
  actionUrl: String,    // URL to navigate to when clicking the notification
  metadata: Object      // Additional data specific to the notification type
}
```

For 'offer' type notifications, the metadata includes:
- `projectId` - ID of the project
- `offerId` - ID of the offer
- `companyId` - ID of the company that made the offer (for project owner notifications)
- `projectOwnerId` - ID of the project owner (for company notifications)

## Troubleshooting

If the tests fail, check the following:

1. Ensure the server is running and accessible at http://localhost:3000
2. Verify that the test user accounts exist in the system
3. Check that the project used in the test exists
4. Review server logs for any errors during notification creation
5. Ensure the notification API endpoints are properly implemented in routes.ts