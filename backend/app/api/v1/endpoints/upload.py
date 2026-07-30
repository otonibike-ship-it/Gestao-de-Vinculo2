import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
import httpx

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"}
MAX_SIZE = 20 * 1024 * 1024  # 20MB
BUCKET = "gestao-vinculo"


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Tipo de arquivo não permitido: {ext}")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Arquivo muito grande (máx. 20MB)")

    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase não configurado")

    unique_name = f"{uuid.uuid4()}_{file.filename}"
    upload_url = f"{supabase_url}/storage/v1/object/{BUCKET}/{unique_name}"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                upload_url,
                content=content,
                headers={
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": file.content_type or "application/octet-stream",
                },
                timeout=60.0,
            )
            resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=500, detail=f"Erro no upload: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no upload: {str(e)}")

    public_url = f"{supabase_url}/storage/v1/object/public/{BUCKET}/{unique_name}"
    return {"filename": file.filename, "url": public_url}
