import json
import logging

from tdaimemory import MemoryClient
from tdaimemory.errors import ParamError, TDAIException

logging.basicConfig(level=logging.WARNING)

# Initialize client
EndPoint = "https://memory.tdai.tencentyun.com"
ApiKey = "***************************"
MemoryId = "tdai-mem-********"

client = MemoryClient(endpoint=EndPoint, api_key=ApiKey, memory_id=MemoryId, default_actor_id="actor-xxx")

try:
    # 1. Create session
    session = client.create_session(
        name="Travel_Consultation",
    )
    session_id = session["session_id"]
    print(f"1. Session created successfully: {session_id}")

    # 2. Query sessions
    sessions = client.query_sessions(order_by={"created_at": -1}, limit=3, offset=0)
    print(f"2. Found {len(sessions['sessions'])} sessions")

    # 3. Update session
    updated = client.update_session(
        session_id=session_id,
        name="Travel_Consultation_update",
    )
    print(f"3. Session updated successfully: {updated['affected_count']}")

    # 4. Search sessions
    search_result = client.search_sessions(content="Travel", order_by={"created_at": -1}, limit=2)
    print(f"4. Found {len(search_result['sessions'])} related sessions")

    # 5. Add event
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
                {
                    "role": "user",
                    "content": "Great! The hotel needs to have a gym, and I'm severely allergic to peanuts, please be careful when booking restaurants.",
                },
                {
                    "role": "assistant",
                    "content": "Understood! I've noted all your requirements (preference for quiet places, love of food, hotel with gym, severe peanut allergy). Here are selected hotels with gyms:\\n\\nWest Lake Lu Yi Boutique Hotel: Located in West Lake District, quiet design, equipped with gym, away from downtown, meeting your need for tranquility.\\n\\nHangzhou Xixi Zijingang DoubleTree by Hilton: Near Xixi Wetland, complete facilities, professional gym, suitable for Day 3 wetland itinerary.",
                },
                {
                    "role": "user",
                    "content": "Perfect! By the way, my girlfriend prefers modern art. Any recommendations?",
                },
                {
                    "role": "assistant",
                    "content": "Got it! Considering your girlfriend's preference, here's a customized 3-day Hangzhou itinerary for you both:\\n\\nDay 1: Morning visit to Maojiabu and Yanggong Causeway; afternoon tour of Tianmuliart Museum for modern exhibitions. Dinner at Shengli River Food Street for safe and authentic local cuisine.\\n\\nDay 2: Early morning visit to Lingyin Temple, walk along quiet Tianzhu Road. Afternoon focus on Zhejiang Provincial Museum Zhijiang Hall for major international art exhibitions. Dinner at local Xinfeng Snacks (allergen-safe).\\n\\nDay 3: Morning traditional boat ride in Xixi Wetland. Afternoon leisure at Xiaohe Street cafe, ending the journey.",
                },
            ],
            "bool_field": False,
            "str_field": "test",
            "int_field": 1,
        },
    )
    print(f"5. Event added successfully: {event['event_id']}")

    # 6. Query events
    events = client.query_events(
        session_id=session_id,
        # where={"bool_field": False},
        order_by={"created_at": -1},
        limit=20,
        offset=0,
    )
    print(f"6. Found {len(events['events'])} events")
    print(json.dumps(events, ensure_ascii=False, indent=2))

    # 7. Delete event
    if events["events"]:
        event_id = events["events"][0]["event_id"]
        del_result = client.delete_event(
            session_id=session_id,
            event_id=event_id,
        )
        print(f"7. Event deleted successfully: {del_result['affected_count'] > 0}")

    # 8. Set state
    set_state_result = client.set_state(
        session_id=session_id,
        state={
            "user_preference_theme": "dark",
            "user_language": "en-US",
            "notification_enabled": True,
            "last_login_time": "2025-08-10T12:00:00Z",
            "session_timeout": 3600,
        },
    )
    print(f"8. State set successfully: {set_state_result['affected_count']}")

    # 9. Get state
    state = client.get_states(
        session_id=session_id,
        keys=["user_preference_theme", "user_language"],
    )
    print(f"9. Current state: {state['state']}")

    # 10. Get all states
    all_states = client.get_all_states(
        session_id=session_id,
    )
    print(f"10. All states: {all_states['state']}")

    # 11. Delete states
    del_state_result = client.delete_states(
        session_id=session_id,
        keys=["session_timeout"],
    )
    print(f"11. States deleted successfully: {del_state_result['affected_count'] > 0}")

    # 12. Flush states
    flush_result = client.flush_states(
        session_id=session_id,
    )
    print(f"12. States flushed successfully: {flush_result['affected_count']}")

    # 13. Add record
    record = client.append_record(
        session_id=session_id,
        content="Food preference: authentic local flavors first",
        strategy="Task_Information",
    )
    record_id = record["record_id"]
    print(f"13. Record added successfully: {record_id}")

    # 14. Query records
    records = client.query_records(
        session_id=session_id,
        strategies=["Task_Information"],
        # where={"record_id": "record-xxx"},
        order_by={"created_at": -1},
        limit=15,
        offset=0,
    )
    print(f"14. Found {len(records['records'])} records")
    # print(json.dumps(records, ensure_ascii=False, indent=2))

    # 15. Update record
    update_result = client.update_record(
        session_id=session_id,
        record_id=record_id,
        content="Travel environment: prefer quiet places with fewer people",
    )
    print(f"15. Record updated successfully: {update_result}")

    # 16. Search records
    search_records = client.search_records(
        content="food preference",
        session_id=session_id,
        # strategies=["Task_Information"],
        # where={"record_id": "record-xxx"},
        order_by={"created_at": -1},
        limit=10,
    )
    print(f"16. Found {len(search_records['records'])} related records")
    print(json.dumps(records, ensure_ascii=False, indent=2))

    # 17. Delete record
    if len(records["records"]) > 0:
        record_id = records["records"][0]["record_id"]
        del_record_result = client.delete_record(
            session_id=session_id,
            record_id=record_id,
        )
        print(f"17. Record deleted successfully: {del_record_result['affected_count'] > 0}")

    # 18. Delete session
    delete_result = client.delete_session(
        session_id=session_id,
    )
    print(f"18. Session deleted successfully: {delete_result['affected_count'] > 0}")
except ParamError as e:
    print(f"Parameter error: {e}")
except TDAIException as e:
    print(f"Service error: {e}")
except Exception as e:
    print(f"Other error: {e}")
finally:
    client.close()
