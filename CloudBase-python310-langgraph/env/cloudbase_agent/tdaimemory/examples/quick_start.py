import json
import logging
import time

from tdaimemory import MemoryClient

logging.basicConfig(level=logging.WARNING)

# Initialize client
EndPoint = "https://memory.tdai.tencentyun.com"
ApiKey = "***************************"
MemoryId = "tdai-mem-********"

client = MemoryClient(endpoint=EndPoint, api_key=ApiKey, memory_id=MemoryId, default_actor_id="actor-xxx")
# 1. Create a new session
session = client.create_session(
    name="TravelSession",
)
session_id = session["session_id"]
print(f"1. Session created successfully: {session_id}")

# 2. Add event
# The first round
event = client.append_event(
    session_id=session_id,
    messages={
        "chat": [
            {"role": "user", "content": "Hi, please help me plan a 3-day trip to Hangzhou next week."},
            {
                "role": "assistant",
                "content": "Sure! Here's a recommended 3-day Hangzhou itinerary. Day 1: Focus on West Lake classics. Start from Broken Bridge in the morning, walk along Bai Causeway, and enjoy the picturesque lake scenery. Then take a boat to visit Three Pools Mirroring the Moon, climb Leifeng Pagoda in the afternoon for panoramic views, watch the sunset at Quyuan Garden, and explore Hefang Street night market for local snacks.\\n\\nDay 2: Experience Zen and Song Dynasty culture. Visit Lingyin Temple in the morning, take photos at Faxi Temple's yellow walls, immerse yourself in Songcheng in the afternoon with AR experiences and watch the 'Romance of the Song Dynasty' show. If you have energy in the evening, visit Jiuxi Eighteen Gullies for cool streams.\\n\\nDay 3: Explore wetlands and canal culture. Take a traditional boat ride in Xixi Wetland in the morning, listen to boat songs, and experience slow-paced water town life. In the afternoon, visit Qiaoxi Historic District and artistic Xiaohe Street, tour the Crafts Museum, and relax at a cafe before ending your journey.",
            },
            {
                "role": "user",
                "content": "I prefer quiet places with fewer people, and I'm particularly interested in food.",
            },
            {
                "role": "assistant",
                "content": "Based on your preference for quiet places and food, I've optimized the itinerary to avoid crowded tourist spots and focus on peaceful experiences and authentic flavors.\\n\\nDay 1: Secluded West Lake\\nMorning walk along Yanggong Causeway and Maojiabu, enjoying serene lake views. Lunch at the old restaurant 'Kuiyuan Guan' for shrimp and eel noodles. Afternoon boat trip to Three Pools Mirroring the Moon, evening tea at lakeside teahouse. Dinner at Shengli River Food Street for authentic local cuisine.\\n\\nDay 2: Zen Path\\nEarly visit to Lingyin Temple, then walk along quiet Tianzhu Road to Faxi Temple. Lunch at 'Zhizhu' for vegetarian noodles. Afternoon deep into Yunqi Bamboo Path to see bamboo forests. Dinner at 'Xinfeng Snacks' for steamed buns and local street food.\\n\\nDay 3: Water Town Slow Life\\nFull day at Xixi Wetland on traditional boats, deep into reed marshes for tranquility. Afternoon to artistic Xiaohe Street, relax at a canal-side cafe, ending the journey.",
            },
        ],
    },
)
print(f"2.1 Event added successfully: {event['event_id']}")
# The second round
event = client.append_event(
    session_id=session_id,
    messages={
        "chat": [
            {
                "role": "user",
                "content": "Great! The hotel needs to have a gym, and I'm severely allergic to peanuts, please be careful when booking restaurants.",
            },
            {
                "role": "assistant",
                "content": "Understood! I've noted all your requirements (preference for quiet places, love of food, hotel with gym, severe peanut allergy). Here are selected hotels with gyms:\\n\\nWest Lake Lu Yi Boutique Hotel: Located in West Lake District, quiet design, equipped with gym, away from downtown, meeting your need for tranquility.\\n\\nHangzhou Xixi Zijingang DoubleTree by Hilton: Near Xixi Wetland, complete facilities, professional gym, suitable for Day 3 wetland itinerary.",
            },
        ],
    },
)
print(f"2.2 Event added successfully: {event['event_id']}")
# Round Three
event = client.append_event(
    session_id=session_id,
    messages={
        "chat": [
            {"role": "user", "content": "Perfect! By the way, my girlfriend prefers modern art. Any recommendations?"},
            {
                "role": "assistant",
                "content": "Got it! Considering your girlfriend's preference, here's a customized 3-day Hangzhou itinerary for you both:\\n\\nDay 1: Morning visit to Maojiabu and Yanggong Causeway; afternoon tour of Tianmuliart Museum for modern exhibitions. Dinner at Shengli River Food Street for safe and authentic local cuisine.\\n\\nDay 2: Early morning visit to Lingyin Temple, walk along quiet Tianzhu Road. Afternoon focus on Zhejiang Provincial Museum Zhijiang Hall for major international art exhibitions. Dinner at local Xinfeng Snacks (allergen-safe).\\n\\nDay 3: Morning traditional boat ride in Xixi Wetland. Afternoon leisure at Xiaohe Street cafe, ending the journey.",
            },
        ],
    },
)
print(f"2.3 Event added successfully: {event['event_id']}")

# 3. Wait for record extraction
print("3. Wait for record extraction")
time.sleep(10 * 60)

# 4. Search records
search_records = client.search_records(
    content="I want to go to Hangzhou, help me plan a trip",
    session_id=session_id,
    # strategies=['Task_Information'],
    order_by={"created_at": -1},
    limit=10,
)
print(f"4. Found {len(search_records['records'])} related records")
print(json.dumps(search_records, ensure_ascii=False, indent=2))

# 5. Delete session
delete_result = client.delete_session(
    session_id=session_id,
)
print(f"5. Session deleted successfully: {delete_result['affected_count'] > 0}")

client.close()
