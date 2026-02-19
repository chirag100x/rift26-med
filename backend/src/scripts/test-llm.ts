
import Groq from 'groq-sdk';
import { config } from 'dotenv';
import path from 'path';

// Load .env from backend root
config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
    console.error('❌ Error: GROQ_API_KEY not found in environment.');
    process.exit(1);
}

const groq = new Groq({
    apiKey: apiKey,
});

async function testConnection() {
    console.log('🔄 Testing Groq Connection...');
    console.log(`🔑 API Key (masked): ${apiKey?.substring(0, 8)}...`);
    console.log('🤖 Model: llama-3.3-70b-versatile');

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: 'Hello, are you working?',
                },
            ],
            model: 'llama-3.3-70b-versatile',
            max_tokens: 10,
        });

        console.log('✅ Success! Response:', completion.choices[0]?.message?.content);
    } catch (error: any) {
        console.error('❌ Failed to connect to Groq:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testConnection();
