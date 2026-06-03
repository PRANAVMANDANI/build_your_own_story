import json
import re
from sqlalchemy.orm import Session
from core.config import settings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from core.prompts import STORY_PROMPT, json_structure
from models.story import Story, StoryNode


class StoryGenerator:

    @classmethod
    def _get_llm(cls):
        # llama-3.1-8b-instant: ~3x faster than 70b, still strong at structured JSON
        return ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=settings.GROQ_API_KEY,
            temperature=0.7,
        ).bind(response_format={"type": "json_object"})

    @classmethod
    def generate_story(cls, db: Session, session_id: str, theme: str) -> Story:
        llm = cls._get_llm()

        prompt = ChatPromptTemplate.from_messages([
            ("system", STORY_PROMPT),
            ("user", "Generate a story based on the following theme: {theme}\n\nOutput ONLY valid JSON. No explanations, no markdown fences, no text outside the JSON object.")
        ]).partial(format_instructions=json_structure)

        raw_response = llm.invoke(prompt.invoke({"theme": theme}))
        response_text = raw_response.content if hasattr(raw_response, "content") else str(raw_response)

        # Strip markdown code fences if present
        response_text = re.sub(r"```(?:json)?\s*", "", response_text).strip().rstrip("`").strip()

        # Parse JSON directly — simpler than PydanticOutputParser
        story_data = json.loads(response_text)

        title = story_data.get("title", "Untitled Adventure")
        root_node_data = story_data.get("rootNode") or story_data.get("root_node")
        if not root_node_data:
            raise ValueError("LLM response missing 'rootNode'")

        story_db = Story(title=title, session_id=session_id)
        db.add(story_db)
        db.flush()

        cls._process_story_node(db, story_db.id, root_node_data, is_root=True)
        db.commit()
        return story_db

    @classmethod
    def _process_story_node(cls, db: Session, story_id: int, node_data: dict, is_root: bool = False) -> StoryNode:
        VALID_CONSEQUENCES = {"courageous", "cunning", "cautious", "reckless"}

        node = StoryNode(
            story_id=story_id,
            content=node_data.get("content", ""),
            is_ending=node_data.get("isEnding", node_data.get("is_ending", False)),
            is_winning_ending=node_data.get("isWinningEnding", node_data.get("is_winning_ending", False)),
            is_root=is_root,
            mood="mysterious",
            options=[]
        )
        db.add(node)
        db.flush()

        is_ending = node.is_ending
        raw_options = node_data.get("options") or []

        if not is_ending and raw_options:
            options_list = []
            for option in raw_options:
                next_node_data = option.get("nextNode") or option.get("next_node")
                if not next_node_data:
                    continue

                child_node = cls._process_story_node(db, story_id, next_node_data, is_root=False)

                consequence = option.get("consequence", "cautious")
                if consequence not in VALID_CONSEQUENCES:
                    consequence = "cautious"

                options_list.append({
                    "text": option.get("text", "Continue"),
                    "node_id": child_node.id,
                    "consequence": consequence,
                    "risk_level": 1,
                })

            node.options = options_list
            db.flush()

        return node