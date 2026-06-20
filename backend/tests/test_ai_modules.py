from app.ai.chatbot.engine import ChatbotEngine
from app.ai.trending.engine import TrendingEngine
from app.ai.recommendation.engine import RecommendationEngine


def test_chatbot_greeting(db_session):
    engine = ChatbotEngine(db_session)
    response = engine.process_message("hello", None)
    assert response["type"] == "text"
    assert "suggestions" in response


def test_chatbot_help(db_session):
    engine = ChatbotEngine(db_session)
    response = engine.process_message("help", None)
    assert "I can help" in response["message"]


def test_chatbot_shipping_info(db_session):
    engine = ChatbotEngine(db_session)
    response = engine.process_message("what is your shipping policy", None)
    assert "Shipping" in response["message"]


def test_chatbot_unknown_intent(db_session):
    engine = ChatbotEngine(db_session)
    response = engine.process_message("xyzabc123 random gibberish", None)
    assert response["type"] == "text"


def test_trending_engine_empty_db(db_session):
    engine = TrendingEngine(db_session)
    results = engine.get_trending_products(limit=5)
    assert isinstance(results, list)


def test_recommendation_engine_no_products(db_session):
    engine = RecommendationEngine(db_session)
    results = engine.get_similar_products(product_id=1, limit=5)
    assert results == []
