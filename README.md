# BackEnd-Ecommerce

## Email & OTP Management System

This backend includes a comprehensive email and OTP management system with the following features:

### Features

- **Email Notifications**: Automated email sending for order status updates
- **OTP Verification**: Email OTP for user registration and password reset
- **Cron Jobs**: Scheduled tasks for email processing and cleanup
- **Admin Management**: Admin-only API endpoints for cron job management
- **Email Templates**: Beautiful, branded HTML email templates
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Environment variable configuration for email credentials

### OTP System

- **Registration OTP**: Email verification during user registration
- **Password Reset OTP**: Secure password reset via email OTP
- **Rate Limiting**: 1-minute cooldown between OTP requests
- **Auto-cleanup**: Expired OTPs automatically deleted
- **Security**: 10-minute expiration, 5 attempt limit

### API Endpoints

#### OTP Endpoints

- `POST /api/send-registration-otp` - Send OTP for registration
- `POST /api/verify-otp-and-register` - Verify OTP and register user
- `POST /api/send-forgot-password-otp` - Send OTP for password reset
- `POST /api/verify-forgot-password-otp` - Verify OTP and reset password
- `POST /api/resend-otp` - Resend OTP

#### Cron Management (Admin Only)

- `GET /api/cron/status` - Get cron job status
- `POST /api/cron/start` - Start all cron jobs
- `POST /api/cron/stop` - Stop all cron jobs
- `POST /api/cron/trigger/confirmation` - Manually trigger confirmation emails
- `POST /api/cron/trigger/processing` - Manually trigger processing emails
- `POST /api/cron/trigger/delivered` - Manually trigger delivered emails
- `GET /api/cron/email-config` - Check email configuration

---

## Legacy API Documentation

You must have Postman to use the following commands they can be used in bulk edit in body:form.

npm run dev
to start the server

#GET Methode:

#Product:

localhost:3000/api/products
to get all products

localhost:3000/api/products/66d5fde3a55458b5bb454d17
localhost:3000/api/products/id
to get specific product

#User:

localhost:3000/api/users
to get all users

localhost:3000/api/users/66d8688622c8d9e42026d86f
localhost:3000/api/users/id
to get specific user

#POST Methode:

#Product

localhost:3000/api/createproducts

//name:
//description:
//price:
//catagories:
//brand:
//stock:
//image:

to add a product

#User:
localhost:3000/api/createusers

//firstName:
//lastName:
//email:
//userName:
//password:
//image:

to add a user

#PUT Methode:

#Product:

localhost:3000/api/updateproducts/id

//name:
//description:
//price:
//catagories:
//brand:
//stock:
//image:

to update a product

#User:

localhost:3000/api/updateusers/id

//firstName
//lastName
//email
//userName
//password
//image:

to update a user

#DELETE Methode

#Product:

localhost:3000/api/data/id

to delete a product

#User:

localhost:3000/api/deleteusers/id

to delete a user
