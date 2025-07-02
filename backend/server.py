from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64
import asyncio
import json

# Install emergentintegrations if not already installed
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
except ImportError:
    import subprocess
    subprocess.check_call([
        "pip", "install", "emergentintegrations", 
        "--extra-index-url", "https://d33sy5i8bnduwe.cloudfront.net/simple/"
    ])
    from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Gemini API Configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

# Define Models
class DiagnosisRequest(BaseModel):
    symptoms: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    image_base64: Optional[str] = None
    location: Optional[str] = None

class DiagnosisResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symptoms: str
    diagnosis: str
    medicines: List[str]
    medicine_timing: str
    diet_recommendations: List[str]
    nearby_pharmacies: List[str]
    recommended_doctors: List[str]
    disclaimer: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DiagnosisHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symptoms: str
    diagnosis: str
    medicines: List[str]
    medicine_timing: str
    diet_recommendations: List[str]
    nearby_pharmacies: List[str]
    recommended_doctors: List[str]
    disclaimer: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Medical AI System Message
MEDICAL_SYSTEM_MESSAGE = """You are a medical AI assistant specializing in preliminary diagnosis based on symptoms and medical images. 

IMPORTANT GUIDELINES:
1. Always provide a preliminary diagnosis based on the symptoms and/or medical images provided
2. Suggest appropriate medicines with specific dosage and timing
3. Recommend dietary changes that can help with recovery
4. Suggest types of nearby pharmacies or specific pharmacy chains where medicines can be purchased
5. Recommend types of medical specialists who would be best for treating this condition
6. Always include appropriate medical disclaimers

RESPONSE FORMAT (JSON):
{
    "diagnosis": "Preliminary diagnosis based on symptoms/images",
    "medicines": ["Medicine 1 - Dosage", "Medicine 2 - Dosage", "Medicine 3 - Dosage"],
    "medicine_timing": "Detailed timing schedule for taking medicines (e.g., Medicine 1: Take twice daily after meals, Medicine 2: Take once at bedtime)",
    "diet_recommendations": ["Dietary advice 1", "Dietary advice 2", "Dietary advice 3"],
    "nearby_pharmacies": ["CVS Pharmacy", "Walgreens", "Local independent pharmacies", "Hospital pharmacies"],
    "recommended_doctors": ["Specialist type 1 (e.g., Dermatologist)", "Specialist type 2 (e.g., General Practitioner)", "Specialist type 3 if needed"],
    "disclaimer": "This is a preliminary AI-assisted diagnosis. Please consult a qualified healthcare professional for proper medical examination and treatment. This advice should not replace professional medical consultation."
}

Always respond in valid JSON format with the exact structure above."""

