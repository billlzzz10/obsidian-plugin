// Test basic utility functions that don't depend on Obsidian
function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function chunkText(text: string, chunkSize: number, chunkOverlap: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        const chunk = text.substring(i, Math.min(i + chunkSize, text.length));
        chunks.push(chunk);
        i += chunkSize - chunkOverlap;
        if (i < 0) i = 0; // Ensure i doesn't go negative
    }
    return chunks;
}

function validateApiKey(apiKey: string, provider: string): boolean {
    if (!apiKey || apiKey.trim() === "") {
        return false;
    }
    // Basic validation based on provider
    switch (provider) {
        case "openai":
            return apiKey.startsWith("sk-");
        case "anthropic":
            return apiKey.startsWith("sk-ant-");
        case "google":
            return apiKey.startsWith("AI");
        default:
            return true; // Assume valid for unknown providers
    }
}

describe('Helper Functions', () => {
    describe('generateId', () => {
        it('should generate a unique string ID', () => {
            const id1 = generateId();
            const id2 = generateId();
            
            expect(typeof id1).toBe('string');
            expect(typeof id2).toBe('string');
            expect(id1).not.toBe(id2);
            expect(id1.length).toBeGreaterThan(0);
        });
    });

    describe('chunkText', () => {
        it('should split text into chunks of specified size', () => {
            const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
            const chunks = chunkText(text, 50, 10);
            
            expect(Array.isArray(chunks)).toBe(true);
            expect(chunks.length).toBeGreaterThan(1);
            expect(chunks[0].length).toBeLessThanOrEqual(50);
        });

        it('should handle overlap correctly', () => {
            const text = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const chunks = chunkText(text, 10, 2);
            
            expect(chunks.length).toBeGreaterThan(1);
            // Check that chunks overlap
            for (let i = 1; i < chunks.length; i++) {
                const prevChunk = chunks[i - 1];
                const currentChunk = chunks[i];
                const overlap = prevChunk.slice(-2);
                expect(currentChunk).toContain(overlap.slice(0, 1));
            }
        });

        it('should handle empty text', () => {
            const chunks = chunkText('', 100, 10);
            expect(chunks).toEqual([]);
        });
    });

    describe('validateApiKey', () => {
        it('should validate OpenAI API keys', () => {
            expect(validateApiKey('sk-1234567890abcdef', 'openai')).toBe(true);
            expect(validateApiKey('invalid-key', 'openai')).toBe(false);
            expect(validateApiKey('', 'openai')).toBe(false);
        });

        it('should validate Anthropic API keys', () => {
            expect(validateApiKey('sk-ant-1234567890abcdef', 'anthropic')).toBe(true);
            expect(validateApiKey('invalid-key', 'anthropic')).toBe(false);
            expect(validateApiKey('', 'anthropic')).toBe(false);
        });

        it('should validate Google API keys', () => {
            expect(validateApiKey('AI1234567890abcdef', 'google')).toBe(true);
            expect(validateApiKey('invalid-key', 'google')).toBe(false);
            expect(validateApiKey('', 'google')).toBe(false);
        });

        it('should accept any valid key for unknown providers', () => {
            expect(validateApiKey('any-valid-key', 'unknown')).toBe(true);
            expect(validateApiKey('', 'unknown')).toBe(false);
            expect(validateApiKey('   ', 'unknown')).toBe(false);
        });
    });
});