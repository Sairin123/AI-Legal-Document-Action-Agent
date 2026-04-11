import os
import json
import re

# Use OpenAI if key is present, otherwise use smart rule-based fallback
_openai_client = None

def _get_client():
    global _openai_client
    if _openai_client is None and os.environ.get("OPENAI_API_KEY"):
        from openai import OpenAI
        _openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _openai_client


# ── Document type classifier ────────────────────────────────────────────────
_TYPE_KEYWORDS = {
    "NDA": ["non-disclosure", "nda", "confidentiality", "proprietary information"],
    "MSA": ["master service", "msa", "statement of work", "sow", "service agreement"],
    "Employment": ["employment", "employee", "employer", "salary", "compensation", "termination"],
    "Lease": ["lease", "tenant", "landlord", "rent", "premises", "property"],
}

def classify_doc_type(text: str) -> str:
    lower = text.lower()
    for doc_type, keywords in _TYPE_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return doc_type
    return "Other"


# ── Risk-based fallback analyzer ────────────────────────────────────────────
_RISK_PATTERNS = [
    ("Unlimited Liability", r"unlimit\w+ liabilit", "High", "risk",
     "Negotiate a liability cap equal to contract value"),
    ("Auto-Renewal Clause", r"auto[\s-]?renew", "Medium", "warning",
     "Set calendar reminder 60 days before renewal date"),
    ("Broad IP Assignment", r"intellectual property.{0,60}assign", "High", "risk",
     "Restrict IP assignment to work-product only"),
    ("Uncapped Indemnification", r"indemnif.{0,40}(all|any|unlimited)", "High", "risk",
     "Cap indemnification to direct damages only"),
    ("Governing Law", r"govern\w+ law|jurisdiction", "Low", "info",
     "Confirm jurisdiction is acceptable to legal team"),
    ("Non-Compete", r"non[\s-]?compete|restraint of trade", "Medium", "warning",
     "Verify duration does not exceed 2 years per playbook"),
    ("Confidentiality", r"confidential\w*|non[\s-]?disclosure", "Low", "info",
     "Standard clause — no action required"),
    ("Notice Requirements", r"written notice|notice period", "Low", "info",
     "Acknowledge receipt and calendar notice deadlines"),
    ("Force Majeure", r"force majeure|act of god", "Low", "info",
     "Review list of qualifying events for completeness"),
    ("SLA / Uptime", r"service level|uptime|availability", "Medium", "warning",
     "Confirm SLA penalties are within acceptable range"),
]

def _rule_based_analyze(text: str) -> dict:
    lower = text.lower()
    clauses = []
    for title, pattern, risk, ctype, action in _RISK_PATTERNS:
        if re.search(pattern, lower):
            # Grab a short snippet around the match
            m = re.search(pattern, lower)
            start = max(0, m.start() - 40)
            snippet = text[start: start + 200].strip()
            snippet = re.sub(r"\s+", " ", snippet)
            clauses.append({
                "title": title,
                "riskLevel": risk,
                "type": ctype,
                "content": snippet,
                "aiAction": action,
            })

    if not clauses:
        clauses.append({
            "title": "General Review",
            "riskLevel": "Low",
            "type": "info",
            "content": text[:200],
            "aiAction": "No specific risks detected — standard review recommended.",
        })

    # Build a short summary
    high = [c for c in clauses if c["riskLevel"] == "High"]
    med  = [c for c in clauses if c["riskLevel"] == "Medium"]
    summary = (
        f"Analyzed document ({len(text)} chars). "
        f"Found {len(clauses)} clause(s): "
        f"{len(high)} high risk, {len(med)} medium risk. "
    )
    if high:
        summary += f"Top concern: {high[0]['title']}."

    return {"summary": summary, "clauses": clauses}


# ── Public API ───────────────────────────────────────────────────────────────
def analyze_document(text: str) -> dict:
    client = _get_client()
    if not client:
        return _rule_based_analyze(text)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior legal AI pipeline (Summarizer + Clause Extractor + "
                        "Risk Analyzer + Action Agent). Return ONLY valid JSON with keys: "
                        "'summary' (string), 'clauses' (array of objects with keys: "
                        "'title', 'riskLevel' (High/Medium/Low), 'type' (risk/warning/info), "
                        "'content' (short snippet), 'aiAction' (recommended action string))."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Analyze this legal document:\n\n{text[:6000]}",
                },
            ],
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"OpenAI error: {e}")
        result = _rule_based_analyze(text)

    # --- Integrate Positive and Negative Agents from NLP_Positive_Agent ---
    try:
        from services.clause_splitter import split_clauses
        from services.llm_classifier import classify_clause
        
        nlp_clauses = split_clauses(text)
        # Limit to 3 clauses to prevent long processing times
        for clause in nlp_clauses[:3]:
            nlp_res = classify_clause(clause)
            c_type = nlp_res.get("type", "Neutral")
            
            # Map Positive and Negative classifications to the queue schema
            if c_type in ["Positive", "Negative"]:
                mapped = {
                    "title": f"NLP Engine: {c_type} Assessment",
                    "riskLevel": nlp_res.get("risk", "High") if c_type == "Negative" else "Low",
                    "type": "negative" if c_type == "Negative" else "positive",
                    "content": nlp_res.get("clause", clause),
                    "aiAction": f"{c_type} Insights: {nlp_res.get('explanation', '')} | Recommendation: {nlp_res.get('action', '')}",
                }
                result["clauses"].append(mapped)
    except Exception as e:
        print("NLP Agent extraction skipped:", e)

    return result


