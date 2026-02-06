from fastapi import FastAPI, HTTPException
from typing import List
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn


app = FastAPI(title="Ollama Chat API")


app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)


OLLAMA_URL = "http://localhost:11434"

class ChatRequest(BaseModel):
    message : str
    model: str = "qwen2.5:0.5b"


@app.post("/api/chat")
async def chat(request: ChatRequest):

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json = {
                    "model" : request.model,
                    "prompt": request.message,
                    "stream": False
                }
            )
            response.raise_for_status()
            result = response.json()
            return {
                "response": result.get("response",""),
                "model": request.model,
                "status": "success"
            }
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama request timed out")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Ollama erro: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")





@app.get("/api/health")
async def health_check():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            response.raise_for_status()
            return {
                "status": "healthy",
                "ollama": "connected",
                "models": response.json().get("models",[])
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "ollama": "disconnected",
            "error": str(e)
        }

@app.get("/api/models")
async def list_models():

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            response.raise_for_status()
            models = response.json().get("models",[])
            return {
                "models": [model.get("name") for model in models],
                "status":"success"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching models: {str(e)}")

if __name__ == "__main__":
    
    uvicorn.run(app, host="0.0.0.0", port=8000)