async def get_ai_diagnosis(symptoms: str, image_base64: Optional[str] = None, patient_info: str = "") -> dict:
    """Get AI-powered medical diagnosis using Gemini"""
    try:
        # Create a new chat session for each diagnosis
        session_id = str(uuid.uuid4())
        
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=session_id,
            system_message=MEDICAL_SYSTEM_MESSAGE
        ).with_model("gemini", "gemini-2.0-flash").with_max_tokens(4096)
        
        # Prepare the message
        message_text = f"""
        PATIENT INFORMATION: {patient_info}
        
        SYMPTOMS: {symptoms}
        
        Please analyze these symptoms and provide a comprehensive medical assessment following the JSON format specified in your system message.
        """
        
        # Create user message
        if image_base64:
            # If image is provided, include it in the analysis
            from emergentintegrations.llm.chat import ImageContent
            image_content = ImageContent(image_base64=image_base64)
            
            user_message = UserMessage(
                text=message_text + "\n\nPlease also analyze the provided medical image for additional diagnostic information.",
                file_contents=[image_content]
            )
        else:
            user_message = UserMessage(text=message_text)
        
        # Send message and get response
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            # Extract JSON from response if it's wrapped in text
            response_text = response.strip()
            if response_text.startswith('```json'):
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif response_text.startswith('```'):
                response_text = response_text.split('```')[1].strip()
            
            diagnosis_data = json.loads(response_text)
            return diagnosis_data
        except json.JSONDecodeError:
            # If JSON parsing fails, create a structured response from the text
            return {
                "diagnosis": response[:200] + "..." if len(response) > 200 else response,
                "medicines": ["Please consult a doctor for proper medication"],
                "medicine_timing": "Consult healthcare provider for proper timing",
                "diet_recommendations": ["Maintain a balanced diet", "Stay hydrated", "Get adequate rest"],
                "nearby_pharmacies": ["CVS Pharmacy", "Walgreens", "Local pharmacies"],
                "recommended_doctors": ["General Practitioner", "Specialist as needed"],
                "disclaimer": "This is a preliminary AI-assisted diagnosis. Please consult a qualified healthcare professional for proper medical examination and treatment."
            }
    except Exception as e:
        logger.error(f"Error in AI diagnosis: {str(e)}")
        return {
            "diagnosis": "Unable to process diagnosis at this time. Please consult a healthcare professional.",
            "medicines": ["Please consult a doctor for proper medication"],
            "medicine_timing": "Consult healthcare provider for proper timing",
            "diet_recommendations": ["Maintain a balanced diet", "Stay hydrated", "Get adequate rest"],
            "nearby_pharmacies": ["CVS Pharmacy", "Walgreens", "Local pharmacies"],
            "recommended_doctors": ["General Practitioner"],
            "disclaimer": "This is a preliminary AI-assisted diagnosis. Please consult a qualified healthcare professional for proper medical examination and treatment."
        }

# Routes
@api_router.get("/")
async def root():
    return {"message": "Remote Diagnosis App API"}

@api_router.post("/diagnose", response_model=DiagnosisResponse)
async def create_diagnosis(request: DiagnosisRequest):
    """Create a new medical diagnosis based on symptoms and optional image"""
    try:
        # Prepare patient information
        patient_info = ""
        if request.patient_age:
            patient_info += f"Age: {request.patient_age} years. "
        if request.patient_gender:
            patient_info += f"Gender: {request.patient_gender}. "
        if request.location:
            patient_info += f"Location: {request.location}. "
        
        # Get AI diagnosis
        diagnosis_result = await get_ai_diagnosis(
            symptoms=request.symptoms,
            image_base64=request.image_base64,
            patient_info=patient_info
        )
        
        # Create response object
        response = DiagnosisResponse(
            symptoms=request.symptoms,
            diagnosis=diagnosis_result["diagnosis"],
            medicines=diagnosis_result["medicines"],
            medicine_timing=diagnosis_result["medicine_timing"],
            diet_recommendations=diagnosis_result["diet_recommendations"],
            nearby_pharmacies=diagnosis_result["nearby_pharmacies"],
            recommended_doctors=diagnosis_result["recommended_doctors"],
            disclaimer=diagnosis_result["disclaimer"]
        )
        
        # Save to database
        diagnosis_history = DiagnosisHistory(**response.dict())
        await db.diagnosis_history.insert_one(diagnosis_history.dict())
        
        return response
        
    except Exception as e:
        logger.error(f"Error in diagnosis creation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create diagnosis: {str(e)}")

@api_router.get("/history", response_model=List[DiagnosisHistory])
async def get_diagnosis_history():
    """Get all diagnosis history"""
    try:
        history = await db.diagnosis_history.find().sort("timestamp", -1).to_list(100)
        return [DiagnosisHistory(**item) for item in history]
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch diagnosis history")

@api_router.get("/history/{diagnosis_id}")
async def get_diagnosis_by_id(diagnosis_id: str):
    """Get specific diagnosis by ID"""
    try:
        diagnosis = await db.diagnosis_history.find_one({"id": diagnosis_id})
        if not diagnosis:
            raise HTTPException(status_code=404, detail="Diagnosis not found")
        return DiagnosisHistory(**diagnosis)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching diagnosis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch diagnosis")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()