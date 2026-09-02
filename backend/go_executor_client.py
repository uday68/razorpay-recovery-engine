import requests

class GoExecutorClient:
    def __init__(self,base_url:str):
        self.base_url = base_url.rstrip("/")

    def execute(self,command:dict)->dict:
        response = requests.post(
            f"{self.base_url}/v1/recovery/execute",
            json = command,
            timeout=5
        )
        response.raise_for_status()
        return response.json()

    