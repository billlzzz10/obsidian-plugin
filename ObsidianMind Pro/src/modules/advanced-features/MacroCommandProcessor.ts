import { Plugin } from 'obsidian';
import { ChatService } from '../chat/ChatService';
import { ToolManager } from './ToolManager';
import { RAGService } from '../rag/RAGService';

interface MacroCommand {
    id: string;
    name: string;
    description: string;
    steps: MacroCommandStep[];
}

interface MacroCommandStep {
    type: 'ai_chat' | 'ai_generate_prompt' | 'ai_tool_use' | 'obsidian_command';
    value: string; // For ai_chat: prompt, for ai_generate_prompt: templateId, for ai_tool_use: toolId, for obsidian_command: commandId
    parameters?: Record<string, any>; // For ai_generate_prompt, ai_tool_use
    outputVariable?: string; // Variable to store the output of the step
    inputVariable?: string; // Variable to use as input for the step
}

export class MacroCommandProcessor {
    private plugin!: Plugin;
    private chatService!: ChatService;
    private toolManager!: ToolManager;
    private ragService!: RAGService;
    private macroCommands: Map<string, MacroCommand> = new Map();

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async initialize() {
        this.chatService = this.plugin.chatService;
        this.toolManager = this.plugin.advancedFeaturesManager.toolManager;
        this.ragService = this.plugin.ragService;
        this.loadDefaultMacroCommands();
        this.loadCustomMacroCommands();
        console.log('MacroCommandProcessor initialized.');
    }

    private loadDefaultMacroCommands() {
        const defaultMacros: MacroCommand[] = [
            {
                id: 'summarize_note_and_chat',
                name: 'Summarize Current Note and Chat',
                description: 'Summarizes the current active note and then allows chatting with the summary as context.',
                steps: [
                    {
                        type: 'obsidian_command',
                        value: 'editor:get-active-file-content', // Placeholder for getting current note content
                        outputVariable: 'noteContent'
                    },
                    {
                        type: 'ai_generate_prompt',
                        value: 'summarize',
                        parameters: { content: '{{noteContent}}' },
                        outputVariable: 'summaryPrompt'
                    },
                    {
                        type: 'ai_chat',
                        value: '{{summaryPrompt}}',
                        outputVariable: 'summaryResult'
                    },
                    {
                        type: 'ai_chat',
                        value: 'Based on the summary: {{summaryResult}}, what else would you like to know?',
                        outputVariable: 'followUpChat'
                    }
                ]
            },
            {
                id: 'research_and_create_note',
                name: 'Research Topic and Create Note',
                description: 'Researches a given topic using RAG and creates a new note with the findings.',
                steps: [
                    {
                        type: 'ai_generate_prompt',
                        value: 'research', // Assuming a 'research' template exists
                        parameters: { topic: '{{topic}}', count: 5 },
                        outputVariable: 'researchPrompt'
                    },
                    {
                        type: 'ai_chat',
                        value: '{{researchPrompt}}',
                        outputVariable: 'researchFindings'
                    },
                    {
                        type: 'ai_tool_use',
                        value: 'create_note',
                        parameters: {
                            title: 'Research on {{topic}}',
                            content: '{{researchFindings}}'
                        }
                    }
                ]
            }
        ];

        defaultMacros.forEach(macro => {
            this.macroCommands.set(macro.id, macro);
        });
    }

    private loadCustomMacroCommands() {
        const customMacros = this.plugin.settings.customMacroCommands || [];
        customMacros.forEach((macro: MacroCommand) => {
            this.macroCommands.set(macro.id, macro);
        });
    }

    async executeMacro(macroId: string, initialVariables: Record<string, any> = {}): Promise<any> {
        const macro = this.macroCommands.get(macroId);
        if (!macro) {
            throw new Error(`Macro command '${macroId}' not found`);
        }

        const variables: Record<string, any> = { ...initialVariables };

        for (const step of macro.steps) {
            let stepInput = step.value;
            // Replace variables in step input
            for (const [key, value] of Object.entries(variables)) {
                stepInput = stepInput.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }

            let stepOutput: any;

            try {
                switch (step.type) {
                    case 'ai_chat': {
                        const chatResponse = await this.chatService.sendMessage(stepInput);
                        stepOutput = chatResponse.content;
                        break;
                    }
                    case 'ai_generate_prompt': {
                        const promptGenerator = this.plugin.advancedFeaturesManager.promptGenerator;
                        const promptParams: Record<string, any> = {};
                        if (step.parameters) {
                            for (const [paramKey, paramValue] of Object.entries(step.parameters)) {
                                promptParams[paramKey] = typeof paramValue === 'string'
                                    ? this.replaceVariablesInString(paramValue, variables)
                                    : paramValue;
                            }
                        }
                        stepOutput = await promptGenerator.generatePrompt(stepInput, promptParams);
                        break;
                    }
                    case 'ai_tool_use': {
                        const toolParams: Record<string, any> = {};
                        if (step.parameters) {
                            for (const [paramKey, paramValue] of Object.entries(step.parameters)) {
                                toolParams[paramKey] = typeof paramValue === 'string'
                                    ? this.replaceVariablesInString(paramValue, variables)
                                    : paramValue;
                            }
                        }
                        stepOutput = await this.toolManager.executeTool(stepInput, toolParams);
                        break;
                    }
                    case 'obsidian_command':
                        // This is a placeholder. Actual Obsidian command execution is complex.
                        // For now, we'll simulate or require specific handlers.
                        if (step.value === 'editor:get-active-file-content') {
                            const activeFile = this.plugin.app.workspace.getActiveFile();
                            if (activeFile) {
                                stepOutput = await this.plugin.app.vault.read(activeFile);
                            } else {
                                throw new Error('No active file to get content from.');
                            }
                        } else {
                            // Attempt to execute a generic Obsidian command
                            const success = this.plugin.app.commands.executeCommandById(step.value);
                            if (!success) {
                                console.warn(`Obsidian command '${step.value}' not found or failed.`);
                            }
                            stepOutput = success ? 'Command executed successfully' : 'Command execution failed';
                        }
                        break;
                    default:
                        throw new Error(`Unknown macro step type: ${step.type}`);
                }

                if (step.outputVariable) {
                    variables[step.outputVariable] = stepOutput;
                }
            } catch (error) {
                console.error(`Error executing macro step ${step.type} (${step.value}):`, error);
                throw error; // Re-throw to stop macro execution on error
            }
        }

        return variables; // Return final state of variables
    }

    private replaceVariablesInString(text: string, variables: Record<string, any>): string {
        let result = text;
        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return result;
    }

    getAvailableMacroCommands(): MacroCommand[] {
        return Array.from(this.macroCommands.values());
    }

    async addCustomMacroCommand(macro: MacroCommand): Promise<void> {
        this.macroCommands.set(macro.id, macro);

        const customMacros = this.plugin.settings.customMacroCommands || [];
        const existingIndex = customMacros.findIndex((m: {id: string}) => m.id === macro.id);

        if (existingIndex >= 0) {
            customMacros[existingIndex] = macro;
        } else {
            customMacros.push(macro);
        }

        this.plugin.settings.customMacroCommands = customMacros;
        await this.plugin.saveData(this.plugin.settings);
    }

    async removeCustomMacroCommand(macroId: string): Promise<void> {
        this.macroCommands.delete(macroId);
        this.plugin.settings.customMacroCommands =
            (this.plugin.settings.customMacroCommands || []).filter((m: {id: string}) => m.id !== macroId);
        await this.plugin.saveData(this.plugin.settings);
    }

    async cleanup() {
        this.macroCommands.clear();
        console.log('MacroCommandProcessor cleaned up.');
    }
}

