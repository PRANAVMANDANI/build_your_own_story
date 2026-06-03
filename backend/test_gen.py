import json, re, os, time, sys
sys.path.insert(0, ".")
from dotenv import load_dotenv
load_dotenv()

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from core.prompts import STORY_PROMPT, json_structure

llm = ChatGroq(model="llama-3.1-8b-instant", groq_api_key=os.getenv("GROQ_API_KEY"), temperature=0.7).bind(response_format={"type": "json_object"})
prompt = ChatPromptTemplate.from_messages([
    ("system", STORY_PROMPT),
    ("user", "Generate a story based on the following theme: {theme}\n\nOutput ONLY valid JSON. No markdown fences.")
]).partial(format_instructions=json_structure)

t = time.time()
r = llm.invoke(prompt.invoke({"theme": "a pirate adventure"}))
elapsed = time.time() - t

text = r.content.strip()
# Strip markdown fences
text = re.sub(r"```(?:json)?\s*", "", text).strip().strip("`").strip()
data = json.loads(text)
print(f"OK in {elapsed:.1f}s")
print(f"Title: {data['title']}")
print(f"First option consequence: {data['rootNode']['options'][0]['consequence']}")
