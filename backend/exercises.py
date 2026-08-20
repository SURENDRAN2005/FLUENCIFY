import random

def generate_exercise(level: int, weak_phonemes: list[str]) -> dict:
    if level == 0:
        passages = [
            "When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors.",
            "The quick brown fox jumps over the lazy dog. This sentence contains every letter in the English alphabet and is used to test typing and reading.",
            "A gentle breeze rustled the leaves of the old oak tree, sending a shower of golden acorns down to the soft earth below.",
            "Technology has transformed how we communicate, allowing us to instantly share ideas and connect with people from all around the world.",
            "Cooking a good meal requires patience, fresh ingredients, and a willingness to experiment with different spices and flavors."
        ]
        return {
            "exercise_text": random.choice(passages),
            "focus_areas": ["diagnostic", "baseline"],
            "instructions": "DIAGNOSTIC ASSESSMENT: Read this passage naturally. Your performance will determine your starting training level."
        }
    
    if level == 1:
        sounds = [
            ("Ahhhhhhhhh", "Exhale and say 'ah' continuously."),
            ("Oooooooooo", "Form an 'o' shape with your lips and voice 'oh'."),
            ("Eeeeeeeeee", "Keep your mouth relaxed and sustain 'ee'."),
            ("Mmmmmmmmmm", "Keep your lips closed and hum steadily.")
        ]
        text, inst = random.choice(sounds)
        return {
            "exercise_text": text,
            "focus_areas": ["breath", "relaxation"],
            "instructions": f"Take a deep breath. {inst}"
        }
    
    elif level == 2:
        sounds = [
            "/m/ - mmmmm", "/s/ - sssss", "/f/ - fffff", 
            "/z/ - zzzzz", "/v/ - vvvvv", "/sh/ - shhhh",
            "eeeee", "ooooo", "aaaaa"
        ]
        return {
            "exercise_text": random.choice(sounds),
            "focus_areas": ["phonation", "stability"],
            "instructions": "Prolong this single sound continuously without stopping. Keep your volume steady."
        }
        
    elif level == 3:
        chains = [
            "ma-ma-ma-ma", "at-at-at-at", "po-po-po-po", "sa-se-si-so",
            "ba-be-bi-bo", "ta-ta-ta-ta", "ki-ki-ki-ki", "la-le-li-lo",
            "ra-ra-ra-ra", "do-do-do-do", "fe-fi-fo-fum", "ga-ga-ga-ga"
        ]
        return {
            "exercise_text": random.choice(chains),
            "focus_areas": ["syllables", "timing"],
            "instructions": "Read these syllables with equal stress and perfectly regular timing. Don't rush."
        }
        
    elif level == 4:
        # Feared sounds logic for Level 4 Words
        k_words = ["Cat", "Kite", "Coconut", "Cracked", "Clever", "Keep", "Cold", "King", "Camera", "Castle"]
        s_words = ["Sun", "Snake", "Simple", "Seashore", "Seven", "Smile", "Stone", "Summer", "Silver", "Sound"]
        r_words = ["Red", "Rock", "Rare", "Roosters", "Round", "River", "Rabbit", "Race", "Rain", "Robot"]
        p_words = ["Paper", "Puppy", "Pencil", "Piano", "Perfect", "Pocket", "Purple", "People", "Pizza", "Planet"]
        b_words = ["Baby", "Balloon", "Banana", "Basket", "Better", "Bottle", "Button", "Bubble", "Butterfly", "Bridge"]
        default_words = ["Dog", "House", "Beautiful", "Tomorrow", "Computer", "Window", "Morning", "Coffee", "Friend", "Music"]
        
        target_list = default_words
        if weak_phonemes:
            if "/k/" in weak_phonemes: target_list = k_words
            elif "/s/" in weak_phonemes: target_list = s_words
            elif "/r/" in weak_phonemes: target_list = r_words
            elif "/p/" in weak_phonemes: target_list = p_words
            elif "/b/" in weak_phonemes: target_list = b_words
            
        selected_words = random.sample(target_list, 5)
        text = ", ".join(selected_words)
            
        return {
            "exercise_text": text,
            "focus_areas": ["words"] + weak_phonemes,
            "instructions": "Read this tiered word list. Start slow, pause between words, and focus on a gentle onset."
        }
        
    elif level == 5 or level == 6:
        # Paced Sentences / Shadow Speech
        templates = {
            "/k/": [
                "The clever crow cracked the coconut.",
                "Can you catch the cold cat?",
                "Kings keep their castles completely clean."
            ],
            "/s/": [
                "Seven slippery snakes slid slowly.",
                "She sells seashells by the seashore.",
                "Some students study science on Sundays."
            ],
            "/r/": [
                "Robert read a rare red book.",
                "Rabbits race rapidly round the river.",
                "Red roosters run through the rain."
            ],
            "/p/": [
                "Peter picked a purple pepper.",
                "Please paint the picture perfectly.",
                "Puppies play happily in the park."
            ],
            "/b/": [
                "Big bears bounce on bouncy balls.",
                "Baby birds build beautiful nests.",
                "Bake the bread before breakfast."
            ],
            "default": [
                "Learning to speak smoothly takes patience and practice.",
                "The quick brown fox jumps over the lazy dog.",
                "A gentle breeze blew across the quiet valley.",
                "Music can change your mood in a matter of seconds.",
                "Always remember to drink enough water throughout the day."
            ]
        }
        
        target_key = weak_phonemes[0] if weak_phonemes and weak_phonemes[0] in templates else "default"
        selected_sentence = random.choice(templates[target_key])
        
        instruction = "Read aloud synchronously, linking your words together." if level == 5 else "Read aloud clearly, focusing on continuous phonation across words."
        
        return {
            "exercise_text": selected_sentence,
            "focus_areas": ["paced_reading"] + weak_phonemes,
            "instructions": instruction
        }
        
    elif level >= 7:
        prompts = [
            "You are at a restaurant. Order a coffee and a sandwich.",
            "You are in a job interview. Introduce yourself and your skills.",
            "You are calling a friend to arrange a weekend meeting.",
            "Explain your favorite movie or book without giving away the ending.",
            "Describe the best vacation you have ever taken in detail.",
            "You are complaining to a store manager about a broken product.",
            "Give someone directions from your house to the nearest grocery store.",
            "Talk about your daily routine from the moment you wake up.",
            "Explain how to cook your favorite meal step by step.",
            "Describe your dream job and why you would love doing it."
        ]
        return {
            "exercise_text": random.choice(prompts),
            "focus_areas": ["spontaneous_speech", "recovery"],
            "instructions": "Speak spontaneously on this topic. Focus on recovering quickly and staying calm if a block occurs."
        }
        
    return {
        "exercise_text": "Default exercise text.",
        "focus_areas": ["general"],
        "instructions": "Read clearly."
    }
