import websockets
import asyncio
import time

from Wordle import Wordle
from display import Display


# create handler for each connection
# when there is a connection to the websocket server, the handler function will be invoked.
# You can receive data from the client websocket and send data back to the client in this function.
async def websocket_request_handler(websocket, path):
    # receive the client websocket send data.
    client_data = await websocket.recv()
    print(time.ctime() + '\n' + client_data + '\n\r')

    # construct the response data.
    response_data = "Below is the data recieved from client:\n" + client_data

    # send the data back to the client websocket.
    await websocket.send(response_data)


# create and start the websocket server listen on the provided host and port number.
def start_websocket_server(host, port_number):
    # create the websocket server with the provided handler, host, and port_number.
    websocket_server = websockets.serve(websocket_request_handler, host, port_number)

    print('websocket server is running and listening on port number : ' + str(port_number))
    # run the websocket server asynchronouslly.
    asyncio.get_event_loop().run_until_complete(websocket_server)
    asyncio.get_event_loop().run_forever()

tries = 6

def main():

    wordle = Wordle(tries)
    display = Display(wordle.word, tries)

    while True:

        display.showBoard()

        if wordle.gameOver():
            display.gameOver(wordle.win)
            break

        word = input("\n> ")

        if wordle.guess(word) == False:
            display.error()
            continue
        
        lastIndex = len(wordle.guesses) - 1
        display.addBoard(wordle.guesses[lastIndex], lastIndex)











if __name__ == "__main__":
    main()