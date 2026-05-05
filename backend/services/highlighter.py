import html
import re


def highlight_sentences(text: str, snippets: list[str]) -> str:
    escaped = html.escape(text)
    unique_snippets = [snippet.strip() for snippet in snippets if snippet.strip()]
    unique_snippets = sorted(set(unique_snippets), key=len, reverse=True)

    for snippet in unique_snippets[:40]:
        pattern = re.compile(re.escape(html.escape(snippet)), flags=re.IGNORECASE)
        escaped = pattern.sub(lambda m: f"<mark>{m.group(0)}</mark>", escaped)

    return escaped
