# Solar Plant Management - Backend Server

This backend server creates actual physical folders and files for each company in the solar plant management system.

## Features

- Creates physical company folders in `./companies/` directory
- Each company folder contains:
  - `admin.json` - Admin credentials and details
  - `users.json` - All users and their passwords
  - `plant_details.json` - Complete plant data with power arrays
- RESTful API for all file operations
- Real-time file system operations

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

## Running the Server

### Development Mode (with auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create new company folder
- `DELETE /api/companies/:companyId` - Delete company folder

### Tables
- `POST /api/companies/:companyId/tables` - Add table to company

### Users
- `GET /api/companies/:companyId/users` - Get company users
- `POST /api/companies/:companyId/users` - Add user to company

### Plant Details
- `GET /api/companies/:companyId/plant-details` - Get plant details

### Admin
- `GET /api/companies/:companyId/admin` - Get admin credentials

## File Structure

When you create a company, the following structure is created:

```
backend/companies/
├── company-123/
│   ├── admin.json
│   ├── users.json
│   └── plant_details.json
├── company-456/
│   ├── admin.json
│   ├── users.json
│   └── plant_details.json
└── ...
```

## Example Company Creation

```bash
curl -X POST http://localhost:3001/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "company-123",
    "companyName": "SolarTech Corp",
    "voltagePerPanel": 20,
    "currentPerPanel": 10,
    "plantPowerKW": 1000,
    "adminEmail": "admin@solartech.com",
    "adminPassword": "secure_password",
    "adminName": "John Doe"
  }'
```

This will create a physical folder at `backend/companies/company-123/` with all the necessary files.

## Notes

- The server automatically creates the `companies` directory if it doesn't exist
- All files are stored in JSON format for easy reading and editing
- The server includes CORS support for frontend communication
- Error handling is included for all file operations

