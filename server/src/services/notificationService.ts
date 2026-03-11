export const sendWhatsAppNotification = async (phone: string, message: string) => {
    console.log(`Sending WhatsApp to ${phone}: ${message}`);
    // Integration logic would go here (Twilio, Gupshup, etc.)
    return Promise.resolve(true);
};

export const sendSMSNotification = async (phone: string, message: string) => {
    console.log(`Sending SMS to ${phone}: ${message}`);
    return Promise.resolve(true);
};
