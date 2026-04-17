# Notification System

Specify a multi-channel notification system supporting email, push, SMS, and in-app notifications.

## Instructions

Write a specification for a notification system that routes messages through appropriate channels based on user preferences and urgency.

## Learning Goals

- Specify preference management
- Define routing logic
- Handle delivery failures
- Document rate limiting and batching

## Channels & Use Cases

1. **Email** - Order confirmations, newsletters, digests
2. **Push** - Real-time alerts, reminders, instant messages
3. **SMS** - Critical alerts, 2FA codes, appointment reminders
4. **In-App** - Feature announcements, tips, activity updates

## User Preferences

Users SHALL be able to:
- Enable/disable channels per notification type
- Set quiet hours for push notifications
- Choose digest frequency (immediate, hourly, daily, weekly)
- Set priority levels (critical, high, normal, low)

## Example Structure

```markdown
### Requirement: Notification Routing
The system SHALL route notifications based on user preferences.

#### Scenario: Critical alert during quiet hours
- **GIVEN** user has quiet hours set (10PM-8AM)
- **AND** user receives critical security alert at 11PM
- **WHEN** the alert is triggered
- **THEN** the system sends SMS (bypasses quiet hours)
- **AND** sends email
- **AND** queues push notification for 8AM

#### Scenario: Normal notification with digest preference
- **GIVEN** user prefers daily digest for low priority
- **WHEN** a low priority notification arrives
- **THEN** the system adds to daily digest queue
- **AND** does not send immediate notification
```
