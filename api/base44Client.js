export const base44 = {
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }) => {
        const isKannada = /Current User Language:\s*Kannada/i.test(prompt);
        const lowerPrompt = prompt.toLowerCase();
        let message;

        if (lowerPrompt.includes('route') || lowerPrompt.includes('transport')) {
          message = isKannada
            ? 'ನಿಮ್ಮ ಮಾರ್ಗಕ್ಕಾಗಿ ನಗರದ ಬಸ್, ಟ್ಯಾಕ್ಸಿ ಮತ್ತು ಆಟೋ ಆಯ್ಕೆಗಳು ಲಭ್ಯ. ಒಟ್ಟು ದೂರ ಸುಮಾರು ೫ ಕಿಮೀ.'
            : 'City buses, taxis, and autos run between the venues with an average distance of about 5 km.';
        } else if (lowerPrompt.includes('history') || lowerPrompt.includes('palace')) {
          message = isKannada
            ? 'ಮೈಸೂರು ಅರಮನೆ ದಸರಾ ಸಮಯದಲ್ಲಿ ಲಕ್ಷಾಂತರ ದೀಪಗಳಿಂದ ಬೆಳಗುತ್ತದೆ. ಜಂಬೂ ಸವಾರಿ ದಸರಾ ಕೊನೆಯ ದಿನ ರಾಜಮಾರ್ಗದಲ್ಲಿ ನಡೆಯುತ್ತದೆ.'
            : 'The Mysore Palace glows with nearly 100,000 lights during Dasara, and the iconic Jumbo Savari procession marks the finale.';
        } else {
          message = isKannada
            ? 'ನಮಸ್ಕಾರ! ದಸರಾ ಕಾರ್ಯಕ್ರಮಗಳು, ಸಂಚಾರ ಅಥವಾ ಇತಿಹಾಸದ ಬಗ್ಗೆ ಏನು ಬೇಕಾದರೂ ಕೇಳಿ.'
            : 'Namaskara! Ask me anything about Dasara events, travel, or history.';
        }

        return message;
      }
    }
  }
};
