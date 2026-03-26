import os
import uuid
from pathlib import Path
from pypdf import PdfReader
from openai import AsyncOpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.core.config import settings

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
qdrant_client = QdrantClient(
    url=settings.qdrant_url,
    api_key=settings.qdrant_api_key if settings.qdrant_api_key else None,
)

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def extract_text_from_pdf(file_path: str) -> list[dict]:
    """Extract text from PDF, page by page."""
    reader = PdfReader(file_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text and text.strip():
            pages.append({"page": i + 1, "text": text.strip()})
    return pages

async def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Get embeddings from OpenAI in batches."""
    response = await openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [r.embedding for r in response.data]

def ensure_collection(collection_name: str):
    """Create Qdrant collection if it doesn't exist."""
    existing = [c.name for c in qdrant_client.get_collections().collections]
    if collection_name not in existing:
        qdrant_client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
        )
        qdrant_client.create_payload_index(
            collection_name=collection_name,
            field_name="course_id",
            field_schema="keyword"
        )
        print(f"✅ Created Qdrant collection: {collection_name}")

async def ingest_pdf(
    file_path: str,
    filename: str,
    course_id: str,
    collection_name: str
) -> int:
    """Full pipeline: PDF → chunks → embeddings → Qdrant."""
    
    # 1. Ensure collection exists
    ensure_collection(collection_name)
    
    # 2. Extract text from PDF
    pages = extract_text_from_pdf(file_path)
    if not pages:
        raise ValueError("Could not extract text from PDF")
    
    # 3. Chunk all pages
    all_chunks = []
    for page_data in pages:
        chunks = chunk_text(page_data["text"])
        for chunk in chunks:
            all_chunks.append({
                "text": chunk,
                "page": page_data["page"],
                "filename": filename,
                "course_id": course_id
            })
    
    # 4. Get embeddings in batches of 50
    batch_size = 50
    all_embeddings = []
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i:i + batch_size]
        texts = [c["text"] for c in batch]
        embeddings = await get_embeddings(texts)
        all_embeddings.extend(embeddings)
    
    # 5. Store in Qdrant
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=embedding,
            payload={
                "text": chunk["text"],
                "filename": chunk["filename"],
                "page": chunk["page"],
                "course_id": chunk["course_id"]
            }
        )
        for chunk, embedding in zip(all_chunks, all_embeddings)
    ]
    
    qdrant_client.upsert(collection_name=collection_name, points=points)
    print(f"✅ Ingested {len(points)} chunks from {filename}")
    return len(points)