# Test Booking IDs and Numbers for Disputes

## Test Booking Numbers

You can use these test booking numbers when filing disputes:

### Sample Booking Numbers (Format: MR + Timestamp + Counter)
- `MR17676224861820039`
- `MR17676224861820040`
- `MR17676224861820041`
- `MR17676224861820042`
- `MR17676224861820043`

### How to Use

1. **When filing a dispute**, you can enter either:
   - **Booking Number** (e.g., `MR17676224861820039`) - The system will automatically find the booking
   - **Booking ID** (MongoDB ObjectId format) - If you have the actual database ID

2. **The system now supports both formats:**
   - If you enter a booking number (starts with "MR"), it will search by `bookingNumber`
   - If you enter a MongoDB ObjectId, it will search by `_id`
   - The system will automatically detect which format you're using

### Creating Test Bookings

To create test bookings for testing disputes:

1. **Via API:**
   ```bash
   POST /api/bookings
   {
     "listingId": "<valid-listing-id>",
     "checkIn": "2025-01-15",
     "checkOut": "2025-01-20",
     "guests": 2
   }
   ```

2. **The booking number will be auto-generated** in the format: `MR{timestamp}{counter}`

### Notes

- Booking numbers are unique identifiers that users see (e.g., `MR17676224861820039`)
- Booking IDs are internal MongoDB ObjectIds (e.g., `507f1f77bcf86cd799439011`)
- The dispute system now accepts both formats automatically
- You must be either the renter or owner of the booking to file a dispute

