## Renter QA Checklist – Web Frontend

Use this as a lightweight manual test plan for renter flows. Run it with the renter test user from `TEST_USERS_AND_ROLES.md` (or any real renter account).

### 1. Authentication & Session
- **R-Auth-01 – Renter signup**
  - Go to `register.html`, fill form as renter, submit.
  - **Expect**: inline validation, successful register, token + user stored (`mr-token`, `mr-user`, `mr-session`), redirected to home/profile.
- **R-Auth-02 – Renter login**
  - Go to `login.html`, log in with renter test user.
  - **Expect**: header switches to logged-in state (avatar + logout, no login/signup), hero buttons show **Profile + Logout**.
- **R-Auth-03 – Logout**
  - Click header logout or hero logout.
  - **Expect**: localStorage cleared, redirected to `index.html` / `login.html` (for protected pages), header shows Login/Sign Up again.

### 2. Header, Navigation, and Guards
- **R-Nav-01 – Renter header visibility**
  - While logged in as renter, check header on: `index.html`, `search.html`, `listing-detail.html`, `my-bookings.html`, `messages.html`.
  - **Expect**:
    - **Visible**: “My Bookings”, “Messages”.
    - **Hidden**: “Become a Host” (create listing), admin links.
- **R-Nav-02 – Guarded pages**
  - Directly open in browser: `create-listing.html`, `admin/dashboard.html`, `admin/users.html`.
  - **Expect**: renter is **blocked / redirected** (no access to host or admin panels).

### 3. Search → Listing Detail → Booking (Renter-only)
- **R-Book-01 – Search results**
  - On `search.html`, perform a search that returns at least one listing.
  - **Expect**: clicking a card opens `listing-detail.html?id=...`.
- **R-Book-02 – Reserve now button (renter)**
  - Logged in as **renter**, on `listing-detail.html` fill dates & guests, click **Reserve now**.
  - **Expect**: flow continues to booking/payment (or shows stubbed success), no permission errors.
- **R-Book-03 – Reserve now as non-renter**
  - Log in as **owner** or **admin**, open same `listing-detail.html` and click **Reserve now**.
  - **Expect**: booking blocked with message: “Only renter accounts can book listings.”
- **R-Book-04 – Unauthenticated booking**
  - Logged out, open `listing-detail.html`, click **Reserve now**.
  - **Expect**: redirect to `login.html`, then after login as renter, you are sent back to the same listing.

### 4. My Bookings – History & Actions
- **R-Book-05 – Access my bookings**
  - As renter, open `my-bookings.html`.
  - **Expect**: page loads; if backend `/api/bookings?role=renter` is live, real data shows; otherwise sample data with a toast “showing sample data”.
- **R-Book-06 – Filters & counts**
  - Use All / Upcoming / Active / Completed / Cancelled tabs.
  - **Expect**: counts match visible cards; empty tabs show the designed empty state.
- **R-Book-07 – Cancel booking**
  - In sample data, cancel an **Upcoming** booking.
  - **Expect**: status becomes **Cancelled**, card moves to Cancelled tab, success toast appears.

### 5. Messaging (Renter-facing)
- **R-Msg-01 – Contact Host from listing**
  - As renter, on `listing-detail.html` click **Contact Host**.
  - **Expect**: you are taken to `messages.html` (optionally with `?userId=` or `?bookingId=`) and can see the chat UI.
- **R-Msg-02 – Message host from My Bookings**
  - On `my-bookings.html`, for an **Active** booking, click **Message Host**.
  - **Expect**: link goes to `messages.html?bookingId=...`; messages page is accessible (no 403), and permission guard allows it.
- **R-Msg-03 – Messaging guard**
  - Logged out, go directly to `messages.html`.
  - **Expect**: blocked by `checkPageAccess('message')` and redirected to `login.html`.

### 6. Reviews (Post-booking, Renter-only)
- **R-Rev-01 – Write Review from My Bookings**
  - On `my-bookings.html`, locate a **Completed** booking; click **Write Review**.
  - **Expect**: button is visible only for completed bookings; click either shows stubbed alert or navigates to a review page (when implemented).
- **R-Rev-02 – Review visibility for non-renters / non-paid**
  - Log in as a user **without** `review` permission or with `accountType !== 'paid'` (once wired).
  - **Expect**: review CTAs (`.btn-leave-review`, `[data-require="review"]`) are hidden.

### 7. Error & Edge Cases
- **R-Err-01 – Expired session**
  - Manually edit `mr-session` in `localStorage` to an expired `expiresAt`, then refresh `my-bookings.html`.
  - **Expect**: user is logged out and sent to login/home; protected renter pages no longer load.
- **R-Err-02 – API failure on bookings**
  - Stop backend or break `/api/bookings` temporarily.
  - **Expect**: graceful error toast (“Network error…” or “Unable to load live bookings…”), sample/demo bookings still render, UI doesn’t crash.

---

## Test Users for Renter Flows

Use or adapt these renter-focused test accounts (see full script in `TEST_USERS_AND_ROLES.md`):

| Purpose                  | Name         | Email              | Mobile        | Role    | Password        |
|--------------------------|--------------|--------------------|--------------|---------|-----------------|
| Primary renter           | Renter Test  | `renter@test.com`  | `03001230001`| renter  | `StrongPass123!`|
| Paid renter (for reviews)* | Renter Paid | `renter.paid@test.com` | `03001230006`| renter  | `StrongPass123!`|

\*For the paid renter, after creating the user you can manually set `accountType='paid'` in MongoDB or via an admin tool. Use this account for review-related checks where paid-only behavior is required.

### Example cURL for paid renter

```bash
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Renter Paid",
    "email":"renter.paid@test.com",
    "mobile":"03001230006",
    "password":"StrongPass123!",
    "confirmPassword":"StrongPass123!",
    "role":"renter",
    "accountType":"paid"
  }'
```

After running these, you can log in via `login.html` in the frontend and run through the checklist above for each renter scenario.


