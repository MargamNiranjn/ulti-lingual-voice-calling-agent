import asyncio
import websockets
import json

async def test_sim():
    # Make sure we have a call in the database
    import sqlite3
    conn = sqlite3.connect('leadsense.db')
    cursor = conn.cursor()
    
    # Check if there is a call log
    cursor.execute("SELECT id FROM calls LIMIT 1;")
    row = cursor.fetchone()
    if not row:
        print("No calls found in the database. Please add a customer and place a call first.")
        conn.close()
        return
        
    call_id = row[0]
    conn.close()
    
    url = f"ws://localhost:8000/api/ws/call/{call_id}"
    print(f"Connecting to WebSocket: {url}")
    
    try:
        async with websockets.connect(url) as websocket:
            print("Connected successfully!")
            
            # Wait for greeting message
            greeting_msg = await websocket.recv()
            print("Received from backend:", json.loads(greeting_msg))
            
            # Send customer speech message
            payload = {
                "type": "customer_speech",
                "text": "Hi, yes I am interested. Tell me more."
            }
            print("Sending speech payload...")
            await websocket.send(json.dumps(payload))
            
            # Wait for reply
            reply_msg = await websocket.recv()
            print("Received reply from backend:", json.loads(reply_msg))
            
            # Hang up
            print("Sending hang up...")
            await websocket.send(json.dumps({"type": "hang_up"}))
            
            # Wait for call ended final status
            ended_msg = await websocket.recv()
            print("Received end status:", json.loads(ended_msg))
            
    except Exception as e:
        print(f"WebSocket simulation test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_sim())
