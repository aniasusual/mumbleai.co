"""
Scenario definitions for the LinguaFlow language tutor.
Used by both the agent and the API endpoints.
"""

SCENARIOS = {
    "job_interview": {
        "title": "Job Interview",
        "description": "Practice answering common interview questions professionally",
        "icon": "Briefcase",
        "starter_prompts": [
            "Tell me about yourself",
            "Why should we hire you?",
            "What are your strengths and weaknesses?"
        ]
    },
    "restaurant": {
        "title": "At a Restaurant",
        "description": "Practice ordering food, making reservations, and dining conversations",
        "icon": "UtensilsCrossed",
        "starter_prompts": [
            "I'd like to make a reservation",
            "What do you recommend?",
            "Could I see the menu, please?"
        ]
    },
    "travel": {
        "title": "Travel & Directions",
        "description": "Practice asking for directions, booking hotels, and navigating airports",
        "icon": "Plane",
        "starter_prompts": [
            "How do I get to the train station?",
            "I'd like to check in, please",
            "Is there a bus stop nearby?"
        ]
    },
    "small_talk": {
        "title": "Small Talk",
        "description": "Master the art of casual conversation and making friends",
        "icon": "MessageCircle",
        "starter_prompts": [
            "Nice weather today, isn't it?",
            "What do you do for a living?",
            "Have you seen any good movies lately?"
        ]
    },
    "business_meeting": {
        "title": "Business Meeting",
        "description": "Practice professional meeting etiquette and discussion",
        "icon": "Users",
        "starter_prompts": [
            "Let's go over the agenda",
            "I'd like to propose a new strategy",
            "What are your thoughts on this?"
        ]
    },
    "phone_call": {
        "title": "Phone Call",
        "description": "Practice phone conversations, leaving messages, and call etiquette",
        "icon": "Phone",
        "starter_prompts": [
            "Hello, may I speak with...?",
            "I'm calling to inquire about...",
            "Could you please hold?"
        ]
    },
    "shopping": {
        "title": "Shopping",
        "description": "Practice buying things, asking about prices, and returns",
        "icon": "ShoppingBag",
        "starter_prompts": [
            "Do you have this in a different size?",
            "How much does this cost?",
            "I'd like to return this item"
        ]
    },
    "doctor_visit": {
        "title": "Doctor Visit",
        "description": "Practice describing symptoms and understanding medical advice",
        "icon": "Stethoscope",
        "starter_prompts": [
            "I've been feeling unwell",
            "I have an appointment with Dr...",
            "What are the side effects?"
        ]
    }
}
