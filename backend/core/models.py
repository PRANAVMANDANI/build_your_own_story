from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class StoryOptionLLM(BaseModel):
    text: str = Field(description="the text of the option shown to user")
    consequence: Literal["courageous", "cunning", "cautious", "reckless"] = Field(
        default="cautious",
        description="the type of choice: courageous, cunning, cautious, or reckless"
    )
    next_node: 'StoryNodeLLM' = Field(alias="nextNode", description="the next node content and its options")


class StoryNodeLLM(BaseModel):
    content: str = Field(description="the content of the story node")
    is_ending: bool = Field(alias="isEnding", description="whether the node is an ending node")
    is_winning_ending: bool = Field(alias="isWinningEnding", default=False, description="whether the node is a winning ending node")
    options: Optional[List[StoryOptionLLM]] = Field(default=None, description="the options for the story node")

class StoryLLMResponse(BaseModel):
    title: str = Field(description="the title of the story")
    root_node: StoryNodeLLM = Field(alias="rootNode", description="the root node of the story")

# Rebuild models to resolve recursive references
StoryNodeLLM.model_rebuild()