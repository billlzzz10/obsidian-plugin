# Obsidian AI Plugin Examples

This document provides practical examples of how to use the Obsidian AI Plugin in various scenarios.

## Basic Chat Examples

### Example 1: Asking about your notes
```
User: What are the main topics I've been writing about lately?

AI: Based on your recent notes, you've been focusing on several key areas:

1. **Machine Learning & AI**: You have extensive notes on neural networks, deep learning architectures, and recent developments in large language models.

2. **Personal Knowledge Management**: Several notes discuss PKM systems, note-taking methodologies, and tools like Obsidian and Roam Research.

3. **Project Management**: You've documented various project management frameworks including Agile, Scrum, and GTD (Getting Things Done).

4. **Philosophy of Mind**: Recent entries explore consciousness, cognitive science, and the hard problem of consciousness.

5. **Book Reviews**: You've been actively reviewing books on productivity, technology, and philosophy.

The most frequently referenced topics appear to be AI/ML concepts and knowledge management strategies.
```

### Example 2: Research assistance
```
User: I'm writing about the history of artificial intelligence. Can you help me find relevant information from my notes?

AI: I found several relevant sources in your knowledge base about AI history:

**From your notes:**
- "AI Timeline.md" - Contains a comprehensive timeline from 1950s to present
- "Turing Test Origins.md" - Discusses Alan Turing's contributions and the famous test
- "Winter of AI.md" - Covers the AI winters of the 1970s and 1980s

**Key points from your research:**
1. **1950s Foundation**: Alan Turing's "Computing Machinery and Intelligence" (1950) and the Dartmouth Conference (1956) marked the beginning of AI as a field.

2. **Early Optimism (1950s-1960s)**: Initial breakthroughs in problem-solving programs and the development of LISP programming language.

3. **First AI Winter (1974-1980)**: Funding cuts due to unmet expectations and limitations of early approaches.

4. **Expert Systems Era (1980s)**: Rise of knowledge-based systems and commercial AI applications.

5. **Second AI Winter (Late 1980s-1990s)**: Market collapse of expert systems and reduced interest.

6. **Modern Renaissance (2000s-present)**: Big data, improved algorithms, and computational power leading to current AI boom.

Would you like me to elaborate on any specific period or aspect?
```

## Templater Integration Examples

### Example 1: Daily Note with AI Summary
```liquid
# Daily Note - <% tp.date.now("YYYY-MM-DD") %>

## Yesterday's Summary
<% tp.user.ai_summarize(tp.file.find_tfile("Daily Notes/" + tp.date.now("YYYY-MM-DD", -1)).content, 200) %>

## Today's Focus Areas
<% tp.user.ai_generate_content("productive daily goals based on recent work patterns", "list", "short") %>

## Knowledge Base Insights
<% tp.user.ai_search("recent insights and learnings", 3) %>
```

### Example 2: Meeting Notes Template
```liquid
# Meeting Notes - <% tp.date.now("YYYY-MM-DD HH:mm") %>

**Attendees:** 
**Topic:** 

## Meeting Content
<!-- Take your notes here -->

## AI-Generated Summary
<% tp.user.ai_summarize(tp.file.content, 300) %>

## Action Items
<% tp.user.ai_extract_info(tp.file.content, "action items and tasks") %>

## Related Information
<% tp.user.ai_search(tp.file.title, 2) %>
```

### Example 3: Research Note Template
```liquid
# Research: <% tp.file.title %>

## Overview
<!-- Your research content -->

## Key Insights
<% tp.user.ai_extract_info(tp.file.content, "key insights and important findings") %>

## Questions for Further Research
<% tp.user.ai_generate_content("research questions based on: " + tp.file.title, "list", "medium") %>

## Related Notes
<% tp.user.ai_search(tp.file.title, 5) %>

## AI Analysis
<% tp.user.ai_chat("Analyze this research topic and suggest potential connections to other fields: " + tp.file.title) %>
```

## Prompt Generator Examples

### Example 1: Using the Summarize Template
```
Template: summarize
Variables:
- content: "Your long article or note content here..."

Generated Prompt:
"Please summarize the following content, highlighting the key points:

[Your content here]

Summary:"
```

### Example 2: Using the Brainstorm Template
```
Template: brainstorm
Variables:
- topic: "Improving team productivity"
- count: "10"
- context: "Remote software development team of 8 people"

Generated Prompt:
"I need to brainstorm ideas for Improving team productivity. Please provide 10 creative and practical ideas.

Context: Remote software development team of 8 people

Ideas:"
```

### Example 3: Custom Template for Code Review
```json
{
  "id": "code_review",
  "name": "Code Review Assistant",
  "description": "Help review code for best practices and improvements",
  "template": "Please review the following {{language}} code for:\n- Best practices\n- Potential bugs\n- Performance improvements\n- Security issues\n\nCode:\n```{{language}}\n{{code}}\n```\n\nReview:",
  "variables": ["language", "code"],
  "category": "Development"
}
```

