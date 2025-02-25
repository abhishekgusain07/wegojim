import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function GET() {
    try{
        const { text } = await generateText({
            model: google("gemini-2.0-flash"),
            prompt: 'what is 5-3',
        });
        return new Response(JSON.stringify(text), {
            status: 200,
          })
    }catch(e){
        return new Response(JSON.stringify(e), {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            },
          })
    }
}