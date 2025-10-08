import { getResources } from '../queries/getResources';
import type { KeystoneContext } from '@keystone-6/core/types';

export const suggestResources = async (parent: any, context: KeystoneContext) => {
  // Validate user authentication
  if (!context.session || !context.session.itemId) {
    throw new Error('User must be authenticated to get resource suggestions');
  }
  // Validate and fetch care plan/checklist data
  const maxSuggestions = parent.maxSuggestions ?? 5;
  if (maxSuggestions <= 0 || maxSuggestions > 5) {
    throw new Error('Maximum suggestions limit exceeded');
  }
  const checklist = await context.db.Checklist.findOne({ where: { id: parent.checklistId } });
  if (!checklist) {
    throw new Error('Checklist not found');
  }
  const carePlan = await context.db.CarePlan.findOne({
    where: { id: checklist.carePlanId as string | number | null | undefined },
  });
  if (!carePlan) {
    throw new Error('Care plan not found');
  }

  // Build an AI prompt using user context
  const prompt = `You are a healthcare resource specialist helping parents and caregivers find relevant resources. 
Based on the user ${context.session.itemId}'s ${carePlan} and ${checklist} information, suggest helpful resources including:
- Educational materials
- Support groups
- Professional services
- Emergency contacts
- Practical tools and guides`;
  // Call the gemini AI service and handle errors/timeouts
  // Parse the AI response and extract resource suggestions
  // Validate and save new resources to the database
  // Return the list of suggested resources
};
