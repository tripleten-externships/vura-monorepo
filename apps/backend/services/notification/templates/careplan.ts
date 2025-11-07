interface CarePlanNotificationData {
  userName: string;
  carePlanName: string;
  progress?: number;
  actionUrl: string;
}

//Notification when a user is assigned a new care plan

export function carePlanAssignedTemplate({
  userName,
  carePlanName,
  actionUrl,
}: CarePlanNotificationData) {
  return {
    subject: `New Care Plan Assigned: ${carePlanName}`,
    message: `Hi ${userName}, you've been assigned a new care plan called **${carePlanName}**. Start working on it today!`,
    actionLabel: 'View Care Plan',
    actionUrl,
  };
}

//Notification when a user makes progress in a care plan

export function carePlanProgressTemplate({
  userName,
  carePlanName,
  progress = 0,
  actionUrl,
}: CarePlanNotificationData) {
  return {
    subject: `You're ${progress}% through ${carePlanName}!`,
    message: `Hey ${userName}, you're making great progress on "${carePlanName}". Keep it up,  you're already ${progress}% done!`,
    actionLabel: 'Continue Your Plan',
    actionUrl,
  };
}

//Notification when a care plan is completed

export function carePlanCompletedTemplate({
  userName,
  carePlanName,
  actionUrl,
}: CarePlanNotificationData) {
  return {
    subject: `Care Plan Completed: ${carePlanName}`,
    message: `Congratulations ${userName}! You've successfully completed "${carePlanName}". Excellent work staying consistent!`,
    actionLabel: 'View Results',
    actionUrl,
  };
}

//To choose template based on notification type

export function getCarePlanNotificationTemplate(
  type: 'assigned' | 'progress' | 'completed',
  data: CarePlanNotificationData
) {
  switch (type) {
    case 'assigned':
      return carePlanAssignedTemplate(data);
    case 'progress':
      return carePlanProgressTemplate(data);
    case 'completed':
      return carePlanCompletedTemplate(data);
    default:
      throw new Error(`Unknown care plan notification type: ${type}`);
  }
}
