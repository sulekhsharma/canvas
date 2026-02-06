# API Documentation 🚀

Base URL: `/api`

## 1. QR Code Generation (Public)

The core endpoint for generating branded QR code designs programmatically.

### **POST** `/generate-qr`

Generates a QR code design based on provided business details and template configuration.

#### **Request Headers**
*   `Content-Type`: `multipart/form-data` (Recommended if uploading a logo) OR `application/json`

#### **Parameters**

You can provide parameters as individual form-fields or as a JSON key-value map.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **`gmbUrl`** | `string` | **Yes** | The destination URL for the QR code (e.g., your Google Review link). |
| **`logo`** | `file` | No | A binary image file for the business logo. |
| **`logoUrl`** | `string` | No | Alternatively, a public URL to the logo image. |
| **`template`** | `json` | No | A JSON object or string defining the design layout. Defaults to `default.json`. |
| **`primaryColor`** | `hex` | No | The primary brand color (e.g., `#FF5733`). Used for dynamic text/decorations. |
| **`secondaryColor`**| `hex` | No | The secondary brand color. |
| **`businessAddress`**| `string`| No | The business address string. |
| **`mobileNumber`** | `string` | No | Contact mobile number. |
| **`email`** | `string` | No | Contact email address. |
| **`websiteUrl`** | `string` | No | Business website URL. |
| **`facebookUrl`** | `string` | No | Facebook page URL. |
| **`instagramUrl`** | `string` | No | Instagram profile URL. |
| **`data`** | `string` | No | **(Advanced)** A single JSON string containing all the above fields. Useful if valid JSON structure is preferred over flat form-data. |

**Note on Field Names:**
The API is flexible and automatically normalizes common field variations:
*   `business_address` -> `businessAddress`
*   `mobile number` -> `mobileNumber`
*   `email id` -> `email`
*   `instaurl` -> `instagramUrl`

#### **Response**
```json
{
  "success": true,
  "url": "https://your-domain.com/public/generated/qr-uuid.png",
  "downloadUrl": "https://your-domain.com/public/generated/qr-uuid.png"
}
```

---

## 2. Authentication

### **POST** `/auth/login`
Logs in an existing user.
*   **Body**: `{ "email": "user@example.com", "password": "password" }`
*   **Response**: `{ "token": "jwt_token...", "user": { ... } }`

### **POST** `/auth/google`
Authenticates via Google (Mock/Prototype).
*   **Body**: `{ "email": "...", "name": "...", "googleId": "..." }`
*   **Response**: `{ "token": "jwt_token...", "user": { ... } }`

---

## 3. Design Management (Protected)
Requires Header: `Authorization: Bearer <token>`

### **GET** `/designs`
Returns a list of saved designs for the logged-in user.

### **POST** `/designs`
Saves or updates a design.
*   **Body**:
    ```json
    {
      "id": "optional-uuid",
      "templateId": "template-name",
      "data": { ...design configuration... }
    }
    ```

---

## 4. Export Utilities

### **POST** `/export/png`
Renders a design to a PNG buffer on the fly.
*   **Body**: `{ "designData": {...}, "template": {...} }`
*   **Response**: Binary PNG image.

### **POST** `/export/pdf`
Renders a design to a PDF document.
*   **Body**: `{ "designData": {...}, "template": {...} }`
*   **Response**: Binary PDF file.
