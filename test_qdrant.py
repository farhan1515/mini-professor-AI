from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

url = "https://70e526ac-7eec-407f-80da-416d8df901f4.europe-west3-0.gcp.cloud.qdrant.io:443"
api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.1ZaFZ0N4KF0XATARooZRHD3rO40i0qtkDXKJbVlnvPY"

client = QdrantClient(url=url, api_key=api_key)

print("Collections:")
try:
    cols = client.get_collections()
    for c in cols.collections:
        print(f"- {c.name}")
        info = client.get_collection(c.name)
        print(f"  Points: {info.points_count}")
except Exception as e:
    print(f"Error: {e}")