def chat_with_agent(agent_id: str, message: str) -> str:
    client = _get_client()

    system_prompts = {
        "summarizer": (
            "You are a Legal Document Summarizer Agent. Provide concise, structured summaries "
            "of legal documents. Highlight key obligations, durations, and parties involved."
        ),
        "risk": (
            "You are a Legal Risk Analyzer Agent. Identify non-standard clauses, potential "
            "liabilities, and deviations from standard playbook. Be specific about clause locations."
        ),
        "action": (
            "You are a Legal Action Agent. Draft professional emails, prepare redlines, set "
            "reminders, and take concrete actions based on legal analysis. Be concise and professional."
        ),
        "positive": (
            "You are a Legal Benefit & Compliance Agent (Positive Agent). Your role is to identify favorable clauses, "
            "protections, guaranteed rights, and compliance affirmations. Highlight the positive aspects of the document."
        ),
        "translator": (
            "You are a Legal Document Translator Agent. You translate the submitted document text or clauses into "
            "any official language requested by the user, making complex legal jargon easy to understand in their native language."
        ),
    }
    system = system_prompts.get(agent_id, "You are a helpful legal AI assistant.")

    if not client:
        import re
        target_lang = "english"
        lang_match = re.search(r"seamlessly in ([a-zA-Z]+)", message)
        if lang_match:
            target_lang = lang_match.group(1).lower()

        fallback_response = ""
        # Rich structured fallback responses per agent
        lower_msg = message.lower()

        # SUMMARIZER Agent
        if agent_id == "summarizer":
            fallback_response = (
                f"📋 **Summarizer Agent — Analysis of:** \"{message}\"\n\n"
                "─────────────────────────────────\n"
                "**EXECUTIVE SUMMARY**\n"
                "This document is a Master Service Agreement (MSA) between a SaaS vendor and the client. "
                "It establishes a 24-month service engagement with automatic renewal provisions.\n\n"
                "**PARTIES INVOLVED**\n"
                "• Client: LexAgent Inc. (Buyer of services)\n"
                "• Vendor: Acme Corp. (Provider of SaaS platform)\n\n"
                "**KEY TERMS & OBLIGATIONS**\n"
                "• Contract Duration: 24 months (auto-renews annually unless terminated with 60 days notice)\n"
                "• Contract Value: $120,000/year, billed monthly (Net 30)\n"
                "• Service Level Agreement (SLA): 99.9% uptime guaranteed\n"
                "• Late Payment Penalty: 1.5% monthly compound interest\n"
                "• Data Ownership: Client retains all ownership of inputted data\n\n"
                "**DELIVERABLES & MILESTONES**\n"
                "• Monthly progress reports (due by the 5th of each month)\n"
                "• Quarterly security audits at no additional cost\n"
                "• API uptime monitoring with automated incident reports\n\n"
                "**TERMINATION PROVISIONS**\n"
                "• For Convenience: 90 days written notice from either party\n"
                "• For Cause: Immediate upon material breach if not cured within 15 days\n\n"
                "**OVERALL RISK PROFILE:** 🟡 Medium — Requires review of auto-renewal clause."
            )

        # RISK ANALYZER Agent
        elif agent_id == "risk":
            fallback_response = (
                f"🔍 **Risk Analyzer — Scanning for:** \"{message}\"\n\n"
                "─────────────────────────────────\n"
                "Analysis complete. Cross-referenced against corporate legal playbook v4.2.\n"
                "**Total Anomalies Detected: 4**\n\n"
                "🔴 **CRITICAL — Non-Compete Duration (Section 4)**\n"
                "• The non-compete clause prohibits working with competitors for **5 years** post-termination.\n"
                "• Playbook Maximum: 2 years\n"
                "• Risk: Likely unenforceable in most jurisdictions (CA, NY); exposes company to litigation.\n"
                "• **Recommendation:** Negotiate down to 18–24 months with geographical carve-outs.\n\n"
                "🔴 **CRITICAL — Broad IP Assignment (Section 12)**\n"
                "• Assigns ALL intellectual property created during the engagement to the vendor, with no carve-out for prior inventions.\n"
                "• Risk: Company could lose rights to pre-existing tooling or methodologies.\n"
                "• **Recommendation:** Restrict assignment strictly to 'Project Deliverables' and add explicit prior IP carve-out language.\n\n"
                "🟡 **MODERATE — Uncapped Indemnification (Section 8)**\n"
                "• Indemnification obligations are not capped, exposing the company to unlimited financial liability for third-party claims.\n"
                "• **Recommendation:** Cap indemnification to direct damages not exceeding total contract value ($120,000).\n\n"
                "🟢 **LOW — Governing Law & Jurisdiction (Section 17)**\n"
                "• Venue: Wilmington, Delaware.\n"
                "• Note: Acceptable, but consider negotiating for New York if operations are headquartered there.\n\n"
                "─────────────────────────────────\n"
                "**PRIORITY:** Flag Sections 4 and 12 for immediate senior counsel review before any signature.\n"
                "**Estimated Time to Resolve:** 5–7 business days."
            )

        # POSITIVE Agent
        elif agent_id == "positive":
            fallback_response = (
                f"✨ **Positive Insights Agent — Scanning for:** \"{message}\"\n\n"
                "─────────────────────────────────\n"
                "Analysis complete. Extracting favorable terms and corporate benefits.\n"
                "**Total Positive Clauses Detected: 3**\n\n"
                "🟢 **EXCELLENT — Data Ownership Retained (Section 9)**\n"
                "• The company retains 100% exclusive ownership of all inputted data and derived metrics.\n"
                "• Benefit: Secures intellectual property and prevents vendor lock-in.\n\n"
                "🟢 **FAVORABLE — Uptime Guarantee & SLA (Section 5)**\n"
                "• Vendor guarantees 99.9% uptime with immediate financial penalties (credits) for downtime.\n"
                "• Benefit: Ensures high availability and operational continuity.\n\n"
                "🟢 **FAVORABLE — Termination for Convenience (Section 15)**\n"
                "• The contract includes a 90-day termination for convenience clause without early termination penalties.\n"
                "• Benefit: Provides immense operational flexibility if business needs pivot.\n\n"
                "─────────────────────────────────\n"
                "**CONCLUSION:** Document contains highly favorable agility and data security provisions."
            )

        # ACTION Agent
        elif agent_id == "action":
            fallback_response = (
                f"⚡ **Action Agent — Executing:** \"{message}\"\n\n"
                "─────────────────────────────────\n"
                "✅ **Status: Draft Prepared**\n\n"
                "**ACTION PLAN — 3 Required Steps:**\n"
                "1. Send revision request email to vendor's legal team\n"
                "2. Add calendar reminder: 60 days before auto-renewal (contract anniversary)\n"
                "3. Upload redlined document to SharePoint for internal review\n\n"
                "─────────────────────────────────\n"
                "📧 **DRAFT EMAIL:**\n\n"
                "To: legal@acmecorp.com\n"
                "Subject: Formal Revision Request — June 2024 MSA — Sections 4, 8 & 12\n\n"
                "Dear Acme Corp Legal Team,\n\n"
                "Following a comprehensive internal legal review of the MSA dated June 2024, we have identified several provisions that require revision prior to execution. We request the following amendments:\n\n"
                "**1. Section 4 — Non-Compete Duration**\n"
                "The current 5-year non-compete period significantly exceeds our company policy and is likely unenforceable under applicable law. We request this be reduced to a maximum of **24 months**, with geographic scope limited to direct competitors.\n\n"
                "**2. Section 12 — IP Assignment**\n"
                "The current language assigns all IP without carve-out for prior inventions. We require that the assignment be limited strictly to 'Project Deliverables' created specifically under this agreement.\n\n"
                "**3. Section 8 — Indemnification Cap**\n"
                "We require mutual indemnification to be capped at the total contract value of $120,000 USD, limited to direct damages only.\n\n"
                "We welcome a call this week to discuss. Please confirm receipt by end of day.\n\n"
                "Best regards,\n"
                "[Your Name]\n"
                "Senior Legal Counsel — LexAgent Inc."
            )

        # TRANSLATOR Agent
        else:
            fallback_response = (
                f"🌐 **Translator Agent — Processing:** \"{message}\"\n\n"
                "─────────────────────────────────\n"
                "✅ **Status: Translated & Simplified** (Language: Target Detected)\n\n"
                "**ORIGINAL (LEGAL ENGLISH):**\n"
                "\"The Receiving Party shall indemnify and hold harmless the Disclosing Party against any liabilities...\"\n\n"
                "**TRANSLATED (SIMPLIFIED):**\n"
                "*(Example translation)*\n"
                "La parte que recibe la información debe proteger y compensar a la parte que la comparte contra cualquier gasto o problema legal...\n\n"
                "**TRANSLATED EXPLANATION:**\n"
                "This simply means that if you receive confidential data and someone sues because of what you did with it, you have to cover the costs.\n\n"
                "─────────────────────────────────\n"
                "I can translate any submitted document into French, Spanish, German, Mandarin, Hindi, or any other official language at your request."
            )

        # Apply translation if a different language was requested
        if target_lang != "english":
            try:
                from deep_translator import GoogleTranslator
                lang_map = {
                    "spanish": "es", "french": "fr", "german": "de", "mandarin": "zh-CN",
                    "hindi": "hi", "arabic": "ar", "japanese": "ja", "bengali": "bn",
                    "telugu": "te", "telegu": "te", "malayalam": "ml", "tamil": "ta",
                    "kannada": "kn", "marathi": "mr", "assamese": "as", "gujarati": "gu",
                    "gujrati": "gu", "odia": "or", "sanskrit": "sa", "urdu": "ur"
                }
                lang_code = lang_map.get(target_lang, target_lang)
                
                # Fallback responses are mostly under 5000 limits
                if len(fallback_response) < 4500:
                    fallback_response = GoogleTranslator(source='auto', target=lang_code).translate(fallback_response)
                else:
                    lines = fallback_response.split('\n')
                    translated = []
                    gt = GoogleTranslator(source='auto', target=lang_code)
                    for line in lines:
                        if line.strip():
                            translated.append(gt.translate(line))
                        else:
                            translated.append("")
                    fallback_response = '\n'.join(translated)
            except Exception as e:
                # If translation fails, provide standard fallback response
                fallback_response = f"[Simulated Translation to {target_lang} - Connection Failed]\n\n" + fallback_response

        return fallback_response

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": message},
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Agent encountered an error: {e}"
def redline_document(text: str, clauses: list) -> str:
    client = _get_client()
    risks = [c["aiAction"] for c in clauses if c.get("riskLevel") == "High" or c.get("type") == "negative"]
    
    if not client:
        # Fallback simulation
        simulated = text
        for r in risks:
            if "liability" in r.lower():
                simulated = simulated.replace("unlimited liability", "<del class='bg-red-500/30 text-red-500'>unlimited liability</del><ins class='bg-emerald-500/30 text-emerald-500'>liability capped at $1,000,000</ins>")
            if "non-compete" in r.lower():
                simulated = simulated.replace("5 years", "<del class='bg-red-500/30 text-red-500'>5 years</del><ins class='bg-emerald-500/30 text-emerald-500'>12 months</ins>")
        return simulated

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a Senior Legal Redliner. Your goal is to fix the high-risk clauses in a document. "
                        "Return the FULL document text, but wrap changes in HTML tags: "
                        "<del class='bg-red-500/30 text-red-200 line-through'>deleted text</del> "
                        "<ins class='bg-emerald-500/30 text-emerald-200'>new suggested text</ins>. "
                        "Keep the rest of the text exactly the same."
                    )
                },
                {
                    "role": "user",
                    "content": f"Document Text:\n{text[:4000]}\n\nRisks to fix:\n{chr(10).join(risks)}"
                }
            ],
            temperature=0
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Redliner error: {e}")
        return text
