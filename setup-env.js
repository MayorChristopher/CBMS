#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 CBMS Environment Setup\n');

const envPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local file already exists!');
    console.log('Please check if it contains the correct Supabase credentials.\n');

    const content = fs.readFileSync(envPath, 'utf8');
    if (content.includes('your_supabase_project_url') || content.includes('your_supabase_anon_key')) {
        console.log('❌ Your .env.local file contains placeholder values.');
        console.log('Please replace them with your actual Supabase credentials.\n');
    } else {
        console.log('✅ Your .env.local file appears to be configured.');
    }
} else {
    console.log('📝 Creating .env.local file...\n');

    const envContent = `# Supabase Configuration
# Replace these placeholder values with your actual Supabase project credentials
# You can find these in your Supabase project dashboard under Settings > API

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Example format:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
`;

    fs.writeFileSync(envPath, envContent);

    console.log('✅ Created .env.local file with placeholder values.');
    console.log('📋 Next steps:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Create a new project or select an existing one');
    console.log('   3. Navigate to Settings → API');
    console.log('   4. Copy your Project URL and anon key');
    console.log('   5. Replace the placeholder values in .env.local');
    console.log('   6. Restart your development server\n');
}

console.log('📖 For detailed instructions, see SETUP.md');
console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard');