import asyncio
import websockets


# define the async function that send the text to the websocket server.
async def ping_websocket_server(send_text):
    # define the websocket server access URL.
    websocket_server_url = 'ws://localhost:9999/'

    # connect to the websocket server.
    async with websockets.connect(websocket_server_url) as websocket:
        # send the text to the websocket server and wait for the reply.
        await websocket.send(send_text)
        # get the websocket server return text.
        server_resp = await websocket.recv()
        # print out the server response text.
        print(server_resp)


# this function will send the text to the websocket server by invoking the ping_websocket_server(send_text) function.
def create_websocket_client(send_text):
    # call the asyncio function to invoke the ping_websocket_server(send_text) function.
    asyncio.get_event_loop().run_until_complete(ping_websocket_server(send_text))


if __name__ == '__main__':
    print('Please input the text send to the websocket server, type send to finish.\n\r')
    send_data_all = ''

    # loop to get the user input text to send.
    while True:
        input_data = input('>')
        # when user type 'send' then break the loop.
        if input_data.lower() == 'send':
            break
        send_data_all += input_data + '\n'

    create_websocket_client(send_data_all)