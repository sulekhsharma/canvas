# API Documentation 🚀

**Interactive Documentation:** [Open Swagger UI](/api-docs) (requires server running)

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
| **`templateId`** | `string` | No | The ID of a server-side template to use (e.g., `review-card`). Overrides `template`. |
| **`template`** | `json` | No | A JSON object or string defining the design layout. Defaults to `default.json` if `templateId` is not provided. |
| **`primaryColor`** | `hex` | No | The primary brand color (e.g., `#FF5733`). Used as a fallback for dynamic elements. |
| **`secondaryColor`**| `hex` | No | The secondary brand color. |
| **`elementColors`** | `JSON` | No | **(New)** A map of element IDs to specific hex colors (e.g., `{"main-qr": "#4285F4"}`). Overrides primary/secondary colors for specific fields. |
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

#### **Example Requests**

**1. Basic JSON Request (using a template ID)**
```bash
curl -X POST https://your-domain.com/api/generate-qr \
  -H "Content-Type: application/json" \
  -d '{
    "gmbUrl": "https://g.page/r/YOUR_LINK_HERE",
    "templateId": "review-card",
    "businessName": "My Business Inc.",
    "primaryColor": "#000000",
    "secondaryColor": "#4285F4",
    "elementColors": {
      "main-qr": "#4285F4",
      "hook": "#ea4335"
    },
    "hookText": "Loved your service?",
    "ctaText": "Scan to leave a review"
  }'
```

**2. Multipart Request (Uploading a Logo)**
```bash
curl -X POST https://your-domain.com/api/generate-qr \
  -H "Content-Type: multipart/form-data" \
  -F "gmbUrl=https://g.page/r/YOUR_LINK_HERE" \
  -F "templateId=review-card" \
  -F "primaryColor=#000000" \
  -F "logo=@/path/to/your/logo.png"
```

#### **Response**
```json
{
  "success": true,
  "url": "https://your-domain.com/public/generated/qr-uuid.png",
  "downloadUrl": "https://your-domain.com/public/generated/qr-uuid.png"
}
```

---

## 2. Template Management (Public)

### **GET** `/templates`

Retrieves a list of all available server-side templates. Use the `id` from this list as the `templateId` in generation requests.

#### **Example Request**
```bash
curl -X GET https://your-domain.com/api/templates
```

#### **Response**
```json
[
  {
    "id": "gmb_qr_minimal_premium_v2",
    "name": "Minimal Premium Poster",
    "description": "Clean, modern layout inspired by Balaji Electronics poster."
  },
  {
    "id": "dental-special-v1",
    "name": "Dental Clinic Style",
    "description": "Inspired by modern clinic review posters with search bar branding."
  },
  {
    "id": "google-review-dark-executive",
    "name": "Dark Executive Card",
    "description": "Premium dark-themed Google search result style card."
  },
  {
    "id": "minimal-floating-card",
    "name": "Floating Paper Card",
    "description": "Sophisticated minimalist design with a clean 'card-on-paper' effect."
  },
  {
    "id": "tech-vibrant-gradient",
    "name": "Neon Dynamic Tech",
    "description": "Modern vibrant style with neon accents and sharp geometry."
  },
  {
    "id": "premium-clinical-v1",
    "name": "Premium Clinical Poster",
    "description": "Clean, healthcare-focused design with soft blue curves."
  },
  {
    "id": "elite-executive-dark",
    "name": "Elite Executive Dark",
    "description": "Luxurious dark design with gold accents."
  },
  {
    "id": "vibrant-neon-retail",
    "name": "Neon Vibrant Retail",
    "description": "High-energy neon theme for modern retail and cafes."
  }
]
```

---

## 3. Authentication

### **POST** `/auth/login`
Logs in an existing user.
*   **Body**: `{ "email": "user@example.com", "password": "password" }`
*   **Response**: `{ "token": "jwt_token...", "user": { ... } }`

### **POST** `/auth/google`
Authenticates via Google (Mock/Prototype).
*   **Body**: `{ "email": "...", "name": "...", "googleId": "..." }`
*   **Response**: `{ "token": "jwt_token...", "user": { ... } }`

---

## 4. Design Management (Protected)
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

## 5. Export Utilities

### **POST** `/export/png`
Renders a design to a PNG buffer on the fly.
*   **Body**: `{ "designData": {...}, "template": {...} }`
*   **Response**: Binary PNG image.

### **POST** `/export/pdf`
Renders a design to a PDF document.
*   **Body**: `{ "designData": {...}, "template": {...} }`
*   **Response**: Binary PDF file.
