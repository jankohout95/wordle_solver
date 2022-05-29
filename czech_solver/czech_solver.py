import websockets
import asyncio
import time
import json

NO_CONTAIN = "0"
PRESENT = "1"
MATCH = "2"

all_possible_words = open('all_possible_words.txt', 'r').read()

passedGuessList = []
patternList = []
guess_word_list = []
potential_word = [None] * 10

g_list = []

words_list = []

resultWord = ""

game_counter = 0
loss_counter = 0

opening_word = "agama" #less entropy
# opening_word = "akter" #most entropy

file_for_loss_counter = opening_word + "_loss_counter.txt"

def convertStringIntoArray(stringToConvert):
    for i in range(len(stringToConvert)):
        if i != 0 and i % 5 == 0:
            words_list.append(stringToConvert[i-5:i])

def getNextGuess():
    nxGL = findWordByPatternNew()
    nextGuess = nxGL[0]
    print(nextGuess)
    passedGuessList.append(nextGuess)
    return nextGuess

def findWordByPatternNew():
    global potential_word
    global g_list
    if len(g_list) == 0:
        g_list = words_list
    new_g_list = []
    lastPattern = patternList[len(patternList) - 1]
    lastGuess = passedGuessList[len(passedGuessList) - 1]
    print(patternList)
    print(passedGuessList)
    for i in range(5):
        if lastPattern[i] == MATCH:
            potential_word[i] = lastGuess[i]
    for i in range(5):
        if lastPattern[i] == NO_CONTAIN:
            for word in g_list:
                if lastGuess[i] not in word and lastGuess[i] not in potential_word:

                    new_g_list.append(word)
            if len(new_g_list) != 0:
                g_list = new_g_list
            new_g_list = []
    if len(g_list) == 1:
        return g_list
    for i in range(5):
        if lastPattern[i] == MATCH:
            for word in g_list:
                if word[i] == lastGuess[i] and word not in passedGuessList:
                    new_g_list.append(word)
            if len(new_g_list) != 0:
                g_list = new_g_list
            new_g_list = []
    if len(g_list) == 1:
        return g_list
    for i in range(5):
        if lastPattern[i] == PRESENT:
            for word in g_list:
                if lastGuess[i] in word and word[i] != lastGuess[i] and word not in passedGuessList:
                    new_g_list.append(word)
            if len(new_g_list) != 0:
                g_list = new_g_list
            new_g_list = []
    if len(g_list) == 1:
        return g_list
    print(g_list)
    return g_list

def checkForDoubleLetter(word):
    for i in range(5):
        for j in range(5):
            if word[i] == word[j] and i != j:
                return True
    return False

# create handler for each connection
# when there is a connection to the websocket server, the handler function will be invoked.
# You can receive data from the client websocket and send data back to the client in this function.
async def websocket_request_handler(websocket, path):
    # receive the client websocket send data.
    client_data = await websocket.recv()
    print(time.ctime() + '\n' + client_data + '\r')
    client_data_json = json.loads(client_data)
    response_data = ""
    if client_data_json["state"] == "init":
        global game_counter
        if game_counter == 100:
            exit(0)
        print("**********************************************************************")
        global resultWord
        global potential_word
        global opening_word
        resultWord = client_data_json["content"]
        passedGuessList.clear()
        patternList.clear()
        g_list.clear()
        potential_word = [None] * 10
        response_data = opening_word
        passedGuessList.append(response_data)
        game_counter += 1
    elif client_data_json["state"] == "pattern":
        patternList.append(client_data_json["content"])
        response_data = getNextGuess()
    elif client_data_json["state"] == "loss":
        global loss_counter
        patternList.append(client_data_json["content"])
        g_list.clear()
        loss_counter += 1
        loss_counter_file = open(file_for_loss_counter, 'w')
        loss_counter_file.write(str(loss_counter))
        loss_counter_file.close()
    elif client_data_json["state"] == "victory":
        patternList.append(client_data_json["content"])
        g_list.clear()
    else:
        print(time.ctime() + '\n' + "Wrong message state!" + '\n\r')

    print(response_data)
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


if __name__ == "__main__":
        convertStringIntoArray(all_possible_words)

        host = "localhost"
        port_number = 9999
        start_websocket_server(host, port_number)