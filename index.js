require('dotenv').config();
const Groq = require('groq-sdk');
const readline = require('readline');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const profil = {
  nom: "Jean",
  age: 30,
  objectifs: ["perdre du poids", "mieux dormir"],
  regime: "normal",
  carences: ["calcium", "vitamine D"],
  styleTenues: "casual"
};

const systemPrompt = `Tu es un coach de vie personnel et bienveillant. 
Tu connais parfaitement ton utilisateur :
- Nom: ${profil.nom}
- Age: ${profil.age} ans
- Objectifs: ${profil.objectifs.join(', ')}
- Régime: ${profil.regime}
- Carences détectées: ${profil.carences.join(', ')}
- Style vestimentaire: ${profil.styleTenues}

Tu donnes des conseils personnalisés sur la nutrition, le sommeil, les tenues et le bien-être.
Tu es chaleureux, motivant et précis. Tu parles en français.`;

const messages = [{ role: "system", content: systemPrompt }];

async function chat(userMessage) {
  messages.push({ role: "user", content: userMessage });
  
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages
  });

  const reply = response.choices[0].message.content;
  messages.push({ role: "assistant", content: reply });
  return reply;
}

function poserQuestion() {
  rl.question('\nToi: ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log('À demain ! 💪');
      rl.close();
      return;
    }
    
    const reponse = await chat(input);
    console.log(`\nCoach IA: ${reponse}\n`);
    poserQuestion();
  });
}

console.log('🌟 Bonjour ! Je suis ton Coach IA personnel. Comment puis-je t\'aider aujourd\'hui ?');
console.log('(tape "exit" pour quitter)\n');
poserQuestion();
