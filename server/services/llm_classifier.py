import json
import re
import os

def classify_clause(clause: str):
    """
    Classify a legal clause using OpenAI (if available) or fallback to rule-based classification.
    """
    prompt = f"""
You are a legal AI assistant.

Analyze the clause and return JSON.

Clause: "{clause}"

Return strictly in this JSON format:
{{
  "type": "Positive" | "Negative" | "Neutral",
  "explanation": "short explanation",
  "risk": "Low" | "Medium" | "High",
  "action": "Accept" | "Review" | "Reject",
  "benefit_score": number (1-10)
}}

Rules:
- Only return JSON
- No extra text
- benefit_score must be between 1 and 10
"""
    
    try:
        if os.environ.get("OPENAI_API_KEY"):
            from openai import OpenAI
            client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            output = response.choices[0].message.content.strip()
            
            # Extract JSON safely
            json_match = re.search(r"\{.*\}", output, re.DOTALL)
            if not json_match:
                raise ValueError("No valid JSON found in response")
            
            parsed = json.loads(json_match.group())
        else:
            # Fallback Rule-based logic for testing locally without API key
            is_pos = any(w in clause.lower() for w in ["guarantee", "right", "benefit", "comply", "own"])
            is_neg = any(w in clause.lower() for w in ["liability", "penalty", "breach", "indemnify"])
            ctype = "Positive" if is_pos else ("Negative" if is_neg else "Neutral")
            parsed = {
                "type": ctype,
                "explanation": "Automated rule-based classification.",
                "risk": "Low" if ctype == "Positive" else ("High" if ctype == "Negative" else "Medium"),
                "action": "Accept" if ctype == "Positive" else ("Reject" if ctype == "Negative" else "Review"),
                "benefit_score": 8 if ctype == "Positive" else (3 if ctype == "Negative" else 5)
            }

        # Normalize values (extra safety)
        parsed["type"] = parsed.get("type", "Neutral")
        parsed["explanation"] = parsed.get("explanation", "")
        parsed["risk"] = parsed.get("risk", "Unknown")
        parsed["action"] = parsed.get("action", "Review")

        # Ensure valid score
        score = parsed.get("benefit_score", 5)
        if not isinstance(score, int):
            score = 5
        score = max(1, min(score, 10))
        parsed["benefit_score"] = score

        # Add original clause
        parsed["clause"] = clause

        return parsed

    except Exception as e:
        # Fallback (never crash system)
        return {
            "clause": clause,
            "type": "Neutral",
            "explanation": f"Processing error: {str(e)}",
            "risk": "Unknown",
            "action": "Review",
            "benefit_score": 5
        }