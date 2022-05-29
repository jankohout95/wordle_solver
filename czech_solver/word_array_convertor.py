if __name__ == "__main__":
        all_possible_words = open('all_possible_words.txt', 'r').read()
        separated_words_list = []

        for i in range(len(all_possible_words)):
            if i != 0 and i % 5 == 0:
                separated_words_list.append(all_possible_words[i-5:i])

        all_possible_words_separated = open('all_possible_words_separated.txt', 'w')
        for word in separated_words_list:
            all_possible_words_separated.write(word + "\n")
        all_possible_words_separated.flush()
        all_possible_words_separated.close()