from collections import defaultdict

from fastapi import WebSocket


class LeaderboardConnectionManager:
    def __init__(self) -> None:
        self.connections: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect(
        self,
        round_id: int,
        websocket: WebSocket,
    ) -> None:
        await websocket.accept()
        self.connections[round_id].add(websocket)

    def disconnect(
        self,
        round_id: int,
        websocket: WebSocket,
    ) -> None:
        connections = self.connections.get(round_id)

        if connections is None:
            return

        connections.discard(websocket)

        if not connections:
            self.connections.pop(round_id, None)

    async def broadcast(
        self,
        round_id: int,
        team_id: int,
    ) -> None:
        message = {
            "type": "leaderboard_update",
            "round_id": round_id,
            "team_id": team_id,
        }
        connections = list(self.connections.get(round_id, set()))
        disconnected: list[WebSocket] = []

        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(round_id, websocket)


leaderboard_manager = LeaderboardConnectionManager()