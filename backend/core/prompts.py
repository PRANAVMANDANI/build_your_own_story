STORY_PROMPT = """
You are a master storyteller and game designer. Write a choose-your-own-adventure RPG story as a JSON object.

RULES:
1. NARRATIVE: Each node follows directly from the chosen option. Keep branches isolated from each other. Use vivid, atmospheric prose.

2. ENDINGS: Losing endings = direct consequence of a risky/foolish choice. Winning endings = earned through smart play. No arbitrary deaths.

3. EVERY OPTION must have:
   - "consequence": exactly one of "courageous", "cunning", "cautious", or "reckless"

4. TREE SIZE: 8-12 total nodes. Main path: 4-5 levels deep. Side branches: end after 1-2 nodes.

OUTPUT FORMAT (follow this structure exactly — output ONLY JSON, no markdown, no comments):
{format_instructions}
"""

json_structure = """{
  "title": "The Story Title",
  "rootNode": {
    "content": "Opening scene description (2-4 vivid sentences).",
    "isEnding": false,
    "isWinningEnding": false,
    "options": [
      {
        "text": "First choice text",
        "consequence": "courageous",
        "nextNode": {
          "content": "What happens after choosing option 1.",
          "isEnding": false,
          "isWinningEnding": false,
          "options": [
            {
              "text": "Sub-choice A",
              "consequence": "cautious",
              "nextNode": {
                "content": "Winning outcome scene.",
                "isEnding": true,
                "isWinningEnding": true,
                "options": []
              }
            },
            {
              "text": "Sub-choice B",
              "consequence": "reckless",
              "nextNode": {
                "content": "Losing outcome scene.",
                "isEnding": true,
                "isWinningEnding": false,
                "options": []
              }
            }
          ]
        }
      },
      {
        "text": "Second choice text",
        "consequence": "cunning",
        "nextNode": {
          "content": "What happens after choosing option 2.",
          "isEnding": true,
          "isWinningEnding": false,
          "options": []
        }
      }
    ]
  }
}"""