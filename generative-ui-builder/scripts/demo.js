/**
 * Demo script to test the Generative UI Builder API
 * 
 * Usage: node scripts/demo.js
 */

const API_URL = 'http://localhost:3000/api/build';

async function demoBuild() {
  console.log('🎨 Generative UI Builder - Demo Script\n');
  console.log('=====================================\n');

  const prompts = [
    {
      prompt: 'Build a simple landing page with a hero section, features grid, and footer',
      theme: 'modern'
    },
    {
      prompt: 'Create a login form with email/password fields and social login buttons',
      theme: 'dark'
    },
    {
      prompt: 'Design a pricing page with three tiers: Basic, Pro, and Enterprise',
      theme: 'light'
    }
  ];

  for (let i = 0; i < prompts.length; i++) {
    const { prompt, theme } = prompts[i];
    
    console.log(`\n📝 Test ${i + 1}/${prompts.length}`);
    console.log(`Prompt: ${prompt}`);
    console.log(`Theme: ${theme}\n`);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, theme }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Build successful!');
        console.log(`   App ID: ${result.appId}`);
        console.log(`   Messages: ${result.messages.length}`);
        
        if (result.previewUrl) {
          console.log(`   Preview URL: ${result.previewUrl}`);
        }
        
        // Show last few messages
        const lastMessages = result.messages.slice(-3);
        console.log('   Last updates:');
        lastMessages.forEach(msg => console.log(`     ${msg}`));
      } else {
        console.log('❌ Build failed:', result.error);
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }

    // Wait between requests
    if (i < prompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n=====================================');
  console.log('Demo complete!\n');
}

// Run demo
demoBuild().catch(console.error);
