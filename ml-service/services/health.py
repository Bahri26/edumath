from datetime import datetime, timezone


def health_payload() -> dict:
    return {
        "status": "ok",
        "service": "edumath-ml-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
