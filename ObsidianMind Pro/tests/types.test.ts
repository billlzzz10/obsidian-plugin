import { PluginError, ERROR_CODES } from '../src/modules/utils/types';

describe('Types and Errors', () => {
    describe('PluginError', () => {
        it('should create error with message and code', () => {
            const error = new PluginError('Test error', ERROR_CODES.API_ERROR);
            
            expect(error.message).toBe('Test error');
            expect(error.code).toBe(ERROR_CODES.API_ERROR);
            expect(error.name).toBe('PluginError');
            expect(error instanceof Error).toBe(true);
        });

        it('should handle different error codes', () => {
            const codes = [
                ERROR_CODES.API_KEY_MISSING,
                ERROR_CODES.MODEL_NOT_FOUND,
                ERROR_CODES.EMBEDDING_FAILED,
                ERROR_CODES.RAG_FAILED
            ];

            codes.forEach(code => {
                const error = new PluginError('Test', code);
                expect(error.code).toBe(code);
            });
        });
    });

    describe('ERROR_CODES', () => {
        it('should have all required error codes', () => {
            const requiredCodes = [
                'API_KEY_MISSING',
                'API_ERROR',
                'MODEL_NOT_FOUND',
                'EMBEDDING_FAILED',
                'RAG_FAILED',
                'NOTION_API_ERROR',
                'AIRTABLE_API_ERROR',
                'INVALID_SETTINGS',
                'UNKNOWN_ERROR'
            ];

            requiredCodes.forEach(code => {
                expect(ERROR_CODES).toHaveProperty(code);
                expect(typeof ERROR_CODES[code as keyof typeof ERROR_CODES]).toBe('string');
            });
        });
    });
});