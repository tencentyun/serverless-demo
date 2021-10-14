# -*- coding: utf8 -*-

import asyncio
import websockets

async def consumer_handler(websocket, path):
    async for message in websocket:
        print("server recv:"+message)
        await websocket.send("server return:"+message)

async def producer_handler(websocket, path):
    count = 0
    while True:
        send_msg = "msg from server ,10s interval ,ping "+str(count)
        await websocket.send(send_msg)
        print(send_msg)
        count += 1
        await asyncio.sleep(10)


async def handler(websocket, path):
    consumer_task = asyncio.ensure_future(consumer_handler(websocket, path))
    producer_task = asyncio.ensure_future(producer_handler(websocket, path))
    done, pending = await asyncio.wait(
        [consumer_task, producer_task],
        return_when=asyncio.FIRST_COMPLETED,
    )
    for task in pending:
        task.cancel()

start_server = websockets.serve(handler, "0.0.0.0", 9000)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()