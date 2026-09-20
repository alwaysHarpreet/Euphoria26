from fastapi import WebSocket


class ProblemReleaseConnectionManager:
    def __init__(self) -> None:
        self.connections: set[WebSocket] = set()

    async def connect(
        self,
        websocket: WebSocket,
    ) -> None:
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(
        self,
        websocket: WebSocket,
    ) -> None:
        self.connections.discard(websocket)

    async def broadcast(
        self,
        message: dict,
    ) -> None:
        connections = list(self.connections)
        disconnected: list[WebSocket] = []

        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(websocket)


problem_release_manager = ProblemReleaseConnectionManager()
