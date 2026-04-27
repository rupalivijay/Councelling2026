# Security Specification for Laxmi Educational

## 1. Data Invariants
- A user can only access and modify their own profile, documents, and messages.
- Only counselors can verify documents and respond to chat messages (though students write messages in their own subcollections).
- College data is publicly readable but only writable by admins.
- Notifications are publicly readable but only writable by admins.
- Appointments are private to the student who booked them, but counselors can see all of them.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to update another user's profile.
   - Target: `users/victim-uid`
   - Payload: `{ "displayName": "Attacker" }`
   - Result: `PERMISSION_DENIED`

2. **Self-Verification**: Student attempting to set their own document status to 'Verified'.
   - Target: `users/student-uid/documents/doc-1`
   - Payload: `{ "status": "Verified" }`
   - Result: `PERMISSION_DENIED`

3. **Privilege Escalation**: Student attempting to create a counselor record for themselves.
   - Target: `counselors/student-uid`
   - Payload: `{ "verified": true }`
   - Result: `PERMISSION_DENIED`

4. **Ghost Field Injection**: Adding `isAdmin: true` to a user profile update.
   - Target: `users/student-uid`
   - Payload: `{ "displayName": "John", "isAdmin": true }`
   - Result: `PERMISSION_DENIED`

5. **Resource Exhaustion**: Sending a 1MB string as a document feedback.
   - Target: `users/student-uid/documents/doc-1`
   - Payload: `{ "feedback": "A".repeat(1024 * 1024) }`
   - Result: `PERMISSION_DENIED`

6. **Orphaned Record**: Creating a message with a non-existent sender ID.
   - Target: `users/student-uid/messages/new-msg`
   - Payload: `{ "text": "Hi", "senderId": "fake-id", "timestamp": "server-timestamp" }`
   - Result: `PERMISSION_DENIED`

7. **Historical Poisoning**: Modifying a college's historical trends.
   - Target: `colleges/college-id`
   - Payload: `{ "historicalTrends": { "General": [{ "year": 2026, "rank": 1 }] } }`
   - Result: `PERMISSION_DENIED`

8. **Bypassing Verification**: Writing a message with `emailVerified: false`.
   - Target: `users/student-uid/messages/new-msg`
   - Result: `PERMISSION_DENIED` (if rules enforce verification)

9. **Terminal State Break**: Modifying an appointment once it is marked 'completed'.
   - Target: `users/student-uid/appointments/app-1`
   - Payload: `{ "status": "pending" }`
   - Result: `PERMISSION_DENIED`

10. **Query Scrapping**: Attempting to list all users without a filter.
    - Target: `users/` (collection query)
    - Result: `PERMISSION_DENIED`

11. **ID Poisoning**: Using a document ID that is 2KB long.
    - Target: `users/L" + "O".repeat(2000) + "L/documents/doc-1`
    - Result: `PERMISSION_DENIED`

12. **Relationship Sync Breach**: Deleting a user's profile while their documents still exist.
    - Result: This is handled by client-side logic or cloud functions, but rules should at least prevent unauthorized deletion.

## 3. The Test Runner

I will implement `firestore.rules.test.ts` to verify these cases.
