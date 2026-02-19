
import { llmService } from '../services/llm.service';
import { config } from 'dotenv';
import path from 'path';

// Load .env manually because we are running this script directly
config({ path: path.join(__dirname, '../../.env') });

async function testService() {
    console.log('🔄 Testing LlmService...');

    const context = {
        drug: 'CODEINE',
        gene: 'CYP2D6',
        phenotype: 'PM',
        variants: '*4',
        recommendation: 'Avoid codeine.',
        risk_level: 'Toxic',
        mode: 'patient' as const
    };

    try {
        const result = await llmService.generateExplanation(context);
        console.log('✅ Result:', result);
    } catch (error) {
        console.error('❌ Service Call Failed:', error);
    }
}

testService();
