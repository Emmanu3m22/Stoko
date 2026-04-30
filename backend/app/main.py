from fastapi import FastAPI

app = FastAPI(title="Stoko API", description="API para el sistema de inventarios y ventas Stoko", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Bienvenido a Stoko API"}
