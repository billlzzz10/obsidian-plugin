import { Plugin } from 'obsidian';
import { RAGService } from '../rag/RAGService';

interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    variables: string[];
    category: string;
}

export class PromptGenerator {
    private plugin!: Plugin;
    private ragService!: RAGService;
    private promptTemplates: Map<string, PromptTemplate> = new Map();

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async initialize() {
        this.ragService = this.plugin.ragService;
        this.loadDefaultPromptTemplates();
        this.loadCustomPromptTemplates();
        console.log('PromptGenerator initialized.');
    }

    private loadDefaultPromptTemplates() {
        const defaultTemplates: PromptTemplate[] = [
            {
                id: 'summarize',
                name: 'Summarize Content',
                description: 'Summarize the given content with key points',
                template: 'Please summarize the following content, highlighting the key points:\n\n{{content}}\n\nSummary:',
                variables: ['content'],
                category: 'Analysis'
            },
            {
                id: 'explain',
                name: 'Explain Concept',
                description: 'Explain a concept in simple terms',
                template: 'Please explain the concept of "{{concept}}" in simple terms that a {{audience}} can understand.\n\n{{context}}',
                variables: ['concept', 'audience', 'context'],
                category: 'Education'
            },
            {
                id: 'brainstorm',
                name: 'Brainstorm Ideas',
                description: 'Generate creative ideas for a topic',
                template: 'I need to brainstorm ideas for {{topic}}. Please provide {{count}} creative and practical ideas.\n\nContext: {{context}}\n\nIdeas:',
                variables: ['topic', 'count', 'context'],
                category: 'Creative'
            },
            {
                id: 'analyze',
                name: 'Analyze Information',
                description: 'Analyze information and provide insights',
                template: 'Please analyze the following information and provide insights:\n\n{{information}}\n\nFocus on: {{focus}}\n\nAnalysis:',
                variables: ['information', 'focus'],
                category: 'Analysis'
            },
            {
                id: 'compare',
                name: 'Compare Items',
                description: 'Compare two or more items',
                template: 'Please compare {{item1}} and {{item2}} in terms of:\n- {{criteria}}\n\nContext: {{context}}\n\nComparison:',
                variables: ['item1', 'item2', 'criteria', 'context'],
                category: 'Analysis'
            },
            {
                id: 'plan',
                name: 'Create Plan',
                description: 'Create a structured plan for a goal',
                template: 'I want to {{goal}}. Please create a detailed plan with steps and timeline.\n\nConstraints: {{constraints}}\nResources: {{resources}}\n\nPlan:',
                variables: ['goal', 'constraints', 'resources'],
                category: 'Planning'
            },
            {
                id: 'research',
                name: 'Research Questions',
                description: 'Generate research questions for a topic',
                template: 'I\'m researching {{topic}}. Please generate {{count}} research questions that would help me understand this topic better.\n\nContext: {{context}}\n\nResearch Questions:',
                variables: ['topic', 'count', 'context'],
                category: 'Research'
            },
            {
                id: 'write',
                name: 'Write Content',
                description: 'Write content in a specific style',
                template: 'Please write {{type}} about {{topic}} in a {{style}} style.\n\nTarget audience: {{audience}}\nLength: {{length}}\nKey points to include: {{points}}\n\nContent:',
                variables: ['type', 'topic', 'style', 'audience', 'length', 'points'],
                category: 'Writing'
            }
        ];

        defaultTemplates.forEach(template => {
            this.promptTemplates.set(template.id, template);
        });
    }

    private loadCustomPromptTemplates() {
        const customTemplates = this.plugin.settings.customPromptTemplates || [];
        customTemplates.forEach((template: PromptTemplate) => {
            this.promptTemplates.set(template.id, template);
        });
    }

    async generatePrompt(templateId: string, variables: Record<string, string>, useRAG: boolean = true): Promise<string> {
        const template = this.promptTemplates.get(templateId);
        if (!template) {
            throw new Error(`Prompt template '${templateId}' not found`);
        }

        let prompt = template.template;

        // Replace variables in the template
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
        }

        // Add RAG context if enabled and relevant
        if (useRAG && variables.topic) {
            try {
                const context = await this.ragService.getContextForPrompt(variables.topic, 1500);
                if (context) {
                    prompt += `\n\nRelevant information from your knowledge base:\n${context}`;
                }
            } catch (error) {
                console.warn('Failed to get RAG context for prompt:', error);
            }
        }

        return prompt;
    }

    async generateSmartPrompt(userInput: string, intent: string = 'general'): Promise<string> {
        // Analyze user input and generate an appropriate prompt
        let basePrompt = '';

        switch (intent.toLowerCase()) {
            case 'summarize':
                basePrompt = await this.generatePrompt('summarize', { content: userInput });
                break;
            case 'explain':
                basePrompt = await this.generatePrompt('explain', {
                    concept: userInput,
                    audience: 'general audience',
                    context: ''
                });
                break;
            case 'analyze':
                basePrompt = await this.generatePrompt('analyze', {
                    information: userInput,
                    focus: 'key insights and patterns'
                });
                break;
            default: {
                // For general queries, enhance with RAG context
                const context = await this.ragService.getContextForPrompt(userInput, 2000);
                basePrompt = userInput;
                if (context) {
                    basePrompt += `\n\nRelevant context from your knowledge base:\n${context}`;
                }
            }
        }

        return basePrompt;
    }

    getAvailableTemplates(): PromptTemplate[] {
        return Array.from(this.promptTemplates.values());
    }

    getTemplatesByCategory(category: string): PromptTemplate[] {
        return Array.from(this.promptTemplates.values()).filter(t => t.category === category);
    }

    getCategories(): string[] {
        const categories = new Set<string>();
        this.promptTemplates.forEach(template => categories.add(template.category));
        return Array.from(categories);
    }

    async addCustomTemplate(template: PromptTemplate): Promise<void> {
        this.promptTemplates.set(template.id, template);

        // Save to settings
        const customTemplates = this.plugin.settings.customPromptTemplates || [];
        const existingIndex = customTemplates.findIndex((t: {id: string}) => t.id === template.id);

        if (existingIndex >= 0) {
            customTemplates[existingIndex] = template;
        } else {
            customTemplates.push(template);
        }

        this.plugin.settings.customPromptTemplates = customTemplates;
        await this.plugin.saveData(this.plugin.settings);
    }

    async removeCustomTemplate(templateId: string): Promise<void> {
        this.promptTemplates.delete(templateId);

        // Remove from settings
        this.plugin.settings.customPromptTemplates =
            (this.plugin.settings.customPromptTemplates || []).filter((t: {id: string}) => t.id !== templateId);
        await this.plugin.saveData(this.plugin.settings);
    }

    // Generate prompt variations for A/B testing
    generatePromptVariations(basePrompt: string, count: number = 3): string[] {
        const variations = [basePrompt];

        // Add different styles and approaches
        const styles = [
            'Please provide a detailed and comprehensive response to: ',
            'In a clear and concise manner, please address: ',
            'From multiple perspectives, please examine: ',
            'Step by step, please explain: '
        ];

        for (let i = 1; i < count && i < styles.length; i++) {
            variations.push(styles[i] + basePrompt);
        }

        return variations;
    }

    async cleanup() {
        this.promptTemplates.clear();
        console.log('PromptGenerator cleaned up.');
    }
}

