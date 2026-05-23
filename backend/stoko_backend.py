import os

import uvicorn


def main():
    host = os.getenv("STOKO_API_HOST", "127.0.0.1")
    port = int(os.getenv("STOKO_API_PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
