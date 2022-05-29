import math

from itertools import combinations_with_replacement
from itertools import permutations
from itertools import combinations

NO_CONTAIN = "0"
PRESENT = "1"
MATCH = "2"

all_possible_words = open('all_possible_words.txt', 'r').read()
# opener_entropies = {}

def convertStringIntoArray(stringToConvert):
    wlist = []
    for i in range(len(stringToConvert)):
        if i != 0 and i % 5 == 0:
            wlist.append(stringToConvert[i-5:i])
    return wlist

def makePossiblePatterns():
    all_combinations = []
    # A Python program to print all combinations
    # with an element-to-itself combination is
    # also included


    # Get all combinations of [1, 2, 3] and length 2
    perm = permutations([1, 2, 0], 3)

    comb = []
    for i in list(perm):
        print(i)
        temp_comb = combinations_with_replacement(list(i), 3)
        comb.append(list(temp_comb))
    print(comb)
    for row in list(comb):
        for i in row:
            temp_comb = combinations_with_replacement(list(i), 5)
            all_combinations.append(list(temp_comb))
            # print(i)
    print("***************************************************************")
    all_combinations_sorted = []
    for row in all_combinations:
        # print(row)
        for i in row:
            print(i)
            all_combinations_sorted.append(list(i))
    print(all_combinations_sorted)
    print(len(all_combinations_sorted))
    all_combinations_sorted_string_list = []
    for listItem in all_combinations_sorted:
        stringPattern = ""
        for i in listItem:
            stringPattern += str(i)
        all_combinations_sorted_string_list.append(stringPattern)
    print(all_combinations_sorted_string_list)
    all_combinations_sorted_set = set(all_combinations_sorted_string_list)
    print(all_combinations_sorted_set)
    print(len(all_combinations_sorted_set))



    # for listItem
    # all_combinations_sorted_set = set(all_combinations_sorted)
    # for i in all_combinations_sorted_set:
    #     print(i)
    exit(0)
    comb10 = combinations_with_replacement([0, 1, 2], 3)
    comb11 = combinations_with_replacement([2, 0, 1], 3)
    # comb12 = permutations([2, 0, 0], 3)
    # comb13 = permutations([1, 1, 0], 3)
    # comb14 = permutations([2, 2, 0], 3)
    # comb3 = permutations([0, 0, 1], 3)
    perm = permutations([0, 1, 2])
    comb2 = combinations([0, 1, 2], 2)

    # Print the obtained combinations
    # for i in list(comb):
    #     print(i)
    # for i in list(perm):
    #     print(i)
    # for i in list(comb2):
    #     print(i)
    # for i in list(comb3):
    #     print(i)

    for i in list(comb10):
        print(list(i))
        comb4 = combinations_with_replacement(list(i), 5)
        for j in list(comb4):
            # print(j)
            all_combinations.append(j)
    for i in list(comb11):
        print(list(i))
        comb4 = combinations_with_replacement(list(i), 5)
        for j in list(comb4):
            # print(j)
            all_combinations.append(j)
    # for i in list(comb12):
    #     print(list(i))
    #     comb4 = combinations_with_replacement(list(i), 5)
    #     for j in list(comb4):
    #         all_combinations.append(j)
    # for i in list(comb13):
    #     print(list(i))
    #     comb4 = combinations_with_replacement(list(i), 5)
    #     for j in list(comb4):
    #         all_combinations.append(j)
    # for i in list(comb14):
    #     print(list(i))
    #     comb4 = combinations_with_replacement(list(i), 5)
    #     for j in list(comb4):
    #         all_combinations.append(j)

    all_combinations_set = set(all_combinations)
    print(all_combinations_set)
    print(len(all_combinations_set))

    all_combinations_dict = {}
    for setItem in all_combinations_set:
        all_combinations_dict[str(setItem)] = list(setItem)

    print(all_combinations_dict['(2, 2, 0, 0, 2)'])

def matchPattern(openerWord, anotherWord):
    pattern_array = [None] * 5
    # Detects matches -> state 2
    for i in range(5):
        oWLetter = openerWord[i]
        aWLetter =  anotherWord[i]
        if(oWLetter == aWLetter):
            pattern_array[i] = 2
    # Detects presence of letter -> state 1
    for i in range(5):
        oWLetter = openerWord[i]
        if oWLetter in anotherWord:
            pattern_array[i] = 1
    # Detects if opener word does not contain letter -> state 0
    for i in range(5):
        oWLetter = openerWord[i]
        if oWLetter not in anotherWord:
            pattern_array[i] = 0
    pattern = ""
    for i in pattern_array:
        pattern += str(i)

    return pattern

def performOpenerEntropies(words_list):
    count_of_words = len(words_list)
    pattern_frequencies = {}
    pattern_probabilities = {}
    pattern_entropies = {}
    word_data_dict = {}
    counter = 0
    for openerWord in words_list:
        for word in words_list:
            if openerWord != word:
                pattern = matchPattern(openerWord, word)
                if pattern_frequencies.get(pattern) == None:
                    pattern_frequencies[pattern] = 1
                else:
                    pattern_frequencies[pattern] += 1
        for pattern_index in pattern_frequencies:
            pattern_frequency = pattern_frequencies[pattern_index]
            if pattern_probabilities.get(pattern_index) == None:
                pattern_probabilities[pattern_index] = pattern_frequency/count_of_words
        for pattern_probability_index in pattern_probabilities:
            if pattern_entropies.get(pattern_probability_index) == None:
                pattern_entropies[pattern_probability_index] = pattern_probabilities[pattern_probability_index] * math.log2(1/pattern_probabilities[pattern_probability_index])
        entropy_suma = 0
        for pattern_entropy_index in pattern_entropies:
            entropy_suma += pattern_entropies[pattern_entropy_index]
        word_data_item = {"count_of_words": count_of_words, "pattern_frequencies": pattern_frequencies, "pattern_probabilities": pattern_probabilities, "pattern_entropies": pattern_entropies, "entropy_suma": entropy_suma}
        word_data_dict[openerWord] = word_data_item

        pattern_frequencies = {}
        pattern_probabilities = {}
        pattern_entropies = {}

        counter += 1
        percentage_estimation = counter/count_of_words*100
        print("Progress: " + str(percentage_estimation) + " %")

    return word_data_dict

if __name__ == "__main__":
        presorted_list_of_words = {}
        words_list = convertStringIntoArray(all_possible_words)
        opener_entropies = performOpenerEntropies(words_list)
        # print(opener_entropies)
        for word_data_index in opener_entropies:
            word_data = opener_entropies[word_data_index]
            # print(word_data_index + ": " + str(word_data["entropy_suma"]))
            presorted_list_of_words[word_data_index] = word_data["entropy_suma"]
            # print(presorted_list_of_words)

        max_word = ""
        max_entropy = 0

        min_word = ""
        min_entropy = 10

        for presorted_word_index in presorted_list_of_words:
            if presorted_list_of_words[presorted_word_index] > max_entropy:
                max_entropy = presorted_list_of_words[presorted_word_index]
                max_word = presorted_word_index
            if presorted_list_of_words[presorted_word_index] < min_entropy:
                min_entropy = presorted_list_of_words[presorted_word_index]
                min_word = presorted_word_index
        print("Word with max entropy: " + max_word + " -> " + str(max_entropy))
        print("Word with min entropy: " + min_word + " -> " + str(min_entropy))



        # print(opener_entropies)


        # host = "localhost"
        # port_number = 9999
        # start_websocket_server(host, port_number)