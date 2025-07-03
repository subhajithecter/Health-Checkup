# 🩺 AI-Powered Remote Diagnosis App (FastAPI + MongoDB + Gemini LLM)

This project is an AI-assisted medical diagnosis API built with **FastAPI**. It allows users to input symptoms (optionally with base64-encoded medical images), and returns a preliminary diagnosis using **Gemini LLM** (via `emergentintegrations`) along with medicine recommendations, dietary suggestions, and nearby pharmacy/doctors info.

---

## 🚀 Features

- 🔍 AI-powered symptom analysis & diagnosis (Gemini LLM API)
- 💊 Medicine & dosage recommendations
- 🥗 Diet recommendations for recovery
- 🏥 Suggests specialist types & pharmacy chains
- 📜 Full disclaimer for AI-based medical advice
- 🧠 Stores all diagnoses in MongoDB
- 🖼️ Optionally accepts medical images (base64-encoded)
- ⚙️ Built with FastAPI & async MongoDB client (`motor`)

---

## 🧰 Tech Stack

- **Backend Framework:** FastAPI
- **Database:** MongoDB (Async using `motor`)
- **LLM Integration:** Gemini via `emergentintegrations`
- **Environment Config:** `python-dotenv`
- **API Testing:** Swagger UI (`/docs`)

---

## 📂 Project Structure

Health-Checkup/
├── backend/
│ ├── server.py # Main FastAPI application
│ ├── .env # Environment variables
│ └── ... # Future routers, utils, etc.


---

## ⚙️ Setup Instructions

### 1. Clone & Navigate
```bash
git clone https://github.com/yourusername/health-checkup.git
cd health-checkup/backend

### 2. Create Virtual Environment
python -m venv venv
venv\Scripts\activate  # For Windows

###3. Install Dependencies
Windows: 
pip install -r requirements.txt
pip install fastapi uvicorn python-dotenv motor pydantic
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

###4.Configure Environment
MONGO_URL=your_mongo_connection_string
DB_NAME=healthcheckup
GEMINI_API_KEY=your_gemini_api_key

###5. Run the App
uvicorn server:app --reload

###6.API Endpoints
| Method | Endpoint            | Description                    |
| ------ | ------------------- | ------------------------------ |
| GET    | `/api/`             | Welcome message                |
| POST   | `/api/diagnose`     | Submit symptoms for diagnosis  |
| GET    | `/api/history`      | Get full diagnosis history     |
| GET    | `/api/history/{id}` | Fetch specific diagnosis by ID |

###7.Sample Request (POST /api/diagnose)
{
  "symptoms": "Severe chest pain and shortness of breath",
  "patient_age": 45,
  "patient_gender": "female",
  "image_base64": null,
  "location": "Mumbai"
}

###8. Disclaimer
This is an AI-powered preliminary medical assistant. It does not replace professional medical advice. Users are strongly encouraged to consult licensed healthcare professionals for any health concerns.