## Macro Command Examples

### Example 1: Research and Create Note Macro
```json
{
  "id": "research_and_create",
  "name": "Research Topic and Create Note",
  "description": "Research a topic using RAG and create a comprehensive note",
  "steps": [
    {
      "type": "ai_search",
      "value": "{{topic}}",
      "parameters": { "maxResults": 5 },
      "outputVariable": "searchResults"
    },
    {
      "type": "ai_generate_prompt",
      "value": "research",
      "parameters": { 
        "topic": "{{topic}}", 
        "count": "5",
        "context": "{{searchResults}}"
      },
      "outputVariable": "researchPrompt"
    },
    {
      "type": "ai_chat",
      "value": "{{researchPrompt}}",
      "outputVariable": "researchContent"
    },
    {
      "type": "ai_tool_use",
      "value": "create_note",
      "parameters": {
        "title": "Research: {{topic}}",
        "content": "# Research: {{topic}}\n\n{{researchContent}}\n\n## Sources\n{{searchResults}}"
      }
    }
  ]
}
```

### Example 2: Weekly Review Macro
```json
{
  "id": "weekly_review",
  "name": "Weekly Review Generator",
  "description": "Generate a weekly review based on recent notes",
  "steps": [
    {
      "type": "ai_tool_use",
      "value": "list_notes",
      "parameters": { "folder": "Daily Notes" },
      "outputVariable": "recentNotes"
    },
    {
      "type": "ai_chat",
      "value": "Based on these recent daily notes, create a weekly review highlighting key accomplishments, challenges, and insights: {{recentNotes}}",
      "outputVariable": "weeklyReview"
    },
    {
      "type": "ai_tool_use",
      "value": "create_note",
      "parameters": {
        "title": "Weekly Review - {{currentWeek}}",
        "content": "{{weeklyReview}}"
      }
    }
  ]
}
```

## Custom Tools Examples

### Example 1: Simple Note Statistics Tool
```json
{
  "id": "note_stats",
  "name": "Note Statistics",
  "description": "Get statistics about a specific note",
  "parameters": [
    {
      "name": "notePath",
      "type": "string",
      "description": "Path to the note",
      "required": true
    }
  ],
  "category": "Analysis",
  "type": "script",
  "handler": "return { wordCount: content.split(' ').length, charCount: content.length, lineCount: content.split('\\n').length };"
}
```

### Example 2: External API Integration Tool
```json
{
  "id": "weather_lookup",
  "name": "Weather Lookup",
  "description": "Get current weather for a location",
  "parameters": [
    {
      "name": "location",
      "type": "string",
      "description": "City name or coordinates",
      "required": true
    }
  ],
  "category": "External",
  "type": "api",
  "endpoint": "https://api.openweathermap.org/data/2.5/weather",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}
```

## Integration Examples

### Notion Integration
```
# Setting up Notion Integration

1. Create a Notion Integration:
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Name it "Obsidian AI Plugin"
   - Copy the integration token (starts with secret_)

2. Share databases with your integration:
   - Open each database you want to sync
   - Click "Share" → "Invite"
   - Select your integration

3. Configure in Obsidian:
   - Paste the integration token in plugin settings
   - Add database IDs (found in database URLs)
   - Click "Sync Now"
```

### Airtable Integration
```
# Setting up Airtable Integration

1. Create a Personal Access Token:
   - Go to https://airtable.com/create/tokens
   - Click "Create new token"
   - Add scopes: data.records:read, schema.bases:read
   - Add bases you want to access
   - Copy the token (starts with pat)

2. Configure in Obsidian:
   - Paste the token in plugin settings
   - Add base IDs (found in base URLs)
   - Click "Sync Now"
```

## Performance Tips

### Optimizing for Large Knowledge Bases
```
1. Chunk Size Optimization:
   - For technical content: 300-500 characters
   - For narrative content: 500-800 characters
   - For reference material: 200-400 characters

2. Embedding Model Selection:
   - Mobile devices: all-MiniLM-L6-v2 (384d, 22MB)
   - Desktop with good specs: all-mpnet-base-v2 (768d, 420MB)

3. Sync Frequency:
   - Active projects: Every 30-60 minutes
   - Stable knowledge base: Every 4-6 hours
   - Archive material: Daily or weekly
```

### Memory Management
```
1. Regular Cleanup:
   - Rebuild embeddings monthly for active vaults
   - Clear chat history periodically
   - Remove unused external integrations

2. Batch Processing:
   - Process notes in groups of 50-100
   - Use auto-sync during off-peak hours
   - Monitor system resources during embedding
```

These examples should help you get started with the various features of the Obsidian AI Plugin. Experiment with different configurations to find what works best for your workflow!

