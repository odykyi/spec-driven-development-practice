## ADDED Requirements

### Requirement: Users can request mentoring
The system SHALL allow users to request feedback from mentors on their solutions.

#### Scenario: Submit mentoring request
- **WHEN** a user completes an exercise and clicks "Request Mentoring"
- **THEN** the system creates a mentoring request
- **AND** notifies available mentors
- **AND** the user enters a queue for that exercise

#### Scenario: Cancel mentoring request
- **WHEN** a user cancels their mentoring request
- **THEN** the system removes the request from the queue
- **AND** notifies any assigned mentor that the request was cancelled

### Requirement: Mentors can claim requests
The system SHALL allow mentors to claim mentoring requests.

#### Scenario: View queue
- **WHEN** a mentor views the mentoring queue
- **THEN** the system displays pending requests grouped by exercise
- **AND** shows how long each request has been waiting

#### Scenario: Claim request
- **WHEN** a mentor claims a request
- **THEN** the system assigns the mentor to the request
- **AND** notifies the user that a mentor has been assigned
- **AND** removes the request from the public queue

### Requirement: Mentors provide feedback
The system SHALL support mentor feedback on user solutions.

#### Scenario: Submit feedback
- **WHEN** a mentor submits feedback
- **THEN** the system stores the feedback with line references
- **AND** notifies the user of new feedback
- **AND** the feedback is linked to the specific solution version

#### Scenario: Feedback threading
- **WHEN** a user responds to mentor feedback
- **THEN** the system maintains a threaded conversation
- **AND** notifies the mentor of the response

### Requirement: Mentoring conversations are private
The system SHALL keep mentoring conversations private between mentor and user.

#### Scenario: Privacy enforcement
- **WHEN** a mentoring conversation exists
- **THEN** only the mentor and the user can view the conversation
- **AND** the conversation is not visible in public solution listings

### Requirement: Mentors have performance metrics
The system SHALL track metrics for mentors.

#### Scenario: Mentor dashboard
- **WHEN** a mentor views their dashboard
- **THEN** the system displays: completed mentored sessions, average response time, user satisfaction ratings
- **AND** shows a history of all mentoring sessions

### Requirement: Mentoring supports approval workflow
The system SHALL support an approval workflow for completing mentorship.

#### Scenario: Mark as complete
- **WHEN** a mentor and user agree the mentoring is complete
- **THEN** either party can mark the session as complete
- **AND** the system prompts for a satisfaction rating
- **AND** the solution is marked as "mentored" in the user's history
