from config import OPENAI_API_KEY

print("KEY FOUND:", bool(OPENAI_API_KEY))
print(OPENAI_API_KEY[:6])  # should print sk-xxxx